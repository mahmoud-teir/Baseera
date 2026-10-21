/**
 * Frame-level overlays from the prototype: «سلسلة الدليل» (evidence chain), «أبلغ عن خطأ»
 * (report) and the toast. Opened from anywhere through the UI store.
 */
import { useEffect, useState } from 'react';
import { TextInput, View } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/core/Button';
import { ChoiceChips } from '@/components/core/parts';
import { Txt } from '@/components/core/Txt';
import { LEVEL_NONE, LEVEL_NOTES, LEVELS, REPORT_REASONS } from '@/data/structural';
import { submitReport } from '@/services/reports';
import { useUi } from '@/state/ui-store';
import { TAB_BAR_HEIGHT, useLayout } from '@/theme/layout';
import { useTheme } from '@/theme/theme';

import { BottomSheet } from './BottomSheet';

export function EvidenceChainSheet() {
  const { t, gc, r } = useTheme();
  const chain = useUi((s) => s.chain);
  const close = useUi((s) => s.closeChain);
  const openReport = useUi((s) => s.openReport);
  const d = chain?.d ?? {};
  const lvl = (d.level ?? 0) - 1;
  const steps: { title: string; value: string | null | undefined; display?: boolean }[] = [
    { title: 'المسألة', value: chain?.where },
    { title: 'المصدر', value: d.source && d.ref ? `${d.source} · ${d.ref}` : d.source || null },
    // Verified text is shown only together with its source (HANDOFF §1).
    { title: 'النص المراجَع', value: d.text && d.source ? d.text : null, display: true },
    { title: 'وجه الاستدلال', value: d.wajh },
    { title: 'شرح المسألة', value: d.explain },
  ];
  return (
    <BottomSheet visible={!!chain} onClose={close} maxHeight={0.9} label="سلسلة الدليل" z={32}>
      <Txt font="display" size={26} weight={700} accessibilityRole="header">
        سلسلة الدليل
      </Txt>
      <View style={{ backgroundColor: t.goldSoft, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12 }}>
        <Txt size={14} color={t.goldInk} lh={1.7}>
          {chain?.where}
        </Txt>
      </View>
      <View>
        {steps.map((s, i) => (
          <View key={s.title} style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ alignItems: 'center' }}>
              <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: s.value ? t.primary : t.lockBg, alignItems: 'center', justifyContent: 'center' }}>
                <Txt size={14} color={t.onPrimary}>
                  {s.value ? '✓' : ''}
                </Txt>
              </View>
              {i < steps.length - 1 && <View style={{ flex: 1, width: 2, backgroundColor: t.line, minHeight: 10 }} />}
            </View>
            <View style={{ flex: 1, paddingBottom: 14, gap: 6 }}>
              <Txt size={15} weight={700} color={t.primary}>
                {s.title}
              </Txt>
              {s.value ? (
                <Txt font={s.display ? 'display' : 'ui'} size={s.display ? 19 : 14} lh={1.9} color={t.ink}>
                  {s.value}
                </Txt>
              ) : (
                <View style={{ borderWidth: 1.5, borderStyle: 'dashed', borderColor: gc, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 10 }}>
                  <Txt size={14} color={t.goldInk} lh={1.7}>
                    يُدرج بعد المراجعة العلمية.
                  </Txt>
                </View>
              )}
            </View>
          </View>
        ))}
      </View>
      <View style={{ gap: 8 }}>
        <Txt size={15} weight={700}>
          مستوى الاعتماد العلمي
        </Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {LEVELS.map((l, i) => (
            <View
              key={l}
              accessibilityState={{ selected: lvl === i }}
              style={{
                width: '48.5%',
                flexGrow: 1,
                borderWidth: 1.5,
                borderColor: lvl === i ? gc : t.line,
                backgroundColor: lvl === i ? t.goldSoft : 'transparent',
                borderRadius: 12,
                paddingVertical: 8,
                paddingHorizontal: 6,
              }}>
              <Txt size={14} weight={600} color={lvl === i ? t.goldInk : t.muted} align="center" lh={1.5}>
                {l}
              </Txt>
            </View>
          ))}
        </View>
        <Txt size={14} color={t.body} lh={1.8}>
          {lvl >= 0 ? LEVEL_NOTES[lvl] : LEVEL_NONE}
        </Txt>
      </View>
      <Txt size={14} color={t.muted} lh={1.8}>
        المراجعون: {d.reviewers?.length ? d.reviewers.join('، ') : 'يُدرج'} · تاريخ المراجعة: {d.reviewedAt || 'يُدرج'}
      </Txt>
      <View style={{ backgroundColor: t.errBg, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12 }}>
        <Txt size={14} color={t.errInk} lh={1.8}>
          لا تُعرض استنتاجات غير معتمدة كحقائق قطعية، ويُبيَّن مستوى كل مسألة.
        </Txt>
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button variant="secondary" onPress={() => openReport(chain?.where ?? '')} style={{ flex: 1, minHeight: 50 }} radius={r(16)}>
          أبلغ عن خطأ
        </Button>
        <Button onPress={close} style={{ flex: 1, minHeight: 50 }} radius={r(16)}>
          إغلاق
        </Button>
      </View>
    </BottomSheet>
  );
}

