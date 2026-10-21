/** Native: an option sheet for selects and a draggable, screen-reader-adjustable slider. */
import { useState } from 'react';
import { Modal, ScrollView, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { C, P, T, useRtl } from './ui';

export interface SelectProps {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  label: string;
  dark?: boolean;
  disabled?: boolean;
}

export function Select({ value, options, onChange, label, dark, disabled }: SelectProps) {
  const [open, setOpen] = useState(false);
  const rtl = useRtl();
  const cur = options.find((o) => o.value === value)?.label ?? value;
  return (
    <>
      <P
        onPress={() => setOpen(true)}
        disabled={disabled}
        label={`${label}: ${cur}`}
        style={
          dark
            ? { borderWidth: 1, borderColor: 'rgba(255,255,255,.25)', backgroundColor: C.greenDark, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 10, minHeight: 36, flexDirection: 'row', gap: 8, alignItems: 'center' }
            : { borderWidth: 1, borderColor: C.field, borderRadius: 10, paddingVertical: 11, paddingHorizontal: 14, backgroundColor: C.white, minHeight: 44, flexDirection: 'row', gap: 8, alignItems: 'center' }
        }>
        <T size={dark ? 13 : 14} color={dark ? C.white : C.ink} style={{ flexShrink: 1 }}>
          {cur}
        </T>
        <T size={11} color={dark ? C.white : C.sub}>
          ▾
        </T>
      </P>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <P label="close" onPress={() => setOpen(false)} style={{ flex: 1, backgroundColor: 'rgba(20,40,34,.45)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: C.white, borderRadius: 16, maxHeight: '70%', direction: rtl ? 'rtl' : 'ltr' }}>
            <T size={12} w={600} color={C.sub} style={{ padding: 16, paddingBottom: 8 }}>
              {label}
            </T>
            <ScrollView>
              {options.map((o) => (
                <P
                  key={o.value}
                  label={o.label}
                  accessibilityState={{ selected: o.value === value }}
                  onPress={() => {
                    setOpen(false);
                    onChange(o.value);
                  }}
                  style={{ paddingVertical: 14, paddingHorizontal: 16, backgroundColor: o.value === value ? C.sandSoft : C.white }}>
                  <T w={o.value === value ? 600 : 400}>{o.label}</T>
                </P>
              ))}
            </ScrollView>
          </View>
        </P>
      </Modal>
    </>
  );
}

export interface RangeProps {
  value: number;
  min: number;
  max: number;
  step: number;
  label: string;
  disabled?: boolean;
  onChange: (v: number) => void;
  onCommit?: (v: number) => void;
}

export function Range({ value, min, max, step, label, disabled, onChange, onCommit }: RangeProps) {
  const rtl = useRtl();
  const [width, setWidth] = useState(0);
  const fromX = (x: number) => {
    if (!width) return value;
    const f = Math.min(1, Math.max(0, x / width));
    return Math.round((min + (rtl ? 1 - f : f) * (max - min)) / step) * step;
  };
  const pan = Gesture.Pan()
    .runOnJS(true)
    .enabled(!disabled)
    .minDistance(0)
    .onBegin((e) => onChange(fromX(e.x)))
    .onUpdate((e) => onChange(fromX(e.x)))
    .onEnd((e) => onCommit?.(fromX(e.x)));
  const f = (value - min) / (max - min);
  const pos = (rtl ? 1 - f : f) * Math.max(0, width - 20);
  const stepBy = (d: number) => {
    const v = Math.min(max, Math.max(min, value + d * step));
    onChange(v);
    onCommit?.(v);
  };
  return (
    <GestureDetector gesture={pan}>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={{ min, max, now: value }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => stepBy(e.nativeEvent.actionName === 'increment' ? 1 : -1)}
        onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
        style={{ height: 32, justifyContent: 'center', opacity: disabled ? 0.5 : 1, direction: 'ltr' }}>
        <View pointerEvents="none" style={{ height: 6, borderRadius: 3, backgroundColor: C.muted }}>
          <View style={{ position: 'absolute', top: 0, bottom: 0, borderRadius: 3, backgroundColor: C.green, ...(rtl ? { right: 0, width: width - pos - 10 } : { left: 0, width: pos + 10 }) }} />
        </View>
        <View pointerEvents="none" style={{ position: 'absolute', left: pos, top: 6, width: 20, height: 20, borderRadius: 10, backgroundColor: C.green, borderWidth: 3, borderColor: C.white }} />
      </View>
    </GestureDetector>
  );
}

/** File upload is done from the web console; on native the URL field is used instead. */
export function FilePick(_: { accept: string; label: string; onFile: (file: Blob & { name?: string }) => void; disabled?: boolean }) {
  return null;
}
