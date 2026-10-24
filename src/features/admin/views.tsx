/** The console's views — layout and copy from `Baseerah Dashboard.dc.html`, on live data only. */
import { useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';

import { surah } from '@/data/quran';
import { ADHKAR, LESSON_CODES, MAP_NODES, PATHS, SHARIA_TOPICS, STORIES, SUBJECTS, TAJWEED_TOPICS, storyTitle, type StoryTab } from '@/data/structural';
import { METHOD_LABEL, plannedCount, type Curriculum, type PrayerConfig } from '@/state/config-store';
import { useLayout } from '@/theme/layout';

import { Range, Select } from './controls';
import { download, exportRows } from './download';
import { ContentEditor, emptyData } from './editor';
import { allowed, can, chipFor, isPending, kindLabel, mine } from './logic';
import { auditText, forwardAction, stageName, useAdmin, type Action, type Cell, type ContentKind, type Item, type Json, type Kind, type LogRow } from './store';
import { MATRIX, METHODS, ROLES, S, type Lang, type Role, type ViewId } from './strings';
import { Btn, C, Card, Checkbox, Chip, F, P, Pill, Slot, T, Title, Toggle, useRtl, type BtnKind } from './ui';

// ── Shared helpers ───────────────────────────────────────────────────────────
export const fmtTime = (lang: Lang, at: number) => new Date(at).toLocaleString(lang === 'ar' ? 'ar' : 'en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

export function logText(lang: Lang, items: Item[], l: LogRow) {
  const it = items.find((i) => i.id === l.id);
  const what = it?.title ?? (l.id === 'config:prayer' ? S[lang].prayer : l.id === 'config:curriculum' ? S[lang].curriculum : l.id);
  return `${what} · ${auditText(lang, l.kind, l.x)}`;
}

function Head({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
      <View style={{ flexShrink: 1 }}>
        <Title>{title}</Title>
        {sub ? <T color={C.sub}>{sub}</T> : null}
      </View>
      <View style={{ flexShrink: 1, maxWidth: '100%' }}>{right}</View>
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ flexGrow: 1, flexBasis: 200 }}>
      <T size={12} color={C.sub} style={{ marginBottom: 4 }}>
        {label}
      </T>
      {children}
    </View>
  );
}

function Input({ value, onChange, label, ltr, placeholder }: { value: string; onChange: (v: string) => void; label: string; ltr?: boolean; placeholder?: string }) {
  const rtl = useRtl();
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      accessibilityLabel={label}
      placeholder={placeholder}
      placeholderTextColor={C.faint}
      autoCapitalize="none"
      style={{ borderWidth: 1, borderColor: C.field, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, fontSize: 14, fontFamily: F.ui(400), color: C.ink, textAlign: ltr ? 'left' : rtl ? 'right' : 'left', minHeight: 44 }}
    />
  );
}

/** Workflow buttons for one item (content or report), disabled when the role lacks the permission. */
function Actions({ it }: { it: Item }) {
  const { lang, role, myName, transition, busy } = useAdmin();
  const L = S[lang];
  const acts: { l: string; a: Action; k: BtnKind; off?: boolean }[] = [];
  if (it.kind === 'rp') {
    const lab = [L.triage, L.fixed, L.notify][it.stage];
    const a = (['triage', 'fixed', 'notify'] as const)[it.stage];
    if (lab && !it.rej) acts.push({ l: lab, a, k: 'p' });
    if (!it.rej && it.stage < 2) acts.push({ l: L.reject, a: 'reject', k: 'd' });
  } else if (it.rej) acts.push({ l: L.reopen, a: 'reopen', k: 's' });
  else if (it.stage === 0) acts.push({ l: it.kind === 'ls' ? L.submitReview : L.toReview, a: 'send', k: 'p' });
  else if (it.stage === 1) {
    acts.push(it.kind === 'ls' ? { l: `${L.approveAs} ${myName || L.roleN.scholar}`, a: 'approve', k: 'p', off: it.apMine } : { l: L.approve, a: 'approve', k: 'p', off: it.apMine });
    acts.push({ l: L.reject, a: 'reject', k: 'd' });
  }
  return (
    <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
      {acts.map((a) => (
        <Btn key={a.l} label={a.l} kind={a.k} disabled={busy || a.off || !allowed(role, it.kind, a.a)} onPress={() => transition(it.id, a.a)} />
      ))}
    </View>
  );
}

function History({ it }: { it: Item }) {
  const { lang, log, items } = useAdmin();
  const L = S[lang];
  const rows = log.filter((l) => l.id === it.id).slice(0, 6);
  return (
    <View style={{ marginTop: 22, borderTopWidth: 1, borderTopColor: C.lineSoft, paddingTop: 14 }}>
      <T size={12} w={600} color={C.sub} style={{ marginBottom: 8 }}>
        {L.history}
      </T>
      {rows.map((h, i) => (
        <T key={i} size={12.5} color="#4a5651" style={{ paddingVertical: 3 }}>
          {`${fmtTime(lang, h.at)} · ${h.role ? L.roleN[h.role] : '—'} · ${logText(lang, items, h)}`}
        </T>
      ))}
      {!rows.length ? (
        <T size={12.5} color="#9aa19d">
          —
        </T>
      ) : null}
    </View>
  );
}

function Stepper({ it }: { it: Item }) {
  const { lang } = useAdmin();
  const L = S[lang];
  const names = it.kind === 'rp' ? L.rpS : it.kind === 'ls' ? L.lsS : L.evS;
  const c = chipFor(lang, it);
  return (
    <View style={{ flexDirection: 'row', gap: 6, marginVertical: 18 }} accessible accessibilityLabel={`${c.label} (${it.stage + 1}/${names.length})`}>
      {names.map((n, i) => (
        <View key={n} style={{ flex: 1 }}>
          <View style={{ height: 6, borderRadius: 3, backgroundColor: i <= it.stage && !it.rej ? C.green : C.line }} />
          <T size={12} w={i === it.stage ? 600 : 400} color={i === it.stage ? C.green : C.faint} style={{ marginTop: 6 }}>
            {n}
          </T>
        </View>
      ))}
    </View>
  );
}

