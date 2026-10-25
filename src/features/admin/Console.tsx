/** Console shell — top bar, section tabs, ⌘K search, alerts and toast. */
import { Link, router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Platform, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSession } from '@/services/auth';
import { useMounted } from '@/utils/useMounted';

import { AppUpdatesView } from './AppUpdatesView';
import { Select } from './controls';
import { useAdmin, type Item } from './store';
import { ROLES, S, VIEWS, type Section, type ViewId } from './strings';
import { C, DirContext, inline, P, T } from './ui';
import { isPending, kindLabel } from './logic';
import { CatalogView, InboxView, LessonsView, OverviewView, PrayerView, ScholarsView, SplitView, TableView, type SplitState } from './views';

const SECTIONS: Section[] = ['work', 'content', 'feedback', 'people', 'system'];

export function Console({ view: requested }: { view: ViewId }) {
  const mounted = useMounted();
  const { session, ready } = useSession();
  const st = useAdmin();
  const { lang, status, load } = st;
  const signedIn = !!session;

  useEffect(() => {
    if (ready) load(signedIn);
  }, [ready, signedIn, load]);

  const rtl = lang === 'ar';
  return (
    <DirContext.Provider value={rtl}>
      <View style={{ flex: 1, backgroundColor: C.ivory, direction: rtl ? 'rtl' : 'ltr' }}>
        {!mounted || status === 'idle' || status === 'loading' ? (
          <Gate busy />
        ) : status === 'ready' ? (
          <Shell requested={requested} />
        ) : (
          <Gate state={status} onRetry={() => load(signedIn)} />
        )}
      </View>
    </DirContext.Provider>
  );
}

function Gate({ busy, state, onRetry }: { busy?: boolean; state?: string; onRetry?: () => void }) {
  const { lang } = useAdmin();
  const L = S[lang];
  const copy =
    state === 'unconfigured'
      ? [L.notConnectedTitle, L.notConnectedBody]
      : state === 'signedOut'
      ? [L.signInTitle, L.signInBody]
      : state === 'noAccess'
      ? [L.noAccessTitle, L.noAccessBody]
      : state === 'error'
      ? [L.loadFail, '']
      : ['', ''];

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 14 }}>
      <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center' }}>
        <T display size={30} color={C.green} style={{ lineHeight: 44 }}>
          ب
        </T>
      </View>
      {busy ? (
        <T color={C.sub} accessibilityLiveRegion="polite">
          …
        </T>
      ) : (
        <>
          <T display size={26} color={C.green} style={{ textAlign: 'center' }}>
            {copy[0]}
          </T>
          {copy[1] ? <T color={C.sub} style={{ textAlign: 'center', maxWidth: 420 }}>{copy[1]}</T> : null}
          <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            {state === 'signedOut' ? (
              <Link href="/auth/sign-in" asChild>
                <P label={L.signIn} style={{ borderRadius: 10, paddingVertical: 10, paddingHorizontal: 18, backgroundColor: C.green, minHeight: 44, justifyContent: 'center' }}>
                  <T w={600} color={C.white}>
                    {L.signIn}
                  </T>
                </P>
              </Link>
            ) : state === 'error' ? (
              <P label={L.retry} onPress={onRetry} style={{ borderRadius: 10, paddingVertical: 10, paddingHorizontal: 18, backgroundColor: C.green, minHeight: 44, justifyContent: 'center' }}>
                <T w={600} color={C.white}>
                  {L.retry}
                </T>
              </P>
            ) : null}
            <P label={L.backToApp} onPress={() => router.replace('/')} style={{ borderRadius: 10, paddingVertical: 10, paddingHorizontal: 18, borderWidth: 1, borderColor: C.field, minHeight: 44, justifyContent: 'center' }}>
              <T w={600} color={C.green}>
                {L.backToApp}
              </T>
            </P>
          </View>
        </>
      )}
    </View>
  );
}

