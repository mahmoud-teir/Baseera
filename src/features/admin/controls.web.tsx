/** Web: real <select> and <input type="range"> elements, as in the design (keyboard and screen-reader support for free). */
import { createElement, type CSSProperties } from 'react';

import { C, F, useRtl } from './ui';

export interface SelectProps {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  label: string;
  dark?: boolean;
  disabled?: boolean;
}

export function Select({ value, options, onChange, label, dark, disabled }: SelectProps) {
  const rtl = useRtl();
  const style: CSSProperties = dark
    ? { border: '1px solid rgba(255,255,255,.25)', background: C.greenDark, color: C.white, borderRadius: 8, padding: '8px 10px', fontSize: 13, fontFamily: F.ui(400), minHeight: 36 }
    : { width: '100%', border: `1px solid ${C.field}`, borderRadius: 10, padding: '11px 14px', fontSize: 14, background: C.white, color: C.ink, fontFamily: F.ui(400), minHeight: 44 };
  return createElement(
    'select',
    { value, dir: rtl ? 'rtl' : 'ltr', 'aria-label': label, disabled, onChange: (e: { target: { value: string } }) => onChange(e.target.value), style: { ...style, opacity: disabled ? 0.7 : 1, cursor: disabled ? 'default' : 'pointer' } },
    options.map((o) => createElement('option', { key: o.value, value: o.value }, o.label)),
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
  /** Fired once the user releases the thumb (or after a keyboard step). */
  onCommit?: (v: number) => void;
}

export function Range({ value, min, max, step, label, disabled, onChange, onCommit }: RangeProps) {
  const rtl = useRtl();
  return createElement('input', {
    type: 'range',
    min,
    max,
    step,
    value,
    disabled,
    dir: rtl ? 'rtl' : 'ltr',
    'aria-label': label,
    onChange: (e: { target: { value: string } }) => onChange(+e.target.value),
    onPointerUp: (e: { currentTarget: { value: string } }) => onCommit?.(+e.currentTarget.value),
    onKeyUp: (e: { currentTarget: { value: string } }) => onCommit?.(+e.currentTarget.value),
    style: { width: '100%', accentColor: C.green, minHeight: 28, cursor: disabled ? 'default' : 'pointer' },
  });
}

/** File picker (web): a real <input type="file"> behind a button-styled label. */
export function FilePick({ accept, label, onFile, disabled }: { accept: string; label: string; onFile: (file: File) => void; disabled?: boolean }) {
  return createElement(
    'label',
    {
      style: {
        display: 'inline-flex', alignItems: 'center', minHeight: 40, padding: '0 14px', borderRadius: 8, border: `1px solid ${C.field}`, background: C.white, color: C.green,
        fontFamily: F.ui(500), fontSize: 13, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.5 : 1,
      },
    },
    label,
    createElement('input', {
      type: 'file',
      accept,
      disabled,
      'aria-label': label,
      style: { position: 'absolute', width: 1, height: 1, opacity: 0, overflow: 'hidden' },
      onChange: (e: { target: { files: FileList | null; value: string } }) => {
        const f = e.target.files?.[0];
        if (f) onFile(f);
        e.target.value = '';
      },
    }),
  );
}