/** Detail pane: header, stepper, read-only fields or the editor, approvals, actions, history. */
function Detail({ it, editing, setEditing }: { it: Item; editing: boolean; setEditing: (v: boolean) => void }) {
  const { lang, role, curriculum, deleteContent, busy } = useAdmin();
  const L = S[lang];
  const c = chipFor(lang, it);
  const [confirm, setConfirm] = useState(false);
  const d = it.data as Record<string, unknown>;
  const editable = it.kind !== 'rp' && can(role, 'edit');
  const fields: { l: string; v: string; h: number; filled: boolean }[] =
    it.kind === 'rp'
      ? [
          { l: L.fCat, v: it.fields.cat || it.meta, h: 20, filled: true },
          { l: L.fPara, v: it.fields.para || it.title, h: 20, filled: true },
          { l: L.fNote, v: it.fields.note || L.refPh, h: 60, filled: !!it.fields.note },
        ]
      : it.kind === 'ev'
        ? [
            { l: L.fSource, v: (d.source as string) || L.srcPh, h: 20, filled: !!d.source },
            { l: L.fRef, v: (d.ref as string) || L.refPh, h: 20, filled: !!d.ref },
            { l: L.fText, v: (d.text as string) || L.textPh, h: 90, filled: !!d.text },
          ]
        : it.kind === 'ls'
          ? [
              { l: L.fObj, v: ((d.objectives as string[]) ?? []).join('\n') || L.pending, h: 50, filled: !!(d.objectives as string[])?.length },
              { l: L.fSections, v: ((d.sections as { heading: string }[]) ?? []).map((s) => s.heading).join('\n') || L.pending, h: 50, filled: !!(d.sections as unknown[])?.length },
            ]
          : [];
  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
        <View style={{ flexShrink: 1 }}>
          <T size={12} color={C.sub}>{`${kindLabel(L, it.kind, it.ckind)} · ${it.kind === 'rp' ? it.ref : it.slot}`}</T>
          <T display size={26} color={C.green} style={{ lineHeight: 40 }}>
            {it.title}
          </T>
        </View>
        <Chip big tone={c.tone}>
          {c.label}
        </Chip>
      </View>
      <Stepper it={it} />
      {it.live && it.stage < 2 ? (
        <T size={12} color={C.goldInk} style={{ marginBottom: 10 }}>
          {L.liveVersion}
        </T>
      ) : null}
      {editing && it.ckind ? (
        <ContentEditor key={it.id} kind={it.ckind} slot={it.slot} initial={it.data} onSaved={() => setEditing(false)} />
      ) : (
        <View style={{ gap: 14 }}>
          {fields.map((x) => (
            <Slot key={x.l} label={x.l} value={x.v} minH={x.h} filled={x.filled} />
          ))}
        </View>
      )}
      {it.kind === 'ls' ? (
        <View style={{ marginTop: 18, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 10, backgroundColor: C.sandSoft, flexDirection: 'row', gap: 4, flexWrap: 'wrap' }}>
          <T size={13}>{`${L.approvals}:`}</T>
          <T size={13} w={700}>{`${it.ap.length}/2`}</T>
          <T size={13}>{it.ap.join(', ')}</T>
          <T size={13} color={C.sub}>{` · ${L.fPass}: ${(d.quiz as { passPct?: number })?.passPct ?? curriculum.passPct}%`}</T>
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 22, flexWrap: 'wrap' }}>
        {!editing ? <Actions it={it} /> : null}
        {it.ckind && editable ? <Btn kind="s" label={editing ? L.cancel : L.edit} onPress={() => setEditing(!editing)} /> : null}
        {it.ckind && (it.live ? can(role, 'roles') : editable) && !editing ? (
          <Btn
            kind="d"
            disabled={busy}
            label={confirm ? L.confirmDelete : L.deleteItem}
            onPress={async () => {
              if (!confirm) return setConfirm(true);
              setConfirm(false);
              await deleteContent(it.ref);
            }}
          />
        ) : null}
      </View>
      <History it={it} />
    </View>
  );
}