export function ReportSheet() {
  const report = useUi((s) => s.report);
  const seq = useUi((s) => s.reportSeq);
  const close = useUi((s) => s.closeReport);
  return (
    <BottomSheet visible={!!report} onClose={close} maxHeight={0.88} label="أبلغ عن خطأ" z={34}>
      {/* Keyed so every report opens with an empty form. */}
      {report && <ReportForm key={seq} where={report.where} />}
    </BottomSheet>
  );
}

function ReportForm({ where }: { where: string }) {
  const { t, r, font } = useTheme();
  const close = useUi((s) => s.closeReport);
  const flash = useUi((s) => s.flash);
  const [reason, setReason] = useState<(typeof REPORT_REASONS)[number] | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const send = async () => {
    if (!reason || busy) return;
    setBusy(true);
    try {
      const res = await submitReport({ where, reason, note });
      close();
      flash(res.status === 'sent' ? `وصل بلاغك لفريق المراجعة · رقم ${res.id}` : 'حُفظ بلاغك على جهازك وسيُرسل لفريق المراجعة عند توفّر الاتصال');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Txt font="display" size={26} weight={700} accessibilityRole="header">
        أبلغ عن خطأ
      </Txt>
      <View style={{ backgroundColor: t.goldSoft, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12 }}>
        <Txt size={14} color={t.goldInk} lh={1.7}>
          الموضع: {where}
        </Txt>
      </View>
      <ChoiceChips
        options={REPORT_REASONS.map((x) => ({ value: x, label: x }))}
        value={reason}
        onChange={(v) => setReason(v)}
        borderWidth={1}
      />
      <TextInput
        value={note}
        onChangeText={setNote}
        multiline
        maxLength={2000}
        accessibilityLabel="ملاحظة البلاغ"
        placeholder="ما الصواب؟ اقترح التصحيح مع المصدر إن أمكن (اختياري)"
        placeholderTextColor={t.muted}
        style={{
          minHeight: 84,
          borderWidth: 1,
          borderColor: t.line,
          borderRadius: 14,
          backgroundColor: t.bg,
          color: t.ink,
          fontFamily: font('ui'),
          fontSize: 16,
          padding: 12,
          textAlignVertical: 'top',
          textAlign: 'right',
        }}
      />
      <Txt size={13} color={t.muted} lh={1.7}>
        يصل بلاغك لفريق المراجعة العلمية، ويُسجَّل أي تعديل في سجل التغييرات.
      </Txt>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button variant="secondary" onPress={close} style={{ width: 100, minHeight: 52 }} radius={r(16)}>
          إلغاء
        </Button>
        <Button size="lg" disabled={!reason || busy} onPress={send} style={{ flex: 1 }}>
          إرسال البلاغ
        </Button>
      </View>
    </>
  );
}

const toastIn = new Keyframe({
  0: { opacity: 0, transform: [{ translateY: 40 }] },
  100: { opacity: 1, transform: [{ translateY: 0 }], easing: Easing.out(Easing.ease) },
}).duration(250);

export function Toast({ hasTabBar }: { hasTabBar: boolean }) {
  const toast = useUi((s) => s.toast);
  const seq = useUi((s) => s.toastSeq);
  const clear = useUi((s) => s.clearToast);
  const { reduceMotion } = useTheme();
  const { wide } = useLayout();
  const insets = useSafeAreaInsets();
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => clear(seq), 2200);
    return () => clearTimeout(id);
  }, [toast, seq, clear]);
  if (!toast) return null;
  return (
    <Animated.View
      key={seq}
      entering={reduceMotion ? undefined : toastIn}
      accessibilityLiveRegion="polite"
      role="status"
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: 20,
        right: 20,
        bottom: (hasTabBar && !wide ? TAB_BAR_HEIGHT : 0) + 12 + insets.bottom,
        alignSelf: 'center',
        maxWidth: 560,
        marginHorizontal: 'auto',
        zIndex: 40,
        backgroundColor: '#182D29',
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 16,
      }}>
      <Txt size={15} weight={600} color="#FFFFFF" align="center">
        {toast}
      </Txt>
    </Animated.View>
  );
}
