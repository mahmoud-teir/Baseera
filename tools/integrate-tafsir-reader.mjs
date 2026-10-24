import fs from 'node:fs';

const path = 'src/app/reader/[surah].tsx';
let s = fs.readFileSync(path, 'utf8');

// 1. Add ScrollView to react-native import
s = s.replace(
  "import { AppState as RNAppState, FlatList, Linking, View, type ListViewToken } from 'react-native';",
  "import { AppState as RNAppState, FlatList, Linking, ScrollView, View, type ListViewToken } from 'react-native';"
);

// 2. Add import for tafsir service
const tafsirImport = "import { TAFSIRS, getTafsirInfo, useAyahTafsir } from '@/services/tafsir';\r\n";
s = s.replace("import { useTheme } from '@/theme/theme';", "import { useTheme } from '@/theme/theme';\r\n" + tafsirImport);

// 3. Define AyahTafsirContent component
const ayahTafsirComponent = `/** عرض محتوى تفسير الآية مع إمكانية التبديل السريع بين أمهات كتب التفسير الستة */
function AyahTafsirContent({
  surah,
  ayah,
  surahName,
  defaultTafsir,
  onSelectTafsir,
  publishedTafsir,
  t,
  r,
}: {
  surah: number;
  ayah: number;
  surahName: string;
  defaultTafsir: string;
  onSelectTafsir: (name: string) => void;
  publishedTafsir?: { tafsir: string; source: string; ayahs: Record<string, string> } | null;
  t: any;
  r: (n: number) => number;
}) {
  const [activeTafsirId, setActiveTafsirId] = useState(getTafsirInfo(defaultTafsir).id);
  const { text, loading, error, retry, tafsirInfo } = useAyahTafsir(surah, ayah, activeTafsirId);

  const displayText = text ?? (publishedTafsir?.ayahs[String(ayah)] ?? null);

  return (
    <View style={{ gap: 12 }}>
      {/* شريط اختيار كتاب التفسير من التفاسير الستة المعتمدة */}
      <View style={{ gap: 6 }}>
        <Txt size={13} weight={600} color={t.muted}>
          اختر كتاب التفسير:
        </Txt>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginHorizontal: -4 }}
          contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
          {TAFSIRS.map((tInfo) => {
            const isSelected = tInfo.id === activeTafsirId;
            return (
              <Press
                key={tInfo.id}
                onPress={() => {
                  setActiveTafsirId(tInfo.id);
                  onSelectTafsir(tInfo.name);
                }}
                label={tInfo.name}
                style={{
                  paddingHorizontal: 14,
                  height: 36,
                  borderRadius: 99,
                  backgroundColor: isSelected ? t.primary : t.soft,
                  borderWidth: 1,
                  borderColor: isSelected ? t.primary : t.line,
                  justifyContent: 'center',
                }}>
                <Txt size={13} weight={600} color={isSelected ? '#FFFFFF' : t.ink}>
                  {tInfo.shortName}
                </Txt>
              </Press>
            );
          })}
        </ScrollView>
      </View>

      {/* ترويسة التفسير الحالي والمصدر */}
      <View style={{ backgroundColor: t.goldSoft, borderRadius: r(12), padding: 10, gap: 2 }}>
        <Txt size={14} weight={700} color={t.goldInk}>
          {tafsirInfo.name} · {tafsirInfo.source}
        </Txt>
        <Txt size={12} color={t.goldInk} style={{ opacity: 0.85 }}>
          {tafsirInfo.author}
        </Txt>
      </View>

      {/* نص التفسير المعتمد */}
      {loading ? (
        <View style={{ gap: 8, paddingVertical: 10 }}>
          <Skeleton height={20} />
          <Skeleton height={20} />
          <Skeleton height={20} />
          <Skeleton height={14} width="70%" />
        </View>
      ) : error && !displayText ? (
        <View style={{ backgroundColor: t.errBg, borderRadius: r(14), padding: 14, gap: 8 }}>
          <Txt size={14} color={t.errInk} lh={1.8}>
            تعذّر تحميل تفسير هذه الآية بدون اتصال، ولم يُحفظ هذا الجزء محلياً بعد.
          </Txt>
          <Button variant="secondary" onPress={retry} style={{ alignSelf: 'flex-start', borderColor: t.errInk, minHeight: 36 }}>
            <Txt size={14} weight={600} color={t.errInk}>
              إعادة المحاولة
            </Txt>
          </Button>
        </View>
      ) : displayText ? (
        <View style={{ gap: 10 }}>
          <Txt size={16} lh={2} color={t.ink} selectable>
            {displayText}
          </Txt>
          <EvidenceActions
            where={\`تفسير سورة \${surahName} · الآية \${ayah} (\${tafsirInfo.name})\`}
            data={{ text: displayText, source: \`\${tafsirInfo.name} · \${tafsirInfo.source}\` }}
          />
        </View>
      ) : (
        <PendingSlot>تفسير هذه الآية غير متوفر حالياً في هذا الكتاب.</PendingSlot>
      )}
    </View>
  );
}

`;

s = s.replace('export default function Reader() {', ayahTafsirComponent + 'export default function Reader() {');

// 4. Replace tab === 'tafsir' body
const oldTafsirRender = `) : tab === 'tafsir' ? (
              <View style={{ gap: 9 }}>
                {tafsir && tafsir.ayahs[String(sel)] ? (
                  <>
                    <Txt size={14} weight={600} color={t.goldInk}>
                      {tafsir.tafsir} · {tafsir.source}
                    </Txt>
                    <Txt size={17} lh={1.9} color={t.body}>
                      {tafsir.ayahs[String(sel)]}
                    </Txt>
                    <EvidenceActions where={\`تفسير سورة \${s.name} · الآية \${sel}\`} data={{ text: tafsir.ayahs[String(sel)], source: \`\${tafsir.tafsir} · \${tafsir.source}\` }} />
                  </>
                ) : (
                  <>
                    <PendingSlot>تفسير هذه الآية يُدرج من مصدر موثّق بعد المراجعة العلمية.</PendingSlot>
                    <EvidenceActions where={\`تفسير سورة \${s.name} · الآية \${sel}\`} />
                  </>
                )}
              </View>
            )`;

const newTafsirRender = `) : tab === 'tafsir' ? (
              <AyahTafsirContent
                surah={n}
                ayah={sel}
                surahName={s.name}
                defaultTafsir={setting('tafsir')}
                onSelectTafsir={(name) => setSetting('tafsir', name as any)}
                publishedTafsir={tafsir}
                t={t}
                r={r}
              />
            )`;

const norm = (str) => str.replace(/\r?\n/g, '\n');
const isCRLF = s.includes('\r\n');
const toFileEnding = (str) => isCRLF ? str.replace(/\n/g, '\r\n') : str.replace(/\r\n/g, '\n');

s = toFileEnding(norm(s).replace(norm(oldTafsirRender), norm(newTafsirRender)));

fs.writeFileSync(path, s);
console.log('Reader tafsir integration complete!');