function Shell({ requested }: { requested: ViewId }) {
  const insets = useSafeAreaInsets();
  const { lang, role, myRole, items, toast, setLang, setRole } = useAdmin();
  const L = S[lang];
  const rtl = lang === 'ar';
  const allowedViews = VIEWS.filter((v) => v.roles.includes(role));
  const view = allowedViews.some((v) => v.id === requested) ? requested : 'queue';
  const sec = VIEWS.find((v) => v.id === view)!.sec;

  const [split, setSplit] = useState<SplitState>({ sel: null, chk: {}, flt: 'all', mine: false });
  const [lsel, setLsel] = useState<string | null>(null);
  const [search, setSearch] = useState(false);
  const [q, setQ] = useState('');
  const [bell, setBell] = useState(false);

  const go = (id: ViewId, extra?: Partial<SplitState>) => {
    setSplit((s) => ({ ...s, sel: null, chk: {}, ...extra }));
    setLsel(null);
    router.replace(`/admin/${id}`);
  };

  const openItem = (it: Item) => {
    setSearch(false);
    setBell(false);
    if (it.kind === 'ls') {
      setLsel(it.slot);
      go('lessons');
    } else if (it.kind === 'ev') {
      go('evidence', { sel: it.id });
    } else if (it.kind === 'rp') {
      go('reports', { sel: it.id });
    } else if (it.ckind === 'book' || it.ckind === 'audio') {
      go('library');
    } else {
      go('catalog');
    }
  };

  // ⌘K / Ctrl+K opens search; Escape closes search and alerts (web keyboard).
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const k = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setQ('');
        setSearch(true);
      } else if (e.key === 'Escape') {
        setSearch(false);
        setBell(false);
      }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, []);

  const pending = items.filter(isPending);
  const notifs = useMemo(() => {
    const out: { t: string; s: string; it: Item }[] = [];
    for (const i of items) {
      if (i.kind === 'ls' && i.stage === 1 && i.ap.length === 1) out.push({ t: L.needOneMore(i.title), s: i.ref, it: i });
    }
    for (const i of items) if (i.kind === 'rp' && i.stage === 0 && !i.rej) out.push({ t: L.newReport(i.fields.para ?? i.title), s: i.ref, it: i });
    for (const i of items) if (i.kind === 'ev' && i.stage === 1 && !i.rej) out.push({ t: L.nEv, s: i.ref, it: i });
    return out.slice(0, 6);
  }, [items, L]);

  const hits = useMemo(() => {
    const qq = q.trim().toLowerCase();
    const nav = allowedViews.map((v) => ({ key: 'v:' + v.id, l: L[v.id], k: L[v.sec], go: () => go(v.id) }));
    const its = items.map((i) => ({ key: i.id, l: i.title, k: kindLabel(L, i.kind, i.ckind), go: () => openItem(i) }));
    return [...nav, ...its].filter((h) => !qq || h.l.toLowerCase().includes(qq)).slice(0, 8);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, items, lang, role]);

  const secs = SECTIONS.filter((s) => allowedViews.some((v) => v.sec === s));
  const subs = allowedViews.filter((v) => v.sec === sec);
  const roleLocked = myRole !== 'admin';
  const ie = inline(rtl);

  const body =
    view === 'overview' ? (
      <OverviewView />
    ) : view === 'queue' || view === 'evidence' || view === 'reports' ? (
      <SplitView view={view} st={split} setSt={(p) => setSplit((s) => ({ ...s, ...p }))} />
    ) : view === 'lessons' ? (
      <LessonsView lsel={lsel} setLsel={setLsel} />
    ) : view === 'prayer' ? (
      <PrayerView />
    ) : view === 'catalog' || view === 'library' ? (
      <CatalogView key={view} library={view === 'library'} />
    ) : view === 'scholars' ? (
      <ScholarsView />
    ) : view === 'inbox' ? (
      <InboxView />
    ) : view === 'updates' ? (
      <AppUpdatesView />
    ) : (
      <TableView view={view} />
    );

  return (
    <View style={{ flex: 1 }}>
      {/* Top bar */}
      <View style={{ backgroundColor: C.green, paddingTop: insets.top + 10, paddingBottom: 10, paddingHorizontal: 24, minHeight: 64, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', columnGap: 20, rowGap: 10, zIndex: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center' }}>
            <T display size={22} color={C.green} style={{ lineHeight: 34 }}>
              ب
            </T>
          </View>
          <T display size={20} color={C.white} accessibilityRole="header">
            {L.brand}
          </T>
        </View>
        <View style={{ flexDirection: 'row', gap: 4, flexGrow: 1, flexShrink: 1, minWidth: 0, flexWrap: 'wrap' }} accessibilityRole="tablist">
          {secs.map((s) => (
            <P
              key={s}
              label={L[s]}
              accessibilityRole="tab"
              accessibilityState={{ selected: s === sec }}
              onPress={() => go(allowedViews.find((v) => v.sec === s)!.id)}
              hoverStyle={{ backgroundColor: 'rgba(255,255,255,.14)' }}
              style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, backgroundColor: s === sec ? 'rgba(255,255,255,.18)' : 'transparent' }}>
              <T w={500} color={C.white}>
                {L[s]}
              </T>
            </P>
          ))}
        </View>
        <P
          label={L.search}
          onPress={() => {
            setQ('');
            setSearch(true);
          }}
          style={barBtn}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <T size={13} color={C.white}>
              {L.search}
            </T>
            {Platform.OS === 'web' ? (
              <View style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,.3)', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1, opacity: 0.7 }}>
                <T size={11} color={C.white} ltr>
                  ⌘K
                </T>
              </View>
            ) : null}
          </View>
        </P>
        <View style={{ zIndex: 30 }}>
          <P label={`${L.notif} · ${pending.length}`} onPress={() => setBell(!bell)} accessibilityState={{ expanded: bell }} style={barBtn}>
            <T size={13} color={C.white}>{`${L.notif} · ${pending.length}`}</T>
          </P>
          {bell ? (
            <View
              style={{
                position: 'absolute',
                top: 44,
                ...ie.end(0),
                width: 300,
                backgroundColor: C.white,
                borderWidth: 1,
                borderColor: C.line,
                borderRadius: 12,
                padding: 8,
                zIndex: 30,
                elevation: 12,
                shadowColor: '#000',
                shadowOpacity: 0.16,
                shadowRadius: 32,
                shadowOffset: { width: 0, height: 12 },
              }}>
              {notifs.map((n) => (
                <P key={n.it.id + n.t} label={n.t} onPress={() => openItem(n.it)} hoverStyle={{ backgroundColor: C.ivory }} style={{ paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8 }}>
                  <T size={13}>{n.t}</T>
                  <T size={11} color={C.sub} style={{ marginTop: 2 }}>
                    {n.s}
                  </T>
                </P>
              ))}
              {!notifs.length ? (
                <T size={13} color={C.sub} style={{ padding: 12 }}>
                  {L.empty}
                </T>
              ) : null}
            </View>
          ) : null}
        </View>
        <Select dark label={L.roleN[role]} value={role} disabled={roleLocked} options={ROLES.map((r) => ({ value: r, label: L.roleN[r] }))} onChange={(r) => setRole(r as typeof role)} />
        <P label={L.langBtn} onPress={() => setLang(rtl ? 'en' : 'ar')} style={barBtn}>
          <T size={13} color={C.white} ltr={!rtl}>
            {L.langBtn}
          </T>
        </P>
      </View>

      {/* Section sub-tabs */}
      <View style={{ backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.line }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 6 }} accessibilityRole="tablist">
          {subs.map((v) => (
            <P
              key={v.id}
              label={L[v.id]}
              accessibilityRole="tab"
              accessibilityState={{ selected: v.id === view }}
              onPress={() => go(v.id)}
              style={{ paddingTop: 14, paddingBottom: 12, paddingHorizontal: 12, borderBottomWidth: 2, borderBottomColor: v.id === view ? C.green : 'transparent' }}>
              <T w={500} color={v.id === view ? C.green : C.sub}>
                {L[v.id]}
              </T>
            </P>
          ))}
        </ScrollView>
      </View>

      {role !== myRole ? (
        <View style={{ backgroundColor: C.sand, paddingVertical: 6, paddingHorizontal: 24 }}>
          <T size={12} color="#5c4a1c">
            {L.previewOnly}
          </T>
        </View>
      ) : null}

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ width: '100%', maxWidth: 1320, alignSelf: 'center', paddingTop: 28, paddingHorizontal: 24, paddingBottom: 64 + insets.bottom }} keyboardShouldPersistTaps="handled">
        {body}
      </ScrollView>

      {search ? (
        <P label={L.search} accessibilityRole="none" onPress={() => setSearch(false)} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(20,40,34,.45)', zIndex: 50, alignItems: 'center', paddingTop: 110, paddingHorizontal: 16 }}>
          <P
            accessibilityRole="none"
            onPress={() => {}}
            style={{ width: 560, maxWidth: '100%', maxHeight: '70%', backgroundColor: C.white, borderRadius: 16, overflow: 'hidden', elevation: 20, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 60, shadowOffset: { width: 0, height: 24 } }}>
            <TextInput
              autoFocus
              value={q}
              onChangeText={setQ}
              placeholder={L.searchPh}
              placeholderTextColor={C.faint}
              accessibilityLabel={L.search}
              onSubmitEditing={() => hits[0]?.go()}
              onKeyPress={(e) => e.nativeEvent.key === 'Escape' && setSearch(false)}
              style={{ borderBottomWidth: 1, borderBottomColor: C.line, paddingVertical: 18, paddingHorizontal: 22, fontSize: 16, color: C.ink, textAlign: rtl ? 'right' : 'left', ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null) }}
            />
            <ScrollView keyboardShouldPersistTaps="handled">
              {hits.map((h) => (
                <P key={h.key} label={h.l} onPress={h.go} hoverStyle={{ backgroundColor: C.sandSoft }} style={{ paddingVertical: 12, paddingHorizontal: 22, flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                  <T style={{ flexShrink: 1 }}>{h.l}</T>
                  <T size={12} color={C.sub}>
                    {h.k}
                  </T>
                </P>
              ))}
            </ScrollView>
          </P>
        </P>
      ) : null}

      {toast ? (
        <View pointerEvents="none" style={{ position: 'absolute', bottom: 24 + insets.bottom, left: 0, right: 0, alignItems: 'center', zIndex: 60 }} accessibilityLiveRegion="polite">
          <View style={{ backgroundColor: C.ink, paddingVertical: 12, paddingHorizontal: 22, borderRadius: 12, maxWidth: '90%', elevation: 10 }}>
            <T color={C.white}>{toast}</T>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const barBtn = { borderWidth: 1, borderColor: 'rgba(255,255,255,.25)', backgroundColor: 'rgba(255,255,255,.08)', borderRadius: 8, paddingVertical: 7, paddingHorizontal: 12, minHeight: 36, justifyContent: 'center' } as const;