// ── Overview ─────────────────────────────────────────────────────────────────
export function OverviewView() {
  const { lang, overview: ov, curriculum } = useAdmin();
  const L = S[lang];
  const [w, setW] = useState(0);
  if (!ov) return <T color={C.sub}>{L.loadFail}</T>;
  const kv = [String(ov.ev), String(ov.rp), String(ov.ls), String(ov.active), `${ov.completion}%`, ov.avg === null ? '—' : `${ov.avg}%`];
  const kpiS = L.kpiS.map((s, i) => (i === 5 ? s.replace(/70|٧٠/, lang === 'ar' ? curriculum.passPct.toLocaleString('ar-EG') : String(curriculum.passPct)) : s));
  const cols = Math.max(1, Math.min(6, Math.floor((w + 16) / 216)));
  const cw = (w - 16 * (cols - 1)) / cols;
  const maxBar = Math.max(1, ...ov.weekly.map((b) => b.n));
  const pipeTotal = Math.max(1, ov.pipeline.reduce((a, b) => a + b, 0));
  return (
    <View>
      <Title>{L.overview}</Title>
      <T color={C.sub} style={{ marginTop: 2, marginBottom: 22 }}>
        {L.overviewSub}
      </T>
      <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
        {w > 0 &&
          L.kpi.map((l, i) => (
            <Card key={l} style={{ width: cw, paddingVertical: 18, paddingHorizontal: 20 }}>
              <T size={12} color={C.sub}>
                {l}
              </T>
              <T display size={36} color={C.green} style={{ marginTop: 6, lineHeight: 50 }}>
                {kv[i]}
              </T>
              <T size={12} color={C.sub}>
                {kpiS[i]}
              </T>
            </Card>
          ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 16, flexWrap: 'wrap', marginTop: 16 }}>
        <Card style={{ flexGrow: 2, flexShrink: 1, flexBasis: 420, padding: 20 }}>
          <T w={600} style={{ marginBottom: 16 }}>
            {L.weekly}
          </T>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 14, height: 150 }}>
            {ov.weekly.map((b, i) => {
              const d = L.days[(b.d.getDay() + 1) % 7];
              return (
                <View key={i} accessible accessibilityLabel={`${d}: ${b.n}`} style={{ flex: 1, alignItems: 'center', gap: 6, justifyContent: 'flex-end', height: '100%' }}>
                  <T size={11} color={C.sub}>
                    {String(b.n)}
                  </T>
                  <View style={{ width: '100%', backgroundColor: C.green, borderTopLeftRadius: 6, borderTopRightRadius: 6, height: `${Math.max(2, Math.round((b.n / maxBar) * 80))}%`, opacity: b.n ? 0.88 : 0.2 }} />
                  <T size={11} color={C.sub}>
                    {d}
                  </T>
                </View>
              );
            })}
          </View>
        </Card>
        <Card style={{ flexGrow: 1, flexShrink: 1, flexBasis: 280, padding: 20 }}>
          <T w={600} style={{ marginBottom: 12 }}>
            {L.pipeline}
          </T>
          {ov.pipeline.map((n, i) => (
            <View key={i} style={{ marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <T size={13}>{L.evS[i]}</T>
                <T size={13} color={C.sub}>
                  {String(n)}
                </T>
              </View>
              <View style={{ height: 8, backgroundColor: C.muted, borderRadius: 4, marginTop: 6 }}>
                <View style={{ height: 8, borderRadius: 4, backgroundColor: C.gold, width: `${Math.round((n / pipeTotal) * 100)}%` }} />
              </View>
            </View>
          ))}
        </Card>
      </View>
    </View>
  );
}

// ── Split view: queue / evidence / reports ───────────────────────────────────
export interface SplitState {
  sel: string | null;
  chk: Record<string, boolean>;
  flt: 'all' | Kind;
  mine: boolean;
}

function ItemRow({ i, on, onPress, check }: { i: Item; on: boolean; onPress: () => void; check?: { checked: boolean; toggle: () => void } }) {
  const { lang } = useAdmin();
  const L = S[lang];
  const c = chipFor(lang, i);
  return (
    <P
      onPress={onPress}
      label={i.title}
      accessibilityState={{ selected: on }}
      hoverStyle={on ? undefined : { backgroundColor: C.sandSoft }}
      style={{ flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 13, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: C.lineSoft, backgroundColor: on ? C.sand : C.white }}>
      {check ? <Checkbox checked={check.checked} label={i.title} onPress={check.toggle} /> : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <T w={500} numberOfLines={1}>
          {i.title}
        </T>
        <T size={12} color={C.sub} style={{ marginTop: 2 }} numberOfLines={1}>
          {`${kindLabel(L, i.kind, i.ckind)} · ${i.meta}`}
        </T>
      </View>
      <Chip tone={c.tone}>{c.label}</Chip>
    </P>
  );
}

export function SplitView({ view, st, setSt }: { view: ViewId; st: SplitState; setSt: (p: Partial<SplitState>) => void }) {
  const { wide } = useLayout();
  const rtl = useRtl();
  const { lang, items, role, transition, curriculum } = useAdmin();
  const L = S[lang];
  const [editing, setEditing] = useState(false);
  const [newCode, setNewCode] = useState(LESSON_CODES[0]);
  const kindOf: Kind | null = view === 'evidence' ? 'ev' : view === 'reports' ? 'rp' : null;
  let list = kindOf ? items.filter((i) => i.kind === kindOf) : items.filter(isPending);
  if (!kindOf) {
    if (st.flt !== 'all') list = list.filter((i) => i.kind === st.flt);
    if (st.mine) list = list.filter((i) => mine(i, role));
  }
  const cur = items.find((i) => i.id === st.sel && list.some((x) => x.id === i.id));
  const chkIds = Object.keys(st.chk).filter((k) => st.chk[k]);
  const filters: { k: 'all' | Kind; l: string }[] = [
    { k: 'all', l: L.all },
    { k: 'ev', l: L.evidence },
    { k: 'rp', l: L.reports },
    { k: 'ls', l: L.lessons },
    { k: 'ct', l: L.catalog },
  ];
  const bulk = async () => {
    for (const id of chkIds) {
      const it = items.find((i) => i.id === id);
      const a = it && forwardAction(it);
      if (it && a && allowed(role, it.kind, a)) await transition(id, a);
    }
    setSt({ chk: {} });
  };
  // «New evidence card»: next free `${code}/eN` slot for the chosen lesson.
  const newEvidenceSlot = () => {
    const used = items.filter((i) => i.ckind === 'evidence' && i.slot.startsWith(newCode + '/e')).map((i) => Number(i.slot.split('/e')[1]) || 0);
    return `${newCode}/e${Math.max(0, ...used) + 1}`;
  };
  const [draftSlot, setDraftSlot] = useState<string | null>(null);

  const showDetailMobile = !wide && (!!cur || !!draftSlot);

  return (
    <View>
      <Head
        title={L[view as 'queue']}
        sub={view === 'queue' ? L.queueSub : view === 'evidence' ? L.evSub : L.rpSub}
        right={
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {view === 'queue' ? (
              <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                {filters.map((f) => (
                  <Pill key={f.k} round label={f.l} active={st.flt === f.k} onPress={() => setSt({ flt: f.k })} />
                ))}
                <Pill round tone="gold" label={L.mineOnly} active={st.mine} onPress={() => setSt({ mine: !st.mine })} />
              </View>
            ) : null}
            {view === 'evidence' && can(role, 'edit') ? (
              <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                <Select label={L.lessonCode} value={newCode} options={LESSON_CODES.map((c) => ({ value: c, label: c }))} onChange={setNewCode} />
                <Pill
                  label={L.newEvidence}
                  onPress={() => {
                    setDraftSlot(newEvidenceSlot());
                    setSt({ sel: null });
                  }}
                />
              </View>
            ) : null}
            <Pill label={L.exportBtn} onPress={() => exportRows(list.map((i) => ({ id: i.ref, type: i.ckind ?? 'report', slot: i.slot, title: i.title, stage: stageName(lang, i.kind, i.stage), rejected: i.rej })), 'baseerah-' + view)} />
          </View>
        }
      />
      <View style={{ flexDirection: wide ? 'row' : 'column', gap: 16, alignItems: 'stretch' }}>
        {(!showDetailMobile || wide) && (
          <Card style={{ flexGrow: 1, flexShrink: 1, flexBasis: wide ? 340 : undefined, maxWidth: wide ? 460 : '100%', width: wide ? undefined : '100%', overflow: 'hidden' }}>
            {chkIds.length ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 14, backgroundColor: C.green }}>
                <T size={13} color={C.white} style={{ flex: 1 }}>
                  {`${chkIds.length} ${L.selected}`}
                </T>
                <P onPress={bulk} label={L.bulkAdv} style={{ borderRadius: 6, paddingVertical: 5, paddingHorizontal: 10, backgroundColor: C.gold }}>
                  <T size={13} w={600} color="#2a2008">
                    {L.bulkAdv}
                  </T>
                </P>
                <P onPress={() => setSt({ chk: {} })} label={L.clear} style={{ borderRadius: 6, paddingVertical: 5, paddingHorizontal: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,.4)' }}>
                  <T size={13} color={C.white}>
                    {L.clear}
                  </T>
                </P>
              </View>
            ) : null}
            {!list.length ? (
              <T color={C.sub} style={{ paddingVertical: 36, paddingHorizontal: 20, textAlign: 'center' }}>
                {L.empty}
              </T>
            ) : null}
            {list.map((i) => (
              <ItemRow
                key={i.id}
                i={i}
                on={st.sel === i.id}
                onPress={() => {
                  setEditing(false);
                  setDraftSlot(null);
                  setSt({ sel: i.id });
                }}
                check={{ checked: !!st.chk[i.id], toggle: () => setSt({ chk: { ...st.chk, [i.id]: !st.chk[i.id] } }) }}
              />
            ))}
          </Card>
        )}
        {(showDetailMobile || wide) && (
          <Card style={{ flexGrow: 2, flexShrink: 1, flexBasis: wide ? 420 : undefined, width: wide ? undefined : '100%', padding: wide ? 24 : 16, minHeight: 360 }}>
            {showDetailMobile && (
              <P
                onPress={() => {
                  setEditing(false);
                  setDraftSlot(null);
                  setSt({ sel: null });
                }}
                label={lang === 'ar' ? 'العودة إلى القائمة' : 'Back to list'}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingBottom: 10,
                  marginBottom: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: C.lineSoft,
                }}>
                <T size={14} w={600} color={C.green}>
                  {rtl ? '→' : '←'} {lang === 'ar' ? 'العودة إلى القائمة' : 'Back to list'}
                </T>
              </P>
            )}
            {draftSlot ? (
              <View style={{ gap: 12 }}>
                <T size={12} color={C.sub}>{`${L.kEv} · ${draftSlot}`}</T>
                <ContentEditor
                  key={draftSlot}
                  kind="evidence"
                  slot={draftSlot}
                  initial={emptyData('evidence', curriculum.passPct)}
                  onSaved={(id) => {
                    setDraftSlot(null);
                    setSt({ sel: 'ct:' + id });
                  }}
                />
              </View>
            ) : cur ? (
              <Detail it={cur} editing={editing} setEditing={setEditing} />
            ) : (
              <T color={C.sub} style={{ textAlign: 'center', paddingTop: 140 }}>
                {L.pick}
              </T>
            )}
          </Card>
        )}
      </View>
    </View>
  );
}

