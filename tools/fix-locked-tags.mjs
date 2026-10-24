import fs from 'fs';
import path from 'path';

const p = path.resolve('src/app/(tabs)/academy/locked/[stage].tsx');
let c = fs.readFileSync(p, 'utf8');

// Replace Stage 2 card rendering
const oldS2Card = `{STAGE2_SUBJECTS.map((sub, idx) => (
              <Card key={sub.id} variant="app" radius={18} pad={14} style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Txt size={17} weight={700} color={t.primary}>
                    {idx + 1}. {sub.name}
                  </Txt>
                  <Pill label={\`\${sub.lessonsCount} درسًا\`} bg={t.soft} fg={t.primary} size={12} />
                </View>`;

const newS2Card = `{STAGE2_SUBJECTS.map((sub, idx) => (
              <Card
                key={sub.id}
                variant="app"
                radius={18}
                pad={14}
                style={{ gap: 8 }}
                onPress={() => router.push(\`/academy/subject/\${sub.id}\` as any)}
                label={sub.name}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <Txt size={16} weight={700} color={t.primary} style={{ flex: 1, minWidth: 0 }}>
                    {idx + 1}. {sub.name}
                  </Txt>
                  <View style={{ flexShrink: 0 }}>
                    <Pill label={\`\${sub.lessonsCount} درسًا\`} bg={t.soft} fg={t.primary} size={12} />
                  </View>
                </View>`;

// Replace Stage 3 card rendering
const oldS3Card = `{STAGE3_SUBJECTS.map((sub, idx) => (
              <Card key={sub.id} variant="app" radius={18} pad={14} style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Txt size={17} weight={700} color={t.primary}>
                    {idx + 1}. {sub.name}
                  </Txt>
                  <Pill label={\`\${sub.lessonsCount} درسًا\`} bg={t.soft} fg={t.primary} size={12} />
                </View>`;

const newS3Card = `{STAGE3_SUBJECTS.map((sub, idx) => (
              <Card
                key={sub.id}
                variant="app"
                radius={18}
                pad={14}
                style={{ gap: 8 }}
                onPress={() => router.push(\`/academy/subject/\${sub.id}\` as any)}
                label={sub.name}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <Txt size={16} weight={700} color={t.primary} style={{ flex: 1, minWidth: 0 }}>
                    {idx + 1}. {sub.name}
                  </Txt>
                  <View style={{ flexShrink: 0 }}>
                    <Pill label={\`\${sub.lessonsCount} درسًا\`} bg={t.soft} fg={t.primary} size={12} />
                  </View>
                </View>`;

// Topic tag replacement
const oldTopics = `<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
                  {sub.keyTopics.map((top) => (
                    <View key={top} style={{ backgroundColor: t.soft, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                      <Txt size={12} color={t.ink}>
                        • {top}
                      </Txt>
                    </View>
                  ))}
                </View>`;

const newTopics = `<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  {sub.keyTopics.map((top) => (
                    <View
                      key={top}
                      style={{
                        backgroundColor: t.soft,
                        borderRadius: 8,
                        paddingHorizontal: 8,
                        paddingVertical: 5,
                        maxWidth: '100%',
                      }}>
                      <Txt size={12} color={t.ink} lh={1.5} style={{ flexShrink: 1 }}>
                        • {top}
                      </Txt>
                    </View>
                  ))}
                </View>`;

// Normalize CRLF for replacements
const replaceAll = (content, search, replace) => {
  const normContent = content.replace(/\r\n/g, '\n');
  const normSearch = search.replace(/\r\n/g, '\n');
  const normReplace = replace.replace(/\r\n/g, '\n');
  return normContent.split(normSearch).join(normReplace);
};

c = replaceAll(c, oldS2Card, newS2Card);
c = replaceAll(c, oldS3Card, newS3Card);
c = replaceAll(c, oldTopics, newTopics);

// Add button for Stage 3
const oldBottom = `<Note align="center">القرآن والمكتبة والصوتيات وخريطة العلم متاحة لك دائمًا لمتابعة طلب العلم.</Note>
      <Button size="lg" onPress={() => router.dismissTo('/academy')}>
        {s2 && !allStage1Done ? 'متابعة دروس المرحلة الأولى' : 'العودة إلى الأكاديمية'}
      </Button>`;

const newBottom = `{!s2 && (
        <Button size="lg" onPress={() => router.push('/academy/subject/comparative_fiqh' as any)}>
          بدء دراسة الفقه المقارن (المرحلة الثالثة)
        </Button>
      )}
      <Note align="center">القرآن والمكتبة والصوتيات وخريطة العلم متاحة لك دائمًا لمتابعة طلب العلم.</Note>
      <Button variant={!s2 ? 'soft' : 'primary'} size="lg" onPress={() => router.dismissTo('/academy')}>
        {s2 && !allStage1Done ? 'متابعة دروس المرحلة الأولى' : 'العودة إلى الأكاديمية'}
      </Button>`;

c = replaceAll(c, oldBottom, newBottom);

fs.writeFileSync(p, c, 'utf8');
console.log('Successfully updated locked/[stage].tsx with fixed tags and interactive cards!');
