import fs from 'fs';

// 1. Update src/app/tawheed/[id].tsx
{
  const path = 'src/app/tawheed/[id].tsx';
  let content = fs.readFileSync(path, 'utf8');

  // Change RoundBackHeader size to 20
  content = content.replace(
    '<RoundBackHeader title={`البوابة ${gate.number}: ${gate.title}`} href="/tawheed" />',
    '<RoundBackHeader title={`البوابة ${gate.number}: ${gate.title}`} href="/tawheed" size={20} />'
  );

  // Replace tab container with horizontal ScrollView
  const oldTabs = `      {/* شريط التبويبات العلوي */}
      <View
        style={{
          flexDirection: 'row',
          paddingHorizontal: 12,
          paddingVertical: 8,
          backgroundColor: t.card,
          borderBottomWidth: 1,
          borderBottomColor: t.line,
          gap: 6,
        }}>`;

  const newTabs = `      {/* شريط التبويبات العلوي المتجاوب */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          flexDirection: 'row',
          paddingHorizontal: 12,
          paddingVertical: 8,
          gap: 6,
          minWidth: '100%',
        }}
        style={{
          backgroundColor: t.card,
          borderBottomWidth: 1,
          borderBottomColor: t.line,
          flexGrow: 0,
        }}>`;

  if (content.includes(oldTabs)) {
    content = content.replace(oldTabs, newTabs);
    // Replace closing View of tabs with ScrollView
    content = content.replace(
      `        })}
      </View>`,
      `        })}
      </ScrollView>`
    );
  }

  // Ensure each tab button has minWidth and no wrapping
  content = content.replace(
    `              style={{
                flex: 1,
                paddingVertical: 8,`,
    `              style={{
                flex: 1,
                minWidth: 84,
                paddingHorizontal: 8,
                paddingVertical: 8,`
  );

  // Wrap Hadith and Quote headers
  content = content.replace(
    `                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Txt size={12} weight={700} color={gc}>
                      {h.narrator}
                    </Txt>
                    <Txt size={11} color={t.muted}>
                      {h.source}
                    </Txt>
                  </View>`,
    `                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                    <Txt size={12} weight={700} color={gc} style={{ flexShrink: 1 }}>
                      {h.narrator}
                    </Txt>
                    <Txt size={11} color={t.muted} style={{ flexShrink: 0 }}>
                      {h.source}
                    </Txt>
                  </View>`
  );

  content = content.replace(
    `                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Txt size={14} weight={700} color={gc}>
                      {q.scholar}
                    </Txt>
                    {q.era && (
                      <Txt size={11} color={t.muted}>
                        {q.era}
                      </Txt>
                    )}
                  </View>`,
    `                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                    <Txt size={14} weight={700} color={gc} style={{ flexShrink: 1 }}>
                      {q.scholar}
                    </Txt>
                    {q.era && (
                      <Txt size={11} color={t.muted} style={{ flexShrink: 0 }}>
                        {q.era}
                      </Txt>
                    )}
                  </View>`
  );

  // Quiz question row flex
  content = content.replace(
    `<View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 12 }}>`,
    `<View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12, width: '100%' }}>`
  );

  content = content.replace(
    `<Txt size={15} weight={700} color={t.ink} style={{ flex: 1 }} lh={1.5}>`,
    `<Txt size={15} weight={700} color={t.ink} style={{ flex: 1, minWidth: 0, flexShrink: 1 }} lh={1.5}>`
  );

  fs.writeFileSync(path, content, 'utf8');
  console.log('Updated tawheed/[id].tsx');
}