// ── Lessons ──────────────────────────────────────────────────────────────────
export function LessonsView({ lsel, setLsel }: { lsel: string | null; setLsel: (id: string) => void }) {
  const { wide } = useLayout();
  const { lang, items, role, curriculum } = useAdmin();
  const L = S[lang];
  const [tab, setTab] = useState<'edit' | 'diff' | 'prev'>('edit');
  const [mobileTab, setMobileTab] = useState<'editor' | 'list'>('editor');
  const code = lsel && LESSON_CODES.includes(lsel) ? lsel : LESSON_CODES[0];
  const byCode = Object.fromEntries(items.filter((i) => i.ckind === 'lesson').map((i) => [i.slot, i]));
  const lc = byCode[code];
  const data = (lc?.data ?? emptyData('lesson', curriculum.passPct)) as Json & { title?: string; objectives?: string[]; sections?: { heading: string; body: string }[]; quiz?: { passPct?: number; questions?: unknown[] } };
  const pub = (lc?.published ?? null) as typeof data | null;
  const editable = can(role, 'edit') && (!lc || lc.stage === 0 || lc.rej);
  const tabs: ['edit' | 'diff' | 'prev', string][] = [
    ['edit', L.tEdit],
    ['diff', L.tDiff],
    ['prev', L.tPrev],
  ];
  return (
    <View>
      <Head
        title={L.lessons}
        sub={L.lessonsSub}
        right={
          <Pill
            label={L.exportLessons}
            onPress={() =>
              download(
                'lessons.json',
                JSON.stringify(
                  Object.values(byCode).map((l) => ({ code: l.slot, status: l.rej ? 'rejected' : L.lsS[l.stage], published: l.published, draft: l.data })),
                  null,
                  2,
                ),
                'application/json',
              )
            }
          />
        }
      />
      {can(role, 'roles') ? <CurriculumCard /> : null}
      {!wide && (
        <View style={{ marginBottom: 14, flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <Pill
            label={mobileTab === 'list' ? (lang === 'ar' ? '← محرر الدرس' : '← Editor') : (lang === 'ar' ? '☰ قائمة الدروس (٥٣)' : '☰ All Lessons (53)')}
            tone={mobileTab === 'list' ? 'green' : 'gold'}
            active={mobileTab === 'list'}
            onPress={() => setMobileTab(mobileTab === 'list' ? 'editor' : 'list')}
          />
          {mobileTab === 'editor' && (
            <View style={{ flex: 1 }}>
              <Select
                label={L.lessonWord}
                value={code}
                options={LESSON_CODES.map((c) => ({
                  value: c,
                  label: `${c} · ${byCode[c]?.title && byCode[c].title !== c ? byCode[c].title : '—'}`,
                }))}
                onChange={(c) => setLsel(c)}
              />
            </View>
          )}
        </View>
      )}
      <View style={{ flexDirection: wide ? 'row' : 'column', gap: 18, alignItems: 'stretch' }}>
        {(wide || mobileTab === 'list') && (
          <Card style={{ flexGrow: 1, flexShrink: 1, flexBasis: wide ? 260 : undefined, maxWidth: wide ? 320 : '100%', width: wide ? undefined : '100%', overflow: 'hidden' }}>
            <ScrollView style={{ maxHeight: wide ? 640 : 480 }}>
              {SUBJECTS.map((s) => (
                <View key={s.id}>
                  <T size={12} w={600} color={C.sub} style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6, backgroundColor: C.paper }}>
                    {`${s.name} · ${plannedCount(curriculum, s.id)}`}
                  </T>
                  {LESSON_CODES.filter((c) => c.startsWith(s.prefix + '-')).map((c) => {
                    const it = byCode[c];
                    const chip = it ? chipFor(lang, it) : { label: L.notStarted, tone: 'muted' as const };
                    const on = c === code;
                    return (
                      <P
                        key={c}
                        label={`${c} ${it?.title ?? ''}`}
                        onPress={() => {
                          setLsel(c);
                          if (!wide) setMobileTab('editor');
                        }}
                        accessibilityState={{ selected: on }}
                        hoverStyle={on ? undefined : { backgroundColor: C.sandSoft }}
                        style={{ paddingVertical: 11, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: C.lineSoft, flexDirection: 'row', justifyContent: 'space-between', gap: 8, alignItems: 'center', backgroundColor: on ? C.sand : C.white }}>
                        <View style={{ flexShrink: 1 }}>
                          <T size={12} color={C.sub} ltr>
                            {c}
                          </T>
                          <T w={500} numberOfLines={1}>
                            {it?.title && it.title !== c ? it.title : '—'}
                          </T>
                        </View>
                        <Chip tone={chip.tone}>{chip.label}</Chip>
                      </P>
                    );
                  })}
                </View>
              ))}
            </ScrollView>
          </Card>
        )}
        {(wide || mobileTab === 'editor') && (
          <Card style={{ flexGrow: 3, flexShrink: 1, flexBasis: wide ? 460 : undefined, width: wide ? undefined : '100%', padding: wide ? 24 : 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }} accessibilityRole="tablist">
              {tabs.map(([k, l]) => (
                <Pill key={k} label={l} active={tab === k} onPress={() => setTab(k)} />
              ))}
            </View>
            <T w={600} ltr>
              {code}
            </T>
          </View>
          {lc ? <Stepper it={lc} /> : null}
          {tab === 'edit' ? (
            <View style={{ gap: 16 }}>
              {lc?.live && lc.stage < 2 ? (
                <T size={12} color={C.goldInk}>
                  {L.liveVersion}
                </T>
              ) : null}
              <ContentEditor key={`${code}:${lc?.ref ?? 'new'}:${lc?.stage ?? 0}`} kind="lesson" slot={code} initial={data} disabled={!editable} />
              {lc ? (
                <View style={{ gap: 10 }}>
                  <View style={{ paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, backgroundColor: C.sandSoft, flexDirection: 'row', gap: 4, flexWrap: 'wrap' }}>
                    <T size={13}>{`${L.approvals}:`}</T>
                    <T size={13} w={700}>{`${lc.ap.length}/2`}</T>
                    <T size={13}>{lc.ap.join(', ')}</T>
                  </View>
                  <Actions it={lc} />
                  <History it={lc} />
                </View>
              ) : null}
            </View>
          ) : null}
          {tab === 'diff' ? (
            <View style={{ gap: 6 }}>
              <T size={12} color={C.sub}>
                {L.fTitle}
              </T>
              <Diff minus={pub?.title ?? '—'} plus={data.title || '—'} />
              <T size={12} color={C.sub} style={{ marginTop: 12 }}>
                {L.fPass}
              </T>
              <Diff minus={pub ? `${pub.quiz?.passPct}%` : '—'} plus={`${data.quiz?.passPct ?? curriculum.passPct}%`} />
              <T size={12} color={C.sub} style={{ marginTop: 12 }}>
                {`${L.fObj} · ${L.fSections} · ${L.f.questions}`}
              </T>
              <Diff
                minus={pub ? `${pub.objectives?.length ?? 0} · ${pub.sections?.length ?? 0} · ${pub.quiz?.questions?.length ?? 0}` : '—'}
                plus={`${data.objectives?.length ?? 0} · ${data.sections?.length ?? 0} · ${data.quiz?.questions?.length ?? 0}`}
              />
            </View>
          ) : null}
          {tab === 'prev' ? <PhonePreview data={data} /> : null}
        </Card>
        )}
      </View>
    </View>
  );
}

