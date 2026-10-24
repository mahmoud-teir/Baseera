/** Location chooser: GPS (with permission) or a country and city — used by the prayer screen and settings. */
import { useState } from 'react';
import { TextInput, View } from 'react-native';

import { Button } from '@/components/core/Button';
import { Press } from '@/components/core/Press';
import { Txt } from '@/components/core/Txt';
import { BottomSheet } from '@/components/overlays/BottomSheet';
import { CITIES, citiesIn, COUNTRIES, normalizeSearch, type City } from '@/services/cities';
import { locateDevice, LOCATION_ERRORS, setManualCity } from '@/services/location';
import { useApp } from '@/state/app-store';
import { useUi } from '@/state/ui-store';
import { useTheme } from '@/theme/theme';

/**
 * Two steps: the country (every country, Arabic names), then a city in it — or «استخدم موقعي».
 * Searching at the first step also finds cities directly.
 */
export function CityPickerSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t, font, r } = useTheme();
  const [q, setQ] = useState('');
  const [cc, setCc] = useState<string | null>(null);
  const setSetting = useApp((s) => s.setSetting);
  const current = useApp((s) => s.location?.cc);
  const { locate, busy } = useLocateAction();
  const nq = normalizeSearch(q);
  const match = (...names: string[]) => !nq || names.some((n) => normalizeSearch(n).includes(nq));

  const close = () => {
    setQ('');
    setCc(null);
    onClose();
  };
  const choose = (c: City) => {
    setManualCity(c);
    setSetting('loc', 'يدوي');
    close();
  };
  const openCountry = (code: string) => {
    setCc(code);
    setQ('');
  };

  const country = cc ? COUNTRIES.find((c) => c.cc === cc) : undefined;
  const cities = cc ? citiesIn(cc).filter((c) => match(c.name)) : nq.length >= 2 ? CITIES.filter((c) => match(c.name)) : [];
  const countries = cc ? [] : COUNTRIES.filter((c) => match(c.name, c.en, c.cc)).sort((a, b) => Number(b.cc === current) - Number(a.cc === current));

  const row = { minHeight: 52, borderBottomWidth: 1, borderColor: t.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 } as const;
  return (
    <BottomSheet visible={visible} onClose={close} maxHeight={0.85} label={country ? `اختر مدينتك في ${country.name}` : 'اختر دولتك'}>
      <Txt font="display" size={26} weight={700} accessibilityRole="header">
        {country ? country.name : 'اختر دولتك'}
      </Txt>
      {country ? (
        <Press onPress={() => setCc(null)} label="كل الدول" style={{ minHeight: 40, justifyContent: 'center', alignSelf: 'flex-start' }}>
          <Txt size={15} weight={600} color={t.primary}>
            → كل الدول
          </Txt>
        </Press>
      ) : (
        <Button variant="secondary" onPress={async () => (await locate()).ok && close()} disabled={busy}>
          {busy ? 'جارٍ التحديد…' : 'استخدم موقعي (GPS)'}
        </Button>
      )}
      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder={country ? 'ابحث عن مدينتك' : 'ابحث باسم الدولة أو المدينة'}
        placeholderTextColor={t.muted}
        accessibilityLabel={country ? 'بحث عن مدينة' : 'بحث عن دولة أو مدينة'}
        style={{ height: 48, borderWidth: 1, borderColor: t.line, borderRadius: r(14), backgroundColor: t.bg, color: t.ink, fontFamily: font('ui'), fontSize: 17, paddingHorizontal: 14, textAlign: 'right' }}
      />
      {cities.map((c) => (
        <Press key={c.id} label={`${c.name}، ${c.country}`} onPress={() => choose(c)} style={row}>
          <Txt size={17} weight={600} style={{ flexShrink: 1 }}>
            {c.name}
          </Txt>
          <Txt size={14} color={t.muted}>
            {c.capital ? 'العاصمة' : country ? '' : c.country}
          </Txt>
        </Press>
      ))}
      {countries.map((c) => (
        <Press key={c.cc} label={c.name} onPress={() => openCountry(c.cc)} style={row}>
          <Txt size={17} weight={600} style={{ flexShrink: 1 }}>
            {c.name}
          </Txt>
          <Txt size={14} color={t.muted}>
            {c.cc === current ? 'دولتك الحالية' : c.en}
          </Txt>
        </Press>
      ))}
      {country && (
        <Txt size={13} color={t.muted} lh={1.7}>
          إن لم تجد مدينتك فاختر أقرب مدينة إليها، أو استخدم موقعك لأدقّ المواقيت.
        </Txt>
      )}
      {!cities.length && !countries.length && (
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