// 2. Update src/app/tawheed/index.tsx
{
  const path = 'src/app/tawheed/index.tsx';
  let content = fs.readFileSync(path, 'utf8');

  // RoundBackHeader size 24
  content = content.replace(
    '<RoundBackHeader title="بوابات التوحيد واليقين" href="/" />',
    '<RoundBackHeader title="بوابات التوحيد واليقين" href="/" size={24} />'
  );

  // Header card row
  content = content.replace(
    `<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>`,
    `<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, width: '100%' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>`
  );

  content = content.replace(
    `<View>
                <Txt size={17} weight={700} color={t.ink}>
                  معالم الدين الحق والطائفة المنصورة
                </Txt>`,
    `<View style={{ flex: 1, minWidth: 0 }}>
                <Txt size={17} weight={700} color={t.ink} numberOfLines={2}>
                  معالم الدين الحق والطائفة المنصورة
                </Txt>`
  );

  // Progress row
  content = content.replace(
    `<View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>`,
    `<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>`
  );

  // Gate list items
  content = content.replace(
    `<View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>`,
    `<View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, width: '100%' }}>`
  );

  content = content.replace(
    `                    {/* رقم البوابة أو حالة القفل */}
                    <View
                      style={{
                        width: 44,
                        height: 44,`,
    `                    {/* رقم البوابة أو حالة القفل */}
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        flexShrink: 0,`
  );

  content = content.replace(
    `                    {/* تفاصيل البوابة */}
                    <View style={{ flex: 1 }}>`,
    `                    {/* تفاصيل البوابة */}
                    <View style={{ flex: 1, minWidth: 0 }}>`
  );

  content = content.replace(
    `                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Txt size={12} weight={700} color={isUnlocked ? gc : t.muted}>
                          البوابة {gate.number}
                        </Txt>`,
    `                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                        <Txt size={12} weight={700} color={isUnlocked ? gc : t.muted} style={{ flexShrink: 1 }}>
                          البوابة {gate.number}
                        </Txt>`
  );

  content = content.replace(
    `                      {/* شارة المعرفة المستفادة */}
                      <View
                        style={{
                          marginTop: 10,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                          alignSelf: 'flex-start',
                          backgroundColor: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          borderRadius: r(8),
                        }}>
                        <Icon d={ICON.star8} size={14} color={isUnlocked ? gc : t.muted} />
                        <Txt size={11} weight={600} color={isUnlocked ? t.ink : t.muted}>
                          {gate.badgeTitle}
                        </Txt>
                      </View>`,
    `                      {/* شارة المعرفة المستفادة */}
                      <View
                        style={{
                          marginTop: 10,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                          alignSelf: 'flex-start',
                          maxWidth: '100%',
                          backgroundColor: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                          borderRadius: r(8),
                        }}>
                        <View style={{ flexShrink: 0 }}>
                          <Icon d={ICON.star8} size={14} color={isUnlocked ? gc : t.muted} />
                        </View>
                        <Txt size={11} weight={600} color={isUnlocked ? t.ink : t.muted} style={{ flexShrink: 1 }} numberOfLines={1}>
                          {gate.badgeTitle}
                        </Txt>
                      </View>`
  );

  fs.writeFileSync(path, content, 'utf8');
  console.log('Updated tawheed/index.tsx');
}

// 3. Update src/app/tawheed/intro.tsx
{
  const path = 'src/app/tawheed/intro.tsx';
  let content = fs.readFileSync(path, 'utf8');

  content = content.replace(
    `<View style={{ flex: 1 }}>
                <Txt size={15} weight={700} color="#FFFFFF">
                  {item.title}
                </Txt>`,
    `<View style={{ flex: 1, minWidth: 0 }}>
                <Txt size={15} weight={700} color="#FFFFFF">
                  {item.title}
                </Txt>`
  );

  content = content.replace(
    `              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,`,
    `              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  flexShrink: 0,`
  );

  fs.writeFileSync(path, content, 'utf8');
  console.log('Updated tawheed/intro.tsx');
}

// 4. Update src/app/(tabs)/(home)/index.tsx
{
  const path = 'src/app/(tabs)/(home)/index.tsx';
  let content = fs.readFileSync(path, 'utf8');

  // Tawheed banner responsive styling
  content = content.replace(
    `<View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View
            style={{
              width: 44,
              height: 44,`,
    `<View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%' }}>
          <View
            style={{
              width: 44,
              height: 44,
              flexShrink: 0,`
  );

  content = content.replace(
    `          <View style={{ flex: 1, gap: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Txt size={12} weight={700} color={gc}>
                المنهج الحق وأدلة الطائفة المنصورة
              </Txt>
              <Txt size={11} weight={700} color={gc}>
                {completedTawheed}/7 بوابات
              </Txt>
            </View>`,
    `          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
              <Txt size={12} weight={700} color={gc} style={{ flexShrink: 1 }}>
                المنهج الحق وأدلة الطائفة المنصورة
              </Txt>
              <Txt size={11} weight={700} color={gc} style={{ flexShrink: 0 }}>
                {completedTawheed}/7 بوابات
              </Txt>
            </View>`
  );

  content = content.replace(
    `<Icon d={ICON.forward} size={18} color={gc} sw={2.2} directional />
        </View>
      </Card>`,
    `<View style={{ flexShrink: 0 }}>
            <Icon d={ICON.forward} size={18} color={gc} sw={2.2} directional />
          </View>
        </View>
      </Card>`
  );

  fs.writeFileSync(path, content, 'utf8');
  console.log('Updated (home)/index.tsx');
}
