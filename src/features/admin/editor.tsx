/**
 * Generic content editor. Each content kind is described by a field spec; the editor renders the
 * matching inputs and returns the `data` JSON that `admin_save_draft` stores. Server-side
 * `cms_check` and the app's zod schemas validate the same shapes.
 */
import { useState } from 'react';
import { TextInput, View } from 'react-native';

import { AUDIO_CATEGORIES, BOOK_CATEGORIES, SHARIA_SECTIONS, STORIES, type StoryTab } from '@/data/structural';
import { surah } from '@/data/quran';

import { FilePick, Select } from './controls';
import { useAdmin, type ContentKind, type Json } from './store';
import { S, type L as Strings } from './strings';
import { Btn, C, F, P, T, useRtl } from './ui';

type Opt = { value: string; label: string };
export type Field =
  | { key: string; type: 'text' | 'area' | 'url'; label: string; ltr?: boolean }
  | { key: string; type: 'number'; label: string; min?: number; max?: number }
  | { key: string; type: 'select'; label: string; options: Opt[]; numeric?: boolean }
  | { key: string; type: 'media'; label: string; accept: string; folder: string }
  | { key: string; type: 'list'; label: string; area?: boolean }
  | { key: string; type: 'repeat'; label: string; fields: Field[]; idPrefix?: string }
  | { key: string; type: 'keyed'; label: string; keys: Opt[]; fields: Field[] }
  | { key: string; type: 'options'; label: string };

const uid = (p: string) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
const QUOTE_CATS = ['العقيدة', 'الفقه', 'التفسير', 'الحديث', 'التزكية'];
const STEP_KINDS = ['درس', 'حكم', 'صوتي', 'كتاب', 'قول'];
const opts = (xs: readonly string[]): Opt[] => xs.map((x) => ({ value: x, label: x }));