function PhonePreview({ data }: { data: Json & { title?: string; objectives?: string[]; sections?: { heading: string; body: string }[]; quiz?: { passPct?: number } } }) {
  const { lang } = useAdmin();
  const L = S[lang];
  return (
    <View style={{ alignItems: 'center', paddingVertical: 10 }}>
      <View style={{ width: 280, height: 540, borderRadius: 38, borderWidth: 9, borderColor: C.ink, backgroundColor: C.ivory, overflow: 'hidden' }} accessibilityLabel={L.tPrev}>
        <View style={{ backgroundColor: C.green, paddingTop: 34, paddingHorizontal: 20, paddingBottom: 18 }}>
          <T size={11} color={C.white} style={{ opacity: 0.75 }}>
            {L.lessonWord}
          </T>
          <T display size={22} color={C.white} style={{ marginTop: 4, lineHeight: 34 }}>
            {data.title || '—'}
          </T>
        </View>
        <ScrollView contentContainerStyle={{ paddingVertical: 18, paddingHorizontal: 20, gap: 12 }}>
          {data.objectives?.length ? (
            <View style={{ borderRadius: 12, padding: 12, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, gap: 4 }}>
              <T size={12} w={600} color={C.green}>
                {L.fObj}
              </T>
              {data.objectives.map((o, i) => (
                <T key={i} size={13}>{`• ${o}`}</T>
              ))}
            </View>
          ) : (
            <View style={{ borderWidth: 1, borderStyle: 'dashed', borderColor: C.field, borderRadius: 12, padding: 14, backgroundColor: C.white }}>
              <T size={13} color={C.faint}>{`${L.fObj} — ${L.pending}`}</T>
            </View>
          )}
          {(data.sections ?? []).map((s, i) => (
            <View key={i} style={{ borderRadius: 12, padding: 12, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, gap: 4 }}>
              <T size={12} w={600} color={C.green}>
                {s.heading}
              </T>
              <T size={13}>{s.body}</T>
            </View>
          ))}
          <View style={{ borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, backgroundColor: C.sand }}>
            <T size={13} color="#5c4a1c">{`${L.fPass}: ${data.quiz?.passPct ?? '—'}%`}</T>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

function CurriculumCard() {
  const { lang, curriculum, saveCurriculum, busy } = useAdmin();
  const L = S[lang];
  const [c, setC] = useState<Curriculum>(curriculum);
  return (
    <Card style={{ padding: 18, marginBottom: 18, gap: 12 }}>
      <View>
        <T w={600}>{L.curriculum}</T>
        <T size={12} color={C.sub}>
          {L.curriculumSub}
        </T>
      </View>
      <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
        {SUBJECTS.map((s) => (
          <Field key={s.id} label={`${s.name} · ${L.planned}`}>
            <Input ltr label={s.name} value={String(plannedCount(c, s.id))} onChange={(v) => setC({ ...c, stage1: { ...c.stage1, [s.id]: Math.max(0, Math.min(99, Number(v.replace(/\D/g, '')) || 0)) } })} />
          </Field>
        ))}
        <Field label={L.passMark}>
          <Input ltr label={L.passMark} value={String(c.passPct)} onChange={(v) => setC({ ...c, passPct: Number(v.replace(/\D/g, '')) || 0 })} />
        </Field>
      </View>
      <View style={{ flexDirection: 'row' }}>
        <Btn label={L.saveDraft.replace(/draft|المسودة/i, '').trim() || L.saved} disabled={busy || JSON.stringify(c) === JSON.stringify(curriculum)} onPress={() => saveCurriculum(c)} />
      </View>
    </Card>
  );
}

function Diff({ minus, plus }: { minus: string; plus: string }) {
  return (
    <View style={{ gap: 6 }}>
      <View style={{ backgroundColor: C.errBg, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 14, flexDirection: 'row', gap: 6 }}>
        <T w={700} color={C.errInk}>
          −
        </T>
        <T color={C.errInk} style={{ flexShrink: 1 }}>
          {minus}
        </T>
      </View>
      <View style={{ backgroundColor: C.okBg, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 14, flexDirection: 'row', gap: 6 }}>
        <T w={700} color={C.green}>
          +
        </T>
        <T color={C.green} style={{ flexShrink: 1 }}>
          {plus}
        </T>
      </View>
    </View>
  );
}

// ── Content catalog (every other slot) and library ───────────────────────────
type SlotDef = { slot: string; label: string };
function slotsFor(kind: ContentKind, items: Item[]): SlotDef[] {
  switch (kind) {
    case 'story':
      return (Object.keys(STORIES) as StoryTab[]).flatMap((tab) => STORIES[tab].list.map((name, i) => ({ slot: `${tab}/${i}`, label: storyTitle(tab, name) })));
    case 'sharia':
      return SHARIA_TOPICS.flatMap((tp, ti) => tp.subs.map((sub, si) => ({ slot: `${ti}/${si}`, label: `${tp.name} · ${sub}` })));
    case 'adhkar':
      return ADHKAR.map((a) => ({ slot: a.id, label: a.name }));
    case 'tafsir':
      return Array.from({ length: 114 }, (_, i) => ({ slot: String(i + 1), label: `${i + 1}. ${surah(i + 1).name}` }));
    case 'tajweed':
      return TAJWEED_TOPICS.map((t, i) => ({ slot: String(i), label: t }));
    case 'drill':
      return [{ slot: 'main', label: 'تدريب بالاستماع' }];
    case 'path':
      return PATHS.map((p) => ({ slot: p.id, label: p.title }));
    case 'map':
      return MAP_NODES.map((n) => ({ slot: n.id, label: n.name }));
    case 'page':
      return [{ slot: 'funding', label: 'كيف يُموَّل المشروع' }];
    default:
      // Quotes, books and recordings have no fixed slots: list what exists.
      return items.filter((i) => i.ckind === kind).map((i) => ({ slot: i.slot, label: i.title }));
  }
}

export function CatalogView({ library }: { library?: boolean }) {
  const { wide } = useLayout();
  const rtl = useRtl();
  const { lang, items, role, curriculum } = useAdmin();
  const L = S[lang];
  const kinds: ContentKind[] = library ? ['book', 'audio'] : ['quote', 'vocab', 'story', 'sharia', 'adhkar', 'tafsir', 'tajweed', 'drill', 'path', 'map', 'page'];
  const [kind, setKind] = useState<ContentKind>(kinds[0]);
  const [slot, setSlot] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(false);
  const [fresh, setFresh] = useState<string | null>(null);
  const bySlot = Object.fromEntries(items.filter((i) => i.ckind === kind).map((i) => [i.slot, i]));
  const slots = slotsFor(kind, items).filter((s) => !q.trim() || s.label.includes(q.trim()));
  const it = slot ? bySlot[slot] : undefined;
  const canCreate = can(role, 'edit') && ['quote', 'book', 'audio'].includes(kind);
  const pick = (s: string) => {
    setSlot(s);
    setFresh(null);
    setEditing(false);
  };
  const showDetailMobile = !wide && (!!slot || !!fresh);
  return (
    <View>
      <Head
        title={library ? L.library : L.catalog}
        sub={library ? L.librarySub : L.catalogSub}
        right={
          canCreate ? (
            <Pill
              label={kind === 'quote' ? L.newQuote : kind === 'book' ? L.addBook : L.addAudio}
              onPress={() => {
                const s = `${kind[0]}-${Date.now().toString(36)}`;
                setSlot(s);
                setFresh(s);
              }}
            />
          ) : undefined
        }
      />
      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        {kinds.map((k) => (
          <Pill
            key={k}
            round
            label={L.kinds[k]}
            active={k === kind}
            onPress={() => {
              setKind(k);
              setSlot(null);
              setFresh(null);
            }}
          />
        ))}
      </View>
      <View style={{ flexDirection: wide ? 'row' : 'column', gap: 18, alignItems: 'stretch' }}>
        {(!showDetailMobile || wide) && (
          <Card style={{ flexGrow: 1, flexShrink: 1, flexBasis: wide ? 300 : undefined, maxWidth: wide ? 420 : '100%', width: wide ? undefined : '100%', overflow: 'hidden' }}>
            <View style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: C.lineSoft }}>
              <Input value={q} onChange={setQ} label={L.search} placeholder={L.search} />
            </View>
            <ScrollView style={{ maxHeight: wide ? 620 : 420 }}>
              {!slots.length ? (
                <T color={C.sub} style={{ padding: 24, textAlign: 'center' }}>
                  {L.empty}
                </T>
              ) : null}
              {slots.map((s) => {
                const x = bySlot[s.slot];
                const chip = x ? chipFor(lang, x) : { label: L.notStarted, tone: 'muted' as const };
                const on = s.slot === slot;
                return (
                  <P
                    key={s.slot}
                    label={s.label}
                    onPress={() => pick(s.slot)}
                    accessibilityState={{ selected: on }}
                    hoverStyle={on ? undefined : { backgroundColor: C.sandSoft }}
                    style={{ paddingVertical: 11, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: C.lineSoft, flexDirection: 'row', justifyContent: 'space-between', gap: 8, alignItems: 'center', backgroundColor: on ? C.sand : C.white }}>
                    <T w={500} numberOfLines={1} style={{ flexShrink: 1 }}>
                      {s.label}
                    </T>
                    <Chip tone={chip.tone}>{chip.label}</Chip>
                  </P>
                );
              })}
            </ScrollView>
          </Card>
        )}
        {(showDetailMobile || wide) && (
          <Card style={{ flexGrow: 2, flexShrink: 1, flexBasis: wide ? 440 : undefined, width: wide ? undefined : '100%', padding: wide ? 24 : 16, minHeight: 360 }}>
            {showDetailMobile && (
              <P
                onPress={() => {
                  setEditing(false);
                  setFresh(null);
                  setSlot(null);
                }}
                label={lang === 'ar' ? 'العودة إلى القائمة' : 'Back to list'}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingBottom: 10,
                  marginBottom: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: C.lineSoft,
                }}>
                <T size={14} w={600} color={C.green}>
                  {rtl ? '→' : '←'} {lang === 'ar' ? 'العودة إلى القائمة' : 'Back to list'}
                </T>
              </P>
            )}
            {!slot ? (
              <T color={C.sub} style={{ textAlign: 'center', paddingTop: 120 }}>
                {L.pick}
              </T>
            ) : it && !fresh ? (
              <Detail key={it.id} it={it} editing={editing} setEditing={setEditing} />
            ) : (
              <View style={{ gap: 12 }}>
                <T size={12} color={C.sub}>{`${L.kinds[kind]} · ${slotsFor(kind, items).find((s) => s.slot === slot)?.label ?? slot}`}</T>
                <ContentEditor key={`${kind}:${slot}`} kind={kind} slot={slot} initial={emptyData(kind, curriculum.passPct)} disabled={!can(role, 'edit')} onSaved={() => setFresh(null)} />
              </View>
            )}
          </Card>
        )}
      </View>
    </View>
  );
}

