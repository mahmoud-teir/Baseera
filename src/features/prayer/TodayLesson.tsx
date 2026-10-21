import { View } from 'react-native';

import { Press } from '@/components/core/Press';
import { Txt } from '@/components/core/Txt';
import type { useAcademy } from '@/features/academy/useAcademy';

/** «درسك اليوم» card shown on the prayer and adhkar screens. */
export function TodayLesson({ pc, gc, r, ac }: { pc: string; gc: string; r: (n: number) => number; ac: ReturnType<typeof useAcademy> }) {
  return (
    <View style={{ backgroundColor: pc, borderRadius: r(22), padding: 16, gap: 8 }}>
      <Txt size={14} weight={600} color={gc}>
        درسك اليوم
      </Txt>
      <Txt font="display" size={24} weight={700} lh={1.4} color="#FFFFFF">
        {ac.cur?.title ?? 'الدروس قيد الإعداد والمراجعة العلمية'}
      </Txt>
      {ac.cur ? (
        <Txt size={14} color="#CFE0DA" ltr style={{ alignSelf: 'flex-start' }}>
          {`${ac.cur.code} · ${ac.cur.minutes} min`}
        </Txt>
      ) : null}
      <Press onPress={ac.continueLesson} label={ac.continueLabel} style={{ alignSelf: 'flex-start', height: 44, paddingHorizontal: 20, borderRadius: r(14), backgroundColor: '#FAF8F2', justifyContent: 'center' }}>
        <Txt size={16} weight={700} color={pc}>
          {ac.continueLabel}
        </Txt>
      </Press>
    </View>
  );
}