/** Field specs per content kind. `slot` decides keyed headings (stories) and ayah counts (tafsir). */
export function specFor(kind: ContentKind, slot: string, L: Strings): Field[] {
  const f = L.f;
  const sourced: Field[] = [
    { key: 'text', type: 'area', label: f.text },
    { key: 'source', type: 'text', label: f.source },
    { key: 'ref', type: 'text', label: f.ref },
  ];
  switch (kind) {
    case 'lesson':
      return [
        { key: 'title', type: 'text', label: f.title },
        { key: 'minutes', type: 'number', label: f.minutes, min: 1, max: 120 },
        { key: 'audio', type: 'media', label: f.audio, accept: 'audio/*', folder: 'lessons' },
        { key: 'objectives', type: 'list', label: f.objectives },
        { key: 'sections', type: 'repeat', label: f.sections, fields: [{ key: 'heading', type: 'text', label: f.heading }, { key: 'body', type: 'area', label: f.body }] },
        { key: 'summary', type: 'list', label: f.summary },
        { key: 'quiz.passPct', type: 'number', label: f.passPct, min: 50, max: 100 },
        {
          key: 'quiz.questions',
          type: 'repeat',
          label: f.questions,
          idPrefix: 'q',
          fields: [{ key: 'q', type: 'area', label: f.q }, { key: 'options', type: 'options', label: f.options }, { key: 'explain', type: 'area', label: f.explain }],
        },
      ];
    case 'evidence':
      return [
        { key: 'kind', type: 'select', label: f.kind, options: [{ value: 'quran', label: 'آية' }, { value: 'hadith', label: 'حديث' }, { value: 'ref', label: 'مرجع علمي' }] },
        { key: 'label', type: 'text', label: f.label },
        ...sourced,
        { key: 'wajh', type: 'area', label: f.wajh },
        { key: 'explain', type: 'area', label: f.chain },
        { key: 'level', type: 'select', label: f.level, numeric: true, options: [1, 2, 3, 4].map((n) => ({ value: String(n), label: String(n) })) },
        { key: 'reviewers', type: 'list', label: f.reviewers },
        { key: 'reviewedAt', type: 'text', label: f.reviewedAt, ltr: true },
      ];
    case 'quote':
      return [
        { key: 'cat', type: 'select', label: f.cat, options: opts(QUOTE_CATS) },
        { key: 'text', type: 'area', label: f.text },
        { key: 'scholar', type: 'text', label: f.scholar },
        { key: 'source', type: 'text', label: f.source },
      ];
    case 'vocab':
      return [
        { key: 'word', type: 'text', label: 'الكلمة' },
        { key: 'root', type: 'text', label: 'الجذر' },
        { key: 'category', type: 'text', label: f.category },
        { key: 'meaning', type: 'area', label: 'المعنى الجامع' },
        {
          key: 'ayahs',
          type: 'repeat',
          label: 'الآيات الشاهدة والتفسير',
          fields: [
            { key: 'surahName', type: 'text', label: 'السورة' },
            { key: 'ayah', type: 'number', label: f.ayah, min: 1, max: 286 },
            { key: 'text', type: 'area', label: f.text },
            { key: 'tafsir', type: 'area', label: 'التفسير' },
            { key: 'source', type: 'text', label: f.source },
            { key: 'wajh', type: 'area', label: f.wajh },
          ],
        },
        {
          key: 'quotes',
          type: 'repeat',
          label: 'أقوال أئمة السلف',
          fields: [
            { key: 'scholar', type: 'text', label: f.scholar },
            { key: 'text', type: 'area', label: f.text },
            { key: 'source', type: 'text', label: f.source },
          ],
        },
      ];
    case 'story': {
      const tab = slot.split('/')[0] as StoryTab;
      return [{ key: 'sections', type: 'keyed', label: f.sections, keys: opts(STORIES[tab]?.secs ?? []), fields: sourced }];
    }
    case 'sharia':
      return [{ key: 'sections', type: 'keyed', label: f.sections, keys: opts(SHARIA_SECTIONS), fields: sourced }];
    case 'adhkar':
      return [
        {
          key: 'items',
          type: 'repeat',
          label: f.items,
          idPrefix: 'd',
          fields: [...sourced, { key: 'count', type: 'number', label: f.count, min: 1, max: 1000 }, { key: 'virtue', type: 'area', label: f.virtue }],
        },
      ];
    case 'tafsir': {
      const n = Number(slot) || 1;
      return [
        { key: 'tafsir', type: 'text', label: f.tafsir },
        { key: 'source', type: 'text', label: f.source },
        { key: 'ayahs', type: 'keyed', label: f.ayahs, keys: Array.from({ length: surah(n).ayas }, (_, i) => ({ value: String(i + 1), label: `${f.ayah} ${i + 1}` })), fields: [] },
      ];
    }
    case 'tajweed':
      return [{ key: 'text', type: 'area', label: f.text }, { key: 'examples', type: 'list', label: f.examples }, { key: 'source', type: 'text', label: f.source }];
    case 'drill':
      return [
        {
          key: 'questions',
          type: 'repeat',
          label: f.questions,
          idPrefix: 'c',
          fields: [
            { key: 'audio', type: 'media', label: f.audioUrl, accept: 'audio/*', folder: 'drill' },
            { key: 'q', type: 'text', label: f.q },
            { key: 'options', type: 'options', label: f.options },
            { key: 'source', type: 'text', label: f.source },
          ],
        },
      ];
    case 'path':
      return [
        { key: 'minutes', type: 'number', label: f.minutes, min: 1, max: 600 },
        {
          key: 'steps',
          type: 'repeat',
          label: f.steps,
          fields: [{ key: 'kind', type: 'select', label: f.stepKind, options: opts(STEP_KINDS) }, { key: 'title', type: 'text', label: f.title }, { key: 'target', type: 'text', label: f.target, ltr: true }],
        },
      ];
    case 'map':
      return [{ key: 'links', type: 'repeat', label: f.links, fields: [{ key: 'label', type: 'text', label: f.label }, { key: 'target', type: 'text', label: f.target, ltr: true }] }];
    case 'page':
      return [{ key: 'sections', type: 'repeat', label: f.sections, fields: [{ key: 'heading', type: 'text', label: f.heading }, { key: 'body', type: 'area', label: f.body }] }];
    case 'book':
      return [
        { key: 'title', type: 'text', label: f.title },
        { key: 'category', type: 'select', label: f.category, options: opts(BOOK_CATEGORIES) },
        { key: 'author', type: 'text', label: f.author },
        { key: 'source', type: 'text', label: f.source },
        { key: 'pages', type: 'number', label: f.pages, min: 1, max: 100000 },
        { key: 'chapters', type: 'repeat', label: f.chapters, fields: [{ key: 'title', type: 'text', label: f.chapterTitle }, { key: 'paragraphs', type: 'list', label: f.paragraphs, area: true }] },
      ];
    case 'audio':
      return [
        { key: 'title', type: 'text', label: f.title },
        { key: 'category', type: 'select', label: f.category, options: opts(AUDIO_CATEGORIES) },
        { key: 'author', type: 'text', label: f.author },
        { key: 'source', type: 'text', label: f.source },
        { key: 'audio_url', type: 'media', label: f.audioUrl, accept: 'audio/*', folder: 'library' },
        { key: 'size_mb', type: 'number', label: f.sizeMb, min: 0, max: 100000 },
      ];
  }
}