// ── Tables: scholars / learners / certificates / roles ───────────────────────
function Table({ cols, rows }: { cols: string[]; rows: Cell[][] }) {
  const { lang } = useAdmin();
  return (
    <Card style={{ overflow: 'hidden' }}>
      <ScrollView horizontal contentContainerStyle={{ minWidth: '100%' }}>
        <View style={{ minWidth: 560, flex: 1 }} accessibilityRole="list">
          <View style={{ flexDirection: 'row', backgroundColor: C.paper, borderBottomWidth: 1, borderBottomColor: C.line }}>
            {cols.map((c, i) => (
              <T key={c} size={12} w={600} color={C.sub} style={{ flex: i === 0 ? 1.6 : 1, paddingVertical: 13, paddingHorizontal: 18 }}>
                {c}
              </T>
            ))}
          </View>
          {rows.map((r, ri) => (
            <View key={ri} style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: C.lineSoft }}>
              {r.map((c, i) => (
                <View key={i} style={{ flex: i === 0 ? 1.6 : 1, paddingVertical: 13, paddingHorizontal: 18 }}>
                  <CellView c={c} />
                </View>
              ))}
            </View>
          ))}
          {!rows.length ? (
            <T color={C.sub} style={{ padding: 24, textAlign: 'center' }}>
              {S[lang].empty}
            </T>
          ) : null}
        </View>
      </ScrollView>
    </Card>
  );
}

