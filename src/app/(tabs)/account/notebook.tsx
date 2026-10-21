/** دفتر الفوائد — `s.notebook`: add, list and delete notes (highlights from books arrive with their source). */
import { useState } from 'react';
import { TextInput, View } from 'react-native';

import { Button } from '@/components/core/Button';
import { Card } from '@/components/core/Card';
import { Icon } from '@/components/core/Icon';
import { EmptyState } from '@/components/core/parts';
import { Press } from '@/components/core/Press';
import { Txt } from '@/components/core/Txt';
import { BackLink, Screen, Title } from '@/components/layout/Screen';
import { ICON } from '@/data/structural';
import { useApp } from '@/state/app-store';
import { useTheme } from '@/theme/theme';

export default function Notebook() {
  const { t, r, font } = useTheme();
  const notes = useApp((s) => s.notes);
  const addNote = useApp((s) => s.addNote);
  const del = useApp((s) => s.deleteNote);
  const [draft, setDraft] = useState('');
  const add = () => {
    addNote(draft);
    setDraft('');
  };
  return (
    <Screen
      keyboard
      gap={12}
      padBottom={12}
      footer={
        <View style={{ backgroundColor: t.card, borderTopWidth: 1, borderColor: t.line, paddingTop: 10, paddingHorizontal: 20, paddingBottom: 14, flexDirection: 'row', gap: 10 }}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={add}
            returnKeyType="done"
            placeholder="اكتب فائدة..."
            placeholderTextColor={t.muted}
            accessibilityLabel="فائدة جديدة"
            maxLength={2000}
            style={{ flex: 1, height: 48, borderWidth: 1, borderColor: t.line, borderRadius: r(14), backgroundColor: t.bg, color: t.ink, fontFamily: font('ui'), fontSize: 17, paddingHorizontal: 14, textAlign: 'right' }}
          />
          <Button onPress={add} disabled={!draft.trim()} radius={r(14)} style={{ width: 84, paddingHorizontal: 0 }}>
            إضافة
          </Button>
        </View>
      }>
      <BackLink label="حسابي" href="/account" />
      <Title>دفتر الفوائد</Title>
      {!notes.length && <EmptyState>دفترك فارغ. دوّن ما تستفيده من الدروس لتراجعه لاحقًا.</EmptyState>}
      {notes.map((n) => (
        <Card key={n.id} variant="app" radius={18} pad={14} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
          <Txt size={17} lh={1.9} style={{ flex: 1 }} selectable>
            {n.text}
          </Txt>
          <Press onPress={() => del(n.id)} label="حذف الفائدة" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
            <Icon d={ICON.close} size={18} color={t.muted} sw={2.2} />
          </Press>
        </Card>
      ))}
    </Screen>
  );
}
