/** Location chooser: GPS (with permission) or a manual city — used by the prayer screen and settings. */
import { useState } from 'react';
import { TextInput, View } from 'react-native';

import { Button } from '@/components/core/Button';
import { Press } from '@/components/core/Press';
import { Txt } from '@/components/core/Txt';
import { BottomSheet } from '@/components/overlays/BottomSheet';
import { CITIES } from '@/services/cities';
import { locateDevice, LOCATION_ERRORS, setManualCity } from '@/services/location';
import { useApp } from '@/state/app-store';
import { useUi } from '@/state/ui-store';
import { useTheme } from '@/theme/theme';

export function CityPickerSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t, font, r } = useTheme();
  const [q, setQ] = useState('');
  const setSetting = useApp((s) => s.setSetting);
  const list = CITIES.filter((c) => !q.trim() || c.name.includes(q.trim()) || c.country.includes(q.trim()));
  return (
    <BottomSheet visible={visible} onClose={onClose} maxHeight={0.85} label="اختر مدينتك">
      <Txt font="display" size={26} weight={700} accessibilityRole="header">
        اختر مدينتك
      </Txt>
      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder="ابحث باسم المدينة أو الدولة"
        placeholderTextColor={t.muted}
        accessibilityLabel="بحث عن مدينة"
        style={{ height: 48, borderWidth: 1, borderColor: t.line, borderRadius: r(14), backgroundColor: t.bg, color: t.ink, fontFamily: font('ui'), fontSize: 17, paddingHorizontal: 14, textAlign: 'right' }}
      />
      {list.map((c) => (
        <Press
          key={c.id}
          label={`${c.name}، ${c.country}`}
          onPress={() => {
            setManualCity(c);
            setSetting('loc', 'يدوي');
            onClose();
          }}
          style={{ minHeight: 52, borderBottomWidth: 1, borderColor: t.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Txt size={17} weight={600}>
            {c.name}
          </Txt>
          <Txt size={14} color={t.muted}>
            {c.country}
          </Txt>
        </Press>
      ))}
      {!list.length && (
        <Txt size={15} color={t.muted} align="center">
          لا نتائج. جرّب اسمًا آخر.
        </Txt>
      )}
    </BottomSheet>
  );
}

/** Card shown while no location is set, and the «use my location» action used elsewhere. */
export function useLocateAction() {
  const flash = useUi((s) => s.flash);
  const setSetting = useApp((s) => s.setSetting);
  const [busy, setBusy] = useState(false);
  const locate = async () => {
    setBusy(true);
    const res = await locateDevice();
    setBusy(false);
    if (res.ok) {
      setSetting('loc', 'تلقائي');
      flash(res.fix.label ? `تم تحديد موقعك: ${res.fix.label}` : 'تم تحديد موقعك');
    } else flash(LOCATION_ERRORS[res.error]);
    return res;
  };
  return { locate, busy };
}

export function NeedLocationCard({ onPickCity }: { onPickCity: () => void }) {
  const { t, r, cs } = useTheme();
  const { locate, busy } = useLocateAction();
  return (
    <View style={{ backgroundColor: cs.backgroundColor, borderColor: cs.borderColor, borderWidth: cs.borderWidth, boxShadow: cs.boxShadow, borderRadius: r(22), padding: 16, gap: 10 }}>
      <Txt size={17} weight={700}>
        حدّد موقعك لحساب المواقيت والقبلة
      </Txt>
      <Txt size={14} color={t.muted} lh={1.7}>
        يُستخدم الموقع على جهازك فقط لحساب المواقيت واتجاه القبلة، ولا يُرسل إلى أي خادم.
      </Txt>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Button onPress={locate} disabled={busy} style={{ flex: 1 }}>
          {busy ? 'جارٍ التحديد…' : 'استخدم موقعي'}
        </Button>
        <Button variant="secondary" onPress={onPickCity} style={{ flex: 1 }}>
          اختر مدينة
        </Button>
      </View>
    </View>
  );
}