function CellView({ c }: { c: Cell }) {
  if (c.chip) return <Chip tone={c.chip}>{c.t}</Chip>;
  if (c.bar !== undefined)
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 140 }}>
        <View style={{ flex: 1, height: 8, backgroundColor: C.muted, borderRadius: 4 }}>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: C.green, width: `${Math.min(100, c.bar)}%` }} />
        </View>
        <T size={12} color={C.sub}>
          {c.t}
        </T>
      </View>
    );
  return <T color={c.col === 'ok' ? C.green : c.col === 'muted' ? '#b7bcb8' : C.ink}>{c.t}</T>;
}

const fmtDate = (lang: Lang, s: string) => new Date(s).toLocaleDateString(lang === 'ar' ? 'ar' : 'en', { year: 'numeric', month: 'short', day: 'numeric' });

export function TableView({ view }: { view: 'learners' | 'certs' | 'roles' }) {
  const { lang, items, log, learners, certs } = useAdmin();
  const L = S[lang];
  const cols = L.cols[view] ?? [];
  const lessonTitle = (code: string) => items.find((i) => i.ckind === 'lesson' && i.slot === code)?.title ?? code;
  const rows: Cell[][] =
    view === 'roles'
      ? L.perms.map((p, i) => [{ t: p }, ...ROLES.map((r) => (MATRIX[r][i] ? { t: '✓', col: 'ok' as const } : { t: '–', col: 'muted' as const }))])
      : view === 'learners'
        ? learners.map((r) => [{ t: `${r.code} · ${lessonTitle(r.code)}` }, { t: String(r.learners) }, { t: r.avg_progress + '%', bar: r.avg_progress }, { t: r.pass_rate + '%' }])
        : certs.map((c) => [{ t: c.code }, { t: c.name }, { t: fmtDate(lang, c.issued_at) }, { t: L.status.issued, chip: 'ok' }]);
  return (
    <View>
      <Head title={L.tt[view] ?? L[view]} sub={L.ts[view] ?? ''} right={<Pill label={L.exportBtn} onPress={() => exportRows(rows.map((r) => Object.fromEntries(cols.map((c, i) => [c, r[i]?.t ?? '']))), 'baseerah-' + view)} />} />
      <Table cols={cols} rows={rows} />
      {view === 'certs' ? <CertVerify /> : null}
      {view === 'roles' ? (
        <>
          <TeamCard />
          <Card style={{ marginTop: 18, padding: 22 }}>
            <T w={600} style={{ marginBottom: 12 }}>
              {L.audit}
            </T>
            {log.slice(0, 80).map((a, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 14, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.lineSoft, flexWrap: 'wrap' }}>
                <T size={13} color={C.sub} style={{ minWidth: 64 }}>
                  {fmtTime(lang, a.at)}
                </T>
                <T size={13} w={600} style={{ minWidth: 90 }}>
                  {a.role ? L.roleN[a.role] : '—'}
                </T>
                <T size={13} style={{ flexShrink: 1 }}>
                  {logText(lang, items, a)}
                </T>
              </View>
            ))}
            {!log.length ? <T color="#9aa19d">{L.auditEmpty}</T> : null}
          </Card>
        </>
      ) : null}
    </View>
  );
}

function TeamCard() {
  const { lang, staff, myName, setStaff, removeStaff, busy } = useAdmin();
  const L = S[lang];
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('content');
  const [confirm, setConfirm] = useState<string | null>(null);
  const roleOpts = ROLES.map((r) => ({ value: r, label: L.roleN[r] }));
  return (
    <Card style={{ marginTop: 18, padding: 22, gap: 12 }}>
      <View>
        <T w={600}>{L.team}</T>
        <T size={12} color={C.sub}>
          {L.teamSub}
        </T>
      </View>
      {staff.map((m) => (
        <View key={m.user_id} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', flexWrap: 'wrap', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: C.lineSoft }}>
          <View style={{ flexGrow: 1, flexBasis: 200 }}>
            <T w={500} ltr>
              {m.email}
            </T>
            <T size={12} color={C.sub}>
              {(m.display_name ?? '') + (m.display_name && m.display_name === myName ? ` (${L.you})` : '')}
            </T>
          </View>
          <Select label={`${L.role} · ${m.email}`} value={m.role} options={roleOpts} disabled={busy} onChange={(r) => setStaff(m.email, r as Role)} />
          <Btn
            kind="d"
            disabled={busy}
            label={confirm === m.user_id ? L.confirmDelete : L.remove}
            onPress={async () => {
              if (confirm !== m.user_id) return setConfirm(m.user_id);
              setConfirm(null);
              await removeStaff(m.user_id);
            }}
          />
        </View>
      ))}
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <Field label={L.email}>
          <Input ltr value={email} onChange={setEmail} label={L.email} placeholder="name@example.com" />
        </Field>
        <Field label={L.role}>
          <Select label={L.role} value={role} options={roleOpts} onChange={(r) => setRole(r as Role)} />
        </Field>
        <Btn
          label={L.addMember}
          disabled={busy || !/^\S+@\S+\.\S+$/.test(email.trim())}
          onPress={async () => {
            if (await setStaff(email.trim(), role)) setEmail('');
          }}
        />
      </View>
    </Card>
  );
}

export function ScholarsView() {
  const { lang, reviewers, role, saveReviewer, deleteReviewer, busy } = useAdmin();
  const L = S[lang];
  const admin = can(role, 'roles');
  const [edit, setEdit] = useState<{ id: number | null; subject_id: string; name: string; published: boolean; last_review: string } | null>(null);
  const subj = (id: string) => SUBJECTS.find((s) => s.id === id)?.name ?? id;
  return (
    <View>
      <Head title={L.tt.scholars} sub={L.ts.scholars} right={admin ? <Pill label={L.addReviewer} onPress={() => setEdit({ id: null, subject_id: SUBJECTS[0].id, name: '', published: false, last_review: '' })} /> : undefined} />
      <Card style={{ overflow: 'hidden' }}>
        {!reviewers.length ? (
          <T color={C.sub} style={{ padding: 24, textAlign: 'center' }}>
            {L.empty}
          </T>
        ) : null}
        {reviewers.map((r) => (
          <P
            key={r.id}
            label={r.name}
            disabled={!admin}
            onPress={() => setEdit({ ...r, last_review: r.last_review ?? '' })}
            hoverStyle={{ backgroundColor: C.sandSoft }}
            style={{ flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 13, paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: C.lineSoft }}>
            <T w={500} style={{ flex: 1.4 }}>
              {r.name}
            </T>
            <T style={{ flex: 1 }}>{subj(r.subject_id)}</T>
            <T style={{ flex: 1 }} color={C.sub}>
              {r.last_review ? fmtDate(lang, r.last_review) : '—'}
            </T>
            <Chip tone={r.published ? 'ok' : 'muted'}>{r.published ? L.status.active : L.unpublished}</Chip>
          </P>
        ))}
      </Card>
      {edit ? (
        <Card style={{ marginTop: 18, padding: 22, gap: 12 }}>
          <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
            <Field label={L.name}>
              <Input value={edit.name} onChange={(v) => setEdit({ ...edit, name: v })} label={L.name} />
            </Field>
            <Field label={L.subject}>
              <Select label={L.subject} value={edit.subject_id} options={SUBJECTS.map((s) => ({ value: s.id, label: s.name }))} onChange={(v) => setEdit({ ...edit, subject_id: v })} />
            </Field>
            <Field label={L.lastReview}>
              <Input ltr value={edit.last_review} onChange={(v) => setEdit({ ...edit, last_review: v })} label={L.lastReview} placeholder="2026-10-01" />
            </Field>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <T>{L.showPublic}</T>
            <Toggle label={L.showPublic} on={edit.published} onPress={() => setEdit({ ...edit, published: !edit.published })} />
          </View>
          <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
            <Btn
              label={L.saved.length > 2 ? (lang === 'ar' ? 'حفظ' : 'Save') : 'Save'}
              disabled={busy || edit.name.trim().length < 2 || (!!edit.last_review && !/^\d{4}-\d{2}-\d{2}$/.test(edit.last_review))}
              onPress={async () => {
                if (await saveReviewer(edit)) setEdit(null);
              }}
            />
            <Btn kind="s" label={L.cancel} onPress={() => setEdit(null)} />
            {edit.id !== null ? (
              <Btn
                kind="d"
                disabled={busy}
                label={L.remove}
                onPress={async () => {
                  if (await deleteReviewer(edit.id!)) setEdit(null);
                }}
              />
            ) : null}
          </View>
        </Card>
      ) : null}
    </View>
  );
}