/** A new, empty `data` object with the defaults each kind needs. */
export function emptyData(kind: ContentKind, passPct = 85): Json {
  switch (kind) {
    case 'lesson':
      return { title: '', minutes: 10, objectives: [], sections: [], summary: [], quiz: { passPct, questions: [] } };
    case 'evidence':
      return { kind: 'quran', label: 'آية', text: '', source: '', ref: '' };
    case 'quote':
      return { cat: QUOTE_CATS[0], text: '', scholar: '', source: '' };
    case 'vocab':
      return { word: '', root: '', category: 'العقيدة', meaning: '', ayahs: [], quotes: [] };
    case 'story':
    case 'sharia':
      return { sections: {} };
    case 'adhkar':
      return { items: [] };
    case 'tafsir':
      return { tafsir: '', source: '', ayahs: {} };
    case 'tajweed':
      return { text: '', examples: [], source: '' };
    case 'drill':
      return { questions: [] };
    case 'path':
      return { steps: [] };
    case 'map':
      return { links: [] };
    case 'page':
      return { sections: [] };
    case 'book':
      return { title: '', category: BOOK_CATEGORIES[0], author: '', source: '', chapters: [] };
    case 'audio':
      return { title: '', category: AUDIO_CATEGORIES[0], author: '', source: '', audio_url: '' };
  }
}

// ── Path helpers for dotted keys («quiz.passPct») ───────────────────────────
const get = (o: Json, key: string): unknown => key.split('.').reduce<unknown>((a, k) => (a && typeof a === 'object' ? (a as Json)[k] : undefined), o);
const put = (o: Json, key: string, v: unknown): Json => {
  const [k, ...rest] = key.split('.');
  if (!rest.length) return { ...o, [k]: v };
  return { ...o, [k]: put(((o[k] as Json) ?? {}) as Json, rest.join('.'), v) };
};

/** Drop empty optional strings so the stored JSON stays clean. */
export function clean(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(clean);
  if (v && typeof v === 'object') {
    const out: Json = {};
    for (const [k, x] of Object.entries(v as Json)) {
      const c = clean(x);
      if (c === '' && ['ref', 'wajh', 'explain', 'virtue', 'audio', 'target', 'reviewedAt', 'author'].includes(k)) continue;
      out[k] = c;
    }
    return out;
  }
  return v;
}

function Input({ value, onChange, label, area, ltr, numeric, disabled }: { value: string; onChange: (v: string) => void; label: string; area?: boolean; ltr?: boolean; numeric?: boolean; disabled?: boolean }) {
  const rtl = useRtl();
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      editable={!disabled}
      multiline={area}
      accessibilityLabel={label}
      keyboardType={numeric ? 'numeric' : 'default'}
      style={{
        borderWidth: 1,
        borderColor: C.field,
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
        fontSize: 15,
        fontFamily: F.ui(400),
        color: C.ink,
        backgroundColor: disabled ? C.paper : C.white,
        textAlign: ltr ? 'left' : rtl ? 'right' : 'left',
        writingDirection: ltr ? 'ltr' : 'auto',
        minHeight: area ? 84 : 44,
        textAlignVertical: area ? 'top' : 'center',
      }}
    />
  );
}

function Label({ children }: { children: string }) {
  return (
    <T size={12} color={C.sub} style={{ marginBottom: 4 }}>
      {children}
    </T>
  );
}

function MiniBtn({ label, onPress, danger }: { label: string; onPress: () => void; danger?: boolean }) {
  return (
    <P onPress={onPress} label={label} style={{ borderWidth: 1, borderColor: danger ? '#E3B9B3' : C.field, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10, minHeight: 32, justifyContent: 'center' }}>
      <T size={12} w={500} color={danger ? C.errInk : C.green}>
        {label}
      </T>
    </P>
  );
}

