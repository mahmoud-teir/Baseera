import fs from 'node:fs';

const path = 'src/app/(tabs)/quran/vocab.tsx';
let s = fs.readFileSync(path, 'utf8');

const oldHeader = `<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Txt font="display" size={27} weight={700} color={t.primary}>
              {item.word}
            </Txt>
            {item.root ? (
              <View style={{ backgroundColor: t.soft, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                <Txt size={13} weight={600} color={t.primary}>
                  جذر: {item.root}
                </Txt>
              </View>
            ) : null}
          </View>
          <Pill label={item.category} bg={t.goldSoft} fg={t.goldInk} />
        </View>`;

const newHeader = `<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
          <View style={{ flex: 1, minWidth: 0, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
            <Txt font="display" size={27} weight={700} color={t.primary} style={{ flexShrink: 1 }}>
              {item.word}
            </Txt>
            {item.root ? (
              <View style={{ backgroundColor: t.soft, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                <Txt size={13} weight={600} color={t.primary}>
                  جذر: {item.root}
                </Txt>
              </View>
            ) : null}
          </View>
          <View style={{ flexShrink: 0, marginTop: 2 }}>
            <Pill label={item.category} bg={t.goldSoft} fg={t.goldInk} />
          </View>
        </View>`;

const oldCard = `<Card variant="app" radius={22} pad={18} style={{ gap: 14 }}>`;
const newCard = `<Card variant="app" radius={22} pad={18} style={{ gap: 14, overflow: 'hidden' }}>`;

const oldAyahHeader = `<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Txt size={13} weight={700} color={t.goldInk}>
                  سورة {a.surahName} · الآية {a.ayah}
                </Txt>
                <Txt size={12} color={t.muted}>
                  شاهد {i + 1}
                </Txt>
              </View>`;

const newAyahHeader = `<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <Txt size={13} weight={700} color={t.goldInk} style={{ flexShrink: 1 }}>
                  سورة {a.surahName} · الآية {a.ayah}
                </Txt>
                <Txt size={12} color={t.muted} style={{ flexShrink: 0 }}>
                  شاهد {i + 1}
                </Txt>
              </View>`;

s = s.replace(oldCard, newCard);

// Normalize CRLF for matching
const norm = (str) => str.replace(/\r?\n/g, '\n');
const toFileEnding = (str, isCRLF) => isCRLF ? str.replace(/\n/g, '\r\n') : str.replace(/\r\n/g, '\n');
const isCRLF = s.includes('\r\n');

s = toFileEnding(norm(s).replace(norm(oldHeader), norm(newHeader)).replace(norm(oldAyahHeader), norm(newAyahHeader)), isCRLF);

fs.writeFileSync(path, s);
console.log('vocab.tsx updated successfully to prevent tag overflow!');