export function InboxView() {
  const { lang, feedback, markFeedback, busy } = useAdmin();
  const L = S[lang];
  const [flt, setFlt] = useState<'all' | 'new' | 'read' | 'done'>('new');
  const list = feedback.filter((m) => flt === 'all' || m.status === flt);
  return (
    <View>
      <Head
        title={L.inbox}
        sub={L.inboxSub}
        right={
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
            {(['new', 'read', 'done', 'all'] as const).map((k) => (
              <Pill key={k} round label={k === 'all' ? L.all : L.fbStatus[k]} active={flt === k} onPress={() => setFlt(k)} />
            ))}
            <Pill label={L.exportBtn} onPress={() => exportRows(list.map((m) => ({ id: m.id, date: m.created_at, status: m.status, contact: m.contact ?? '', message: m.message })), 'baseerah-feedback')} />
          </View>
        }
      />
      {!list.length ? (
        <Card style={{ padding: 36 }}>
          <T color={C.sub} style={{ textAlign: 'center' }}>
            {L.empty}
          </T>
        </Card>
      ) : null}
      <View style={{ gap: 12 }}>
        {list.map((m) => (
          <Card key={m.id} style={{ padding: 18, gap: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
              <T size={12} color={C.sub}>
                {fmtDate(lang, m.created_at)}
                {m.contact ? ` · ${L.contact}: ${m.contact}` : ''}
              </T>
              <Chip tone={m.status === 'new' ? 'warn' : m.status === 'done' ? 'ok' : 'muted'}>{L.fbStatus[m.status]}</Chip>
            </View>
            <T style={{ lineHeight: 24 }}>{m.message}</T>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {m.status === 'new' ? <Btn kind="s" disabled={busy} label={L.markRead} onPress={() => markFeedback(m.id, 'read')} /> : null}
              {m.status !== 'done' ? <Btn disabled={busy} label={L.markDone} onPress={() => markFeedback(m.id, 'done')} /> : null}
            </View>
          </Card>
        ))}
      </View>
    </View>
  );
}

function CertVerify() {
  const { lang, verifyCert } = useAdmin();
  const L = S[lang];
  const rtl = useRtl();
  const [code, setCode] = useState('');
  const [res, setRes] = useState<null | boolean>(null);
  return (
    <Card style={{ marginTop: 18, padding: 22, maxWidth: 520 }}>
      <T w={600} style={{ marginBottom: 10 }}>
        {L.verifyCode}
      </T>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <TextInput
          value={code}
          onChangeText={(v) => {
            setCode(v);
            setRes(null);
          }}
          onSubmitEditing={async () => setRes(await verifyCert(code))}
          placeholder="BSR-0000"
          placeholderTextColor={C.faint}
          autoCapitalize="characters"
          accessibilityLabel={L.verifyCode}
          style={{ flex: 1, borderWidth: 1, borderColor: C.field, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, fontSize: 14, fontFamily: F.ui(400), color: C.ink, textAlign: rtl ? 'right' : 'left', minHeight: 44 }}
        />
        <Btn label={L.verify} onPress={async () => setRes(await verifyCert(code))} />
      </View>
      {res !== null ? (
        <View style={{ marginTop: 12, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, backgroundColor: res ? C.okBg : C.errBg }} accessibilityLiveRegion="polite">
          <T color={res ? C.green : C.errInk}>{res ? L.valid : L.invalid}</T>
        </View>
      ) : null}
    </Card>
  );
}

// ── Prayer & calendar ────────────────────────────────────────────────────────
export function PrayerView() {
  const { lang, prayer, savePrayer } = useAdmin();
  const L = S[lang];
  const [adj, setAdj] = useState<number | null>(null);
  const toggles: [string, 'notifications' | 'highLatitude' | 'dst'][] = [
    [L.tNtf, 'notifications'],
    [L.tHl, 'highLatitude'],
    [L.tDst, 'dst'],
  ];
  const shown = adj ?? prayer.hijriAdj;
  return (
    <View style={{ maxWidth: 720 }}>
      <Title>{L.prayer}</Title>
      <T color={C.sub} style={{ marginBottom: 20 }}>
        {L.prayerSub}
      </T>
      <Card style={{ padding: 24, gap: 20 }}>
        <View>
          <T size={12} color={C.sub} style={{ marginBottom: 4 }}>
            {L.method}
          </T>
          <Select
            label={L.method}
            value={prayer.method}
            options={METHODS.map((m) => ({ value: m, label: lang === 'ar' ? METHOD_LABEL[m] : m }))}
            onChange={(m) => savePrayer({ ...prayer, method: m as PrayerConfig['method'] })}
          />
        </View>
        <View>
          <View style={{ flexDirection: 'row', gap: 4, marginBottom: 4 }}>
            <T size={12} color={C.sub}>{`${L.hijriAdj}:`}</T>
            <T size={12} w={700} color={C.green} ltr>
              {String(shown)}
            </T>
          </View>
          <Range
            value={shown}
            min={-2}
            max={2}
            step={1}
            label={L.hijriAdj}
            onChange={setAdj}
            onCommit={(v) => {
              setAdj(null);
              if (v !== prayer.hijriAdj) savePrayer({ ...prayer, hijriAdj: v });
            }}
          />
        </View>
        {toggles.map(([l, k]) => (
          <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <T style={{ flexShrink: 1 }}>{l}</T>
            <Toggle label={l} on={prayer[k]} onPress={() => savePrayer({ ...prayer, [k]: !prayer[k] })} />
          </View>
        ))}
      </Card>
    </View>
  );
}