function FieldView({ field, value, onChange, disabled }: { field: Field; value: unknown; onChange: (v: unknown) => void; disabled?: boolean }) {
  const { lang, uploadMedia, busy } = useAdmin();
  const L = S[lang];
  switch (field.type) {
    case 'text':
    case 'url':
    case 'area':
      return (
        <View>
          <Label>{field.label}</Label>
          <Input value={(value as string) ?? ''} onChange={onChange} label={field.label} area={field.type === 'area'} ltr={field.type === 'url' || ('ltr' in field && field.ltr)} disabled={disabled} />
        </View>
      );
    case 'number':
      return (
        <View>
          <Label>{field.label}</Label>
          <Input
            value={value === undefined || value === null ? '' : String(value)}
            onChange={(t) => {
              const n = t.trim() === '' ? undefined : Number(t.replace(/[^\d.]/g, ''));
              onChange(n === undefined || Number.isNaN(n) ? undefined : n);
            }}
            label={field.label}
            numeric
            ltr
            disabled={disabled}
          />
        </View>
      );
    case 'select':
      return (
        <View>
          <Label>{field.label}</Label>
          <Select
            label={field.label}
            value={value === undefined ? '' : String(value)}
            options={field.options}
            disabled={disabled}
            onChange={(v) => onChange(field.numeric ? Number(v) : v)}
          />
        </View>
      );
    case 'media':
      return (
        <View>
          <Label>{field.label}</Label>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <View style={{ flexGrow: 1, flexBasis: 260 }}>
              <Input value={(value as string) ?? ''} onChange={onChange} label={field.label} ltr disabled={disabled} />
            </View>
            <FilePick
              accept={field.accept}
              label={L.upload}
              disabled={disabled || busy}
              onFile={async (file) => {
                const url = await uploadMedia(file, (file as { name?: string }).name ?? 'file', field.folder);
                if (url) onChange(url);
              }}
            />
          </View>
        </View>
      );
    case 'list': {
      const xs = ((value as string[]) ?? []).slice();
      return (
        <View style={{ gap: 6 }}>
          <Label>{field.label}</Label>
          {xs.map((x, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Input value={x} area={field.area} label={`${field.label} ${i + 1}`} disabled={disabled} onChange={(v) => onChange(xs.map((y, j) => (j === i ? v : y)))} />
              </View>
              {!disabled ? <MiniBtn danger label={L.remove} onPress={() => onChange(xs.filter((_, j) => j !== i))} /> : null}
            </View>
          ))}
          {!disabled ? (
            <View style={{ flexDirection: 'row' }}>
              <MiniBtn label={`${L.add} · ${field.label}`} onPress={() => onChange([...xs, ''])} />
            </View>
          ) : null}
        </View>
      );
    }
    case 'options': {
      // Question options + the index of the correct one (stored as `options` and `answer` on the parent).
      const v = (value as { options?: string[]; answer?: number }) ?? {};
      const xs = v.options ?? [];
      return (
        <View style={{ gap: 6 }}>
          <Label>{`${field.label} · ${L.f.answer}`}</Label>
          {xs.map((x, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
              <P
                label={`${L.f.answer} ${i + 1}`}
                accessibilityRole="radio"
                accessibilityState={{ checked: v.answer === i }}
                onPress={() => !disabled && onChange({ ...v, answer: i })}
                style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: v.answer === i ? C.green : C.field, alignItems: 'center', justifyContent: 'center' }}>
                {v.answer === i ? <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: C.green }} /> : null}
              </P>
              <View style={{ flex: 1 }}>
                <Input value={x} label={`${field.label} ${i + 1}`} disabled={disabled} onChange={(t) => onChange({ ...v, options: xs.map((y, j) => (j === i ? t : y)) })} />
              </View>
              {!disabled ? (
                <MiniBtn
                  danger
                  label={L.remove}
                  onPress={() => onChange({ options: xs.filter((_, j) => j !== i), answer: v.answer === undefined ? undefined : v.answer === i ? undefined : v.answer > i ? v.answer - 1 : v.answer })}
                />
              ) : null}
            </View>
          ))}
          {!disabled && xs.length < 6 ? (
            <View style={{ flexDirection: 'row' }}>
              <MiniBtn label={`${L.add} · ${field.label}`} onPress={() => onChange({ ...v, options: [...xs, ''] })} />
            </View>
          ) : null}
        </View>
      );
    }
    case 'repeat': {
      const rows = ((value as Json[]) ?? []).slice();
      const move = (i: number, d: number) => {
        const j = i + d;
        if (j < 0 || j >= rows.length) return;
        const next = rows.slice();
        [next[i], next[j]] = [next[j], next[i]];
        onChange(next);
      };
      return (
        <View style={{ gap: 10 }}>
          <Label>{field.label}</Label>
          {rows.map((row, i) => (
            <View key={(row.id as string) ?? i} style={{ borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 12, gap: 10, backgroundColor: C.paper }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <T size={12} w={600} color={C.sub}>{`${L.f.item} ${i + 1}`}</T>
                {!disabled ? (
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <MiniBtn label={L.up} onPress={() => move(i, -1)} />
                    <MiniBtn label={L.down} onPress={() => move(i, 1)} />
                    <MiniBtn danger label={L.remove} onPress={() => onChange(rows.filter((_, j) => j !== i))} />
                  </View>
                ) : null}
              </View>
              {field.fields.map((sub) => (
                <FieldView
                  key={sub.key}
                  field={sub}
                  disabled={disabled}
                  value={sub.type === 'options' ? { options: row.options, answer: row.answer } : row[sub.key]}
                  onChange={(v) => onChange(rows.map((r, j) => (j === i ? (sub.type === 'options' ? { ...r, ...(v as Json) } : { ...r, [sub.key]: v }) : r)))}
                />
              ))}
            </View>
          ))}
          {!disabled ? (
            <View style={{ flexDirection: 'row' }}>
              <MiniBtn label={`${L.add} · ${field.label}`} onPress={() => onChange([...rows, field.idPrefix ? { id: uid(field.idPrefix) } : {}])} />
            </View>
          ) : null}
        </View>
      );
    }
    case 'keyed': {
      // Fixed keys (story sections, encyclopedia sections, ayah numbers); empty entries are omitted.
      const rec = ((value as Json) ?? {}) as Json;
      return <KeyedField field={field} rec={rec} onChange={onChange} disabled={disabled} />;
    }
  }
}

