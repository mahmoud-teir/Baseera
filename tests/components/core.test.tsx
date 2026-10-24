import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { Button } from '@/components/core/Button';
import { Card } from '@/components/core/Card';
import { Chip } from '@/components/core/Chip';
import { EvidenceBlock } from '@/components/core/EvidenceBlock';
import { LessonRow } from '@/components/core/LessonRow';
import { Ring } from '@/components/core/parts';
import { ProgressBar } from '@/components/core/ProgressBar';
import { Txt } from '@/components/core/Txt';
import { ThemeProvider } from '@/theme/theme';

const wrap = async (ui: ReactNode) => render(<ThemeProvider>{ui}</ThemeProvider>);

describe('Button (components/core/Button)', () => {
  it('fires onClick / onPress', async () => {
    const fn = jest.fn();
    await wrap(<Button onClick={fn}>ابدأ رحلتك</Button>);
    await fireEvent.press(screen.getByRole('button', { name: 'ابدأ رحلتك' }));
    expect(fn).toHaveBeenCalledTimes(1);
  });
  it('does nothing when disabled (locked variant)', async () => {
    const fn = jest.fn();
    await wrap(
      <Button disabled onPress={fn}>
        مقفل
      </Button>,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'مقفل' }));
    expect(fn).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'مقفل' })).toBeDisabled();
  });
});

describe('Chip', () => {
  it('exposes selected state', async () => {
    await wrap(<Chip label="الكل" active onPress={() => {}} />);
    expect(screen.getByRole('button', { name: 'الكل' })).toBeSelected();
  });
});

describe('Card', () => {
  it('is pressable only when it has a handler', async () => {
    const fn = jest.fn();
    await wrap(
      <Card variant="shadow" onPress={fn} label="بطاقة">
        <Txt>محتوى</Txt>
      </Card>,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'بطاقة' }));
    expect(fn).toHaveBeenCalled();
  });
});

describe('EvidenceBlock', () => {
  it('shows the dashed pending slot when there is no text', async () => {
    await wrap(<EvidenceBlock label="آية" text={null} />);
    expect(screen.getByText('موضع آية: يُدرج النص من مصدر موثّق مع رقمه وتخريجه.')).toBeTruthy();
  });
  it('never shows text without a source', async () => {
    await wrap(<EvidenceBlock label="حديث" text="نص" />);
    expect(screen.queryByText('نص')).toBeNull();
  });
  it('shows verified text with its source and reference', async () => {
    await wrap(<EvidenceBlock label="حديث" text="نص موثّق" source="المصدر" reference="رقم 1" />);
    expect(screen.getByText('نص موثّق')).toBeTruthy();
    expect(screen.getByText('المصدر · رقم 1')).toBeTruthy();
  });
});

describe('LessonRow', () => {
  it.each([
    ['done', 'مكتمل'],
    ['current', 'ابدأ'],
    ['locked', 'مقفل'],
  ] as const)('%s shows «%s» as text, not colour only', async (state, tag) => {
    await wrap(<LessonRow code="AQ-01" title="لماذا نتعلم العقيدة؟" state={state} />);
    expect(screen.getByText(tag)).toBeTruthy();
  });
  it('locked rows are not pressable', async () => {
    const fn = jest.fn();
    await wrap(<LessonRow code="AQ-02" title="درس" state="locked" onPress={fn} />);
    await fireEvent.press(screen.getByRole('button'));
    expect(fn).not.toHaveBeenCalled();
  });
});

describe('ProgressBar', () => {
  it('clamps to 0–100 and exposes its value', async () => {
    await wrap(<ProgressBar value={140} label="تقدّم" />);
    expect(screen.getByLabelText('تقدّم')).toHaveAccessibilityValue({ now: 100 });
  });
});

describe('Ring (adhkar counter)', () => {
  it('renders progress and inner content without crashing', async () => {
    await wrap(
      <Ring pct={100} color="#0E5A44" track="#E2E8F0">
        <Txt>100</Txt>
      </Ring>,
    );
    expect(screen.getByText('100')).toBeTruthy();
  });
});