function KeyedField({ field, rec, onChange, disabled }: { field: Extract<Field, { type: 'keyed' }>; rec: Json; onChange: (v: unknown) => void; disabled?: boolean }) {
  const [open, setOpen] = useState<string | null>(null);
  const set = (k: string, v: unknown) => {
    const next = { ...rec };
    const empty = v === '' || v === undefined || (typeof v === 'object' && v !== null && Object.values(v as Json).every((x) => x === '' || x === undefined));
    if (empty) delete next[k];
    else next[k] = v;
    onChange(next);
  };
  return (
    <View style={{ gap: 6 }}>
      <Label>{field.label}</Label>
      {field.keys.map((k) => {
        const v = rec[k.value];
        const filled = v !== undefined;
        const on = open === k.value;
        return (
          <View key={k.value} style={{ borderWidth: 1, borderColor: filled ? C.green : C.line, borderRadius: 10, backgroundColor: C.white }}>
            <P onPress={() => setOpen(on ? null : k.value)} label={k.label} accessibilityState={{ expanded: on }} style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 10, minHeight: 40 }}>
              <T w={500}>{k.label}</T>
              <T size={12} color={filled ? C.green : C.faint}>
                {filled ? '●' : '○'}
              </T>
            </P>
            {on ? (
              <View style={{ padding: 10, paddingTop: 0, gap: 8 }}>
                {field.fields.length ? (
                  field.fields.map((sub) => (
                    <FieldView key={sub.key} field={sub} disabled={disabled} value={(v as Json | undefined)?.[sub.key]} onChange={(x) => set(k.value, { ...((v as Json) ?? {}), [sub.key]: x })} />
                  ))
                ) : (
                  <Input value={(v as string) ?? ''} area label={k.label} disabled={disabled} onChange={(x) => set(k.value, x)} />
                )}
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

/** The editor for one content item: fields + «Save draft». */
export function ContentEditor({ kind, slot, initial, disabled, onSaved }: { kind: ContentKind; slot: string; initial: Json; disabled?: boolean; onSaved?: (id: string) => void }) {
  const { lang, saveDraft, busy } = useAdmin();
  const L = S[lang];
  const [data, setData] = useState<Json>(initial);
  const [dirty, setDirty] = useState(false);
  const spec = specFor(kind, slot, L);
  return (
    <View style={{ gap: 14 }}>
      {spec.map((field) => (
        <FieldView
          key={field.key}
          field={field}
          disabled={disabled}
          value={get(data, field.key)}
          onChange={(v) => {
            setData(put(data, field.key, v));
            setDirty(true);
          }}
        />
      ))}
      {!disabled ? (
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <Btn
            label={L.saveDraft}
            disabled={busy || !dirty}
            onPress={async () => {
              const id = await saveDraft(kind, slot, clean(data) as Json);
              if (id) {
                setDirty(false);
                onSaved?.(id);
              }
            }}
          />
          {dirty ? (
            <T size={12} color={C.goldInk}>
              {L.unsaved}
            </T>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
