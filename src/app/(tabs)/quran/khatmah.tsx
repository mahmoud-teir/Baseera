/**
 * ختمة القرآن الكريم — Quran Khatmah Planner & Tracker.
 * Allows users to set customized Khatmah goals (30 days, 60 days, custom),
 * track daily reading portions (الأوراد), log page milestones, view previous completed Khatmahs,
 * and read the authentic Dua of Khatm al-Quran.
 */
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Modal, ScrollView, TextInput, View } from 'react-native';

import { Card } from '@/components/core/Card';
import { Icon } from '@/components/core/Icon';
import { Press } from '@/components/core/Press';
import { ProgressBar } from '@/components/core/ProgressBar';
import { Txt } from '@/components/core/Txt';
import { Hero } from '@/components/layout/Hero';
import { RoundBackHeader, Screen } from '@/components/layout/Screen';
import { juzName } from '@/data/quran/pages';
import { ICON } from '@/data/structural';
import { useApp } from '@/state/app-store';
import { useUi } from '@/state/ui-store';
import { useTheme } from '@/theme/theme';
import { DAY } from '@/utils/date';

const KHATM_DUA = `اللَّهُمَّ ارْحَمْنِي بِالْقُرْآنِ، وَاجْعَلْهُ لِي إِمَامًا وَنُورًا وَهُدًى وَرَحْمَةً.
اللَّهُمَّ ذَكِّرْنِي مِنْهُ مَا نَسِيتُ، وَعَلِّمْنِي مِنْهُ مَا جَهِلْتُ، وَارْزُقْنِي تِلَاوَتَهُ آنَاءَ اللَّيْلِ وَأَطْرَافَ النَّهَارِ، وَاجْعَلْهُ لِي حُجَّةً يَا رَبَّ الْعَالَمِينَ.
اللَّهُمَّ أَصْلِحْ لِي دِينِي الَّذِي هُوَ عِصْمَةُ أَمْرِي، وَأَصْلِحْ لِي دُنْيَايَ الَّتِي فِيهَا مَعَاشِي، وَأَصْلِحْ لِي آخِرَتِي الَّتِي فِيهَا مَعَادِي، وَاجْعَلِ الْحَيَاةَ زِيَادَةً لِي فِي كُلِّ خَيْرٍ، وَاجْعَلِ الْمَوْتَ رَاحَةً لِي مِنْ كُلِّ شَرٍّ.
اللَّهُمَّ اجْعَلْ خَيْرَ عُمْرِي آخِرَهُ، وَخَيْرَ عَمَلِي خَوَاتِمَهُ، وَخَيْرَ أَيَّامِي يَوْمَ أَلْقَاكَ فِيهِ.
اللَّهُمَّ إِنِّي أَسْأَلُكَ عِيشَةً هَنِيَّةً، وَمِيتَةً سَوِيَّةً، وَمَرَدًّا غَيْرَ مُخْزٍ وَلَا فَاضِحٍ.
اللَّهُمَّ اقْسِمْ لَنَا مِنْ خَشْيَتِكَ مَا تَحُولُ بِهِ بَيْنَنَا وَبَيْنَ مَعْصِيَتِكَ، وَمِنْ طَاعَتِكَ مَا تُبَلِّغُنَا بِهِ جَنَّتَكَ، وَمِنَ الْيَقِينِ مَا تُهَوِّنُ بِهِ عَلَيْنَا مَصَائِبَ الدُّنْيَا.
اللَّهُمَّ لَا تَدَعْ لَنَا ذَنْبًا إِلَّا غَفَرْتَهُ، وَلَا هَمًّا إِلَّا فَرَّجْتَهُ، وَلَا دَيْنًا إِلَّا قَضَيْتَهُ، وَلَا حَاجَةً مِنْ حَوَائِجِ الدُّنْيَا وَالْآخِرَةِ إِلَّا قَضَيْتَهَا يَا أَرْحَمَ الرَّاحِمِينَ.`;

export default function KhatmahScreen() {
  const { t, pc, gc, r } = useTheme();
  const router = useRouter();
  const flash = useUi((s) => s.flash);
  const khatmahState = useApp((s) => s.khatmah);
  const startKhatmah = useApp((s) => s.startKhatmah);
  const updateKhatmahPage = useApp((s) => s.updateKhatmahPage);
  const completeKhatmah = useApp((s) => s.completeKhatmah);
  const [now] = useState(() => Date.now());

  const [modalNew, setModalNew] = useState(false);
  const [modalDua, setModalDua] = useState(false);
  const [modalSetPage, setModalSetPage] = useState(false);

  const [inputTitle, setInputTitle] = useState('ختمة شهر رمضان المبارك');
  const [inputDays, setInputDays] = useState(30);
  const [inputPage, setInputPage] = useState('1');

  const active = khatmahState?.active;
  const history = khatmahState?.history ?? [];

  // Derived calculation
  const curPage = active?.currentPage ?? 1;
  const pct = Math.min(100, Math.round((curPage / 604) * 100));
  const curJuz = Math.min(30, Math.floor((curPage - 1) / 20) + 1);
  const pagesPerDay = active ? Math.ceil((604 - active.startPage + 1) / Math.max(1, active.targetDays)) : 20;

  // Days left calculation
  const daysLeft = active
    ? Math.max(0, Math.ceil((new Date(active.targetDate).getTime() - now) / DAY))
    : 0;

  const handleStartNew = () => {
    startKhatmah(inputDays, 1, inputTitle || 'ختمة القرآن الكريم');
    setModalNew(false);
    flash('تم بدء الختمة المباركة بنجاح، نسأل الله التوفيق والقبول');
  };

  const handleAdvancePortion = () => {
    if (!active) return;
    const nextPage = Math.min(604, curPage + pagesPerDay);
    updateKhatmahPage(nextPage);
    flash(`ما شاء الله! تقدمت إلى الصفحة ${nextPage}`);
    if (nextPage >= 604) {
      setModalDua(true);
    }
  };

  const handleSetCustomPage = () => {
    const p = parseInt(inputPage, 10);
    if (isNaN(p) || p < 1 || p > 604) {
      flash('يرجى إدخال رقم صفحة صحيح بين 1 و 604');
      return;
    }
    updateKhatmahPage(p);
    setModalSetPage(false);
    flash(`تم تحديث موضع القراءة إلى الصفحة ${p}`);
  };

  return (
    <Screen gap={16}>
      <RoundBackHeader title="ختمة القرآن" href="/quran" size={28} />

      {!active ? (
        /* Empty State: Create a New Khatmah */
        <View style={{ gap: 14 }}>
          <Hero radius={24} pad={20} gap={10} diamond={{ size: 120, left: -30, top: -30, color: 'rgba(196,166,106,.4)' }} lattice={false}>
            <Txt size={14} weight={600} color={gc}>
              برنامج ختم القرآن الكريم
            </Txt>
            <Txt font="display" size={26} weight={700} color="#FFFFFF" lh={1.4}>
              ابدأ ختمتك المباركة اليوم
            </Txt>
            <Txt size={14} color="#CFE0DA" lh={1.7}>
              حدد المدة التي تناسب وقتك (30 يومًا، 60 يومًا، أو مدة مخصصة) وتابع وردك اليومي خطوة بخطوة حتى ختم كتاب الله.
            </Txt>
            <View style={{ paddingTop: 6 }}>
              <Press
                onPress={() => setModalNew(true)}
                label="إنشاء ختمة جديدة"
                style={{
                  alignSelf: 'flex-start',
                  backgroundColor: '#FAF8F2',
                  paddingHorizontal: 20,
                  height: 44,
                  borderRadius: r(12),
                  justifyContent: 'center',
                }}>
                <Txt size={16} weight={700} color={pc}>
                  + ابدأ ختمة جديدة
                </Txt>
              </Press>
            </View>
          </Hero>

          {/* Quick presets guide */}
          <Card variant="app" radius={20} pad={16} style={{ gap: 10 }}>
            <Txt size={15} weight={700} color={t.primary}>
              برامج الختم المقترحة:
            </Txt>
            <View style={{ gap: 8 }}>
              {[
                { title: 'ختمة في 30 يومًا', desc: 'جزء واحد (20 صفحة) يومياً · بمعدل 4 صفحات بعد كل صلاة' },
                { title: 'ختمة في 60 يومًا', desc: 'نصف جزء (10 صفحات) يومياً · بمعدل صفحتين بعد كل صلاة' },
                { title: 'ختمة في 15 يومًا', desc: 'جزآن (40 صفحة) يومياً لمن أراد الإكثار كالعشر الأواخر' },
              ].map((item) => (
                <View key={item.title} style={{ backgroundColor: t.soft, borderRadius: r(12), padding: 12, gap: 2 }}>
                  <Txt size={14} weight={700} color={t.ink}>
                    {item.title}
                  </Txt>
                  <Txt size={12} color={t.muted}>
                    {item.desc}
                  </Txt>
                </View>
              ))}
            </View>
          </Card>
        </View>
      ) : (
        /* Active Khatmah View */
        <View style={{ gap: 14 }}>
          <Hero radius={26} pad={20} gap={14} diamond={{ size: 140, left: -36, top: -36, color: 'rgba(196,166,106,.5)' }} lattice={false}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ gap: 2 }}>
                <Txt size={13} weight={600} color={gc}>
                  الختمة الحالية
                </Txt>
                <Txt font="display" size={26} weight={700} color="#FFFFFF">
                  {active.title}
                </Txt>
              </View>
              <View style={{ backgroundColor: 'rgba(255,255,255,.15)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: r(10) }}>
                <Txt size={13} weight={700} color="#FFFFFF">
                  باقٍ {daysLeft} يوم
                </Txt>
              </View>
            </View>

            {/* Progress */}
            <View style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Txt size={14} color="#CFE0DA">
                  الصفحة {curPage} من 604 ({juzName(curJuz)})
                </Txt>
                <Txt size={16} weight={700} color={gc}>
                  {pct}%
                </Txt>
              </View>
              <ProgressBar value={pct} light height={7} />
            </View>

            {/* Daily Portion Card */}
            <View style={{ backgroundColor: 'rgba(0,0,0,.25)', borderRadius: r(16), padding: 14, gap: 6 }}>
              <Txt size={13} color={gc} weight={600}>
                ورد اليوم المقترح:
              </Txt>
              <Txt size={15} weight={700} color="#FFFFFF">
                {pagesPerDay} صفحة · حتى الصفحة {Math.min(604, curPage + pagesPerDay)}
              </Txt>
            </View>

            {/* Quick Action Buttons inside Hero */}
            <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
              <Press
                onPress={handleAdvancePortion}
                label="أتممت ورد اليوم"
                style={{
                  flex: 1,
                  backgroundColor: '#FAF8F2',
                  height: 44,
                  borderRadius: r(12),
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Txt size={15} weight={700} color={pc}>
                  أتممت ورد اليوم ✓
                </Txt>
              </Press>

              <Press
                onPress={() => setModalSetPage(true)}
                label="تحديد الصفحة"
                style={{
                  paddingHorizontal: 14,
                  backgroundColor: 'rgba(255,255,255,.15)',
                  height: 44,
                  borderRadius: r(12),
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Txt size={13} weight={600} color="#FFFFFF">
                  انتقال لصفحة ✎
                </Txt>
              </Press>
            </View>
          </Hero>

          {/* Stepper manual update */}
          <Card variant="app" radius={18} pad={14} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Press
              onPress={() => curPage > 1 && updateKhatmahPage(curPage - 1)}
              label="الصفحة السابقة"
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: t.soft, alignItems: 'center', justifyContent: 'center' }}>
              <Txt size={20} color={t.primary}>
                −
              </Txt>
            </Press>

            <View style={{ alignItems: 'center', gap: 2 }}>
              <Txt size={13} color={t.muted}>
                الموضع الحالي بالمصحف
              </Txt>
              <Txt size={22} weight={700} color={t.primary} ltr>
                صفحة {curPage}
              </Txt>
            </View>

            <Press
              onPress={() => curPage < 604 && updateKhatmahPage(curPage + 1)}
              label="الصفحة التالية"
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: t.soft, alignItems: 'center', justifyContent: 'center' }}>
              <Txt size={20} color={t.primary}>
                +
              </Txt>
            </Press>
          </Card>

          {/* Complete Khatmah Button */}
          {curPage >= 604 ? (
            <Card variant="app" radius={20} pad={16} style={{ backgroundColor: t.goldSoft, borderColor: gc, gap: 10, alignItems: 'center' }}>
              <Txt font="display" size={24} weight={700} color={t.goldInk} align="center">
                مبارك! أتممت قراءة القرآن الكريم كاملًا
              </Txt>
              <Txt size={14} color={t.goldInk} align="center">
                تقبل الله طاعتكم، يُستحب الآن قراءة دعاء ختم القرآن الكريم.
              </Txt>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Press
                  onPress={() => setModalDua(true)}
                  label="دعاء ختم القرآن"
                  style={{ backgroundColor: pc, paddingHorizontal: 20, height: 44, borderRadius: r(12), justifyContent: 'center' }}>
                  <Txt size={15} weight={700} color="#FFFFFF">
                    دعاء ختم القرآن
                  </Txt>
                </Press>
                <Press
                  onPress={() => {
                    completeKhatmah();
                    flash('تم تسجيل الختمة في سجلك المبارك، هنيئاً لك!');
                  }}
                  label="حفظ وإتمام الختمة"
                  style={{ backgroundColor: t.card, borderWidth: 1, borderColor: t.line, paddingHorizontal: 16, height: 44, borderRadius: r(12), justifyContent: 'center' }}>
                  <Txt size={14} weight={600} color={t.ink}>
                    حفظ في السجل
                  </Txt>
                </Press>
              </View>
            </Card>
          ) : null}

          {/* Direct link to Reader */}
          <Press
            onPress={() => router.navigate('/quran')}
            label="متابعة القراءة في المصحف"
            style={{
              backgroundColor: t.soft,
              borderRadius: r(16),
              minHeight: 52,
              paddingHorizontal: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <Txt size={15} weight={700} color={t.primary}>
              فتح المصحف لمتابعة التلاوة
            </Txt>
            <Icon d={ICON.forward} size={18} color={t.primary} sw={2.2} directional />
          </Press>
        </View>
      )}

      {/* Dua of Khatm Al-Quran Card Button */}
      <Press
        onPress={() => setModalDua(true)}
        label="دعاء ختم القرآن الكريم"
        style={{
          backgroundColor: t.goldSoft,
          borderRadius: r(18),
          padding: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}>
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: pc, alignItems: 'center', justifyContent: 'center' }}>
          <Txt font="display" size={20} color="#FFFFFF">
            دعاء
          </Txt>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt size={16} weight={700} color={t.goldInk}>
            دعاء ختم القرآن الكريم
          </Txt>
          <Txt size={13} color={t.goldInk} style={{ opacity: 0.85 }}>
            الأدعية المأثورة الجامعة للخيرات عند ختم كتاب الله
          </Txt>
        </View>
        <Icon d={ICON.forward} size={18} color={t.goldInk} sw={2.2} directional />
      </Press>

      {/* History of Completed Khatmahs */}
      {history.length > 0 && (
        <View style={{ gap: 10 }}>
          <Txt size={17} weight={700}>
            سجل الختمات السابقة ({history.length})
          </Txt>
          {history.map((h, i) => (
            <Card key={h.id || i} variant="app" radius={16} pad={14} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ gap: 2 }}>
                <Txt size={15} weight={700}>
                  {h.title}
                </Txt>
                <Txt size={13} color={t.muted}>
                  أُنجزت في {h.durationDays} يومًا · {h.completedAt}
                </Txt>
              </View>
              <View style={{ backgroundColor: t.goldSoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: r(8) }}>
                <Txt size={13} weight={700} color={t.goldInk}>
                  مكتملة ✓
                </Txt>
              </View>
            </Card>
          ))}
        </View>
      )}

      {/* Modal: New Khatmah */}
      <Modal visible={modalNew} transparent animationType="fade" onRequestClose={() => setModalNew(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,.6)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ width: '100%', maxWidth: 400, backgroundColor: t.card, borderRadius: r(22), padding: 20, gap: 14, borderWidth: 1, borderColor: t.line }}>
            <Txt font="display" size={20} weight={700}>
              إعداد خطة الختمة
            </Txt>
            <View style={{ gap: 4 }}>
              <Txt size={13} color={t.muted}>
                عنوان الختمة:
              </Txt>
              <TextInput
                value={inputTitle}
                onChangeText={setInputTitle}
                style={{ borderWidth: 1, borderColor: t.line, borderRadius: r(12), padding: 10, fontSize: 15, color: t.ink, textAlign: 'right' }}
              />
            </View>

            <View style={{ gap: 6 }}>
              <Txt size={13} color={t.muted}>
                المدة المستهدفة:
              </Txt>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[
                  { label: '30 يومًا (جزء/يوم)', days: 30 },
                  { label: '60 يومًا (نصف جزء)', days: 60 },
                  { label: '15 يومًا (جزآن)', days: 15 },
                ].map((item) => (
                  <Press
                    key={item.days}
                    onPress={() => setInputDays(item.days)}
                    label={item.label}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: r(10),
                      backgroundColor: inputDays === item.days ? pc : t.soft,
                      alignItems: 'center',
                    }}>
                    <Txt size={12} weight={inputDays === item.days ? 700 : 500} color={inputDays === item.days ? '#FFFFFF' : t.ink} align="center">
                      {item.label}
                    </Txt>
                  </Press>
                ))}
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'flex-end', paddingTop: 6 }}>
              <Press onPress={() => setModalNew(false)} label="إلغاء" style={{ paddingVertical: 10, paddingHorizontal: 16, borderRadius: r(10), backgroundColor: t.soft }}>
                <Txt size={14} color={t.muted}>
                  إلغاء
                </Txt>
              </Press>
              <Press onPress={handleStartNew} label="بدء الختمة" style={{ paddingVertical: 10, paddingHorizontal: 20, borderRadius: r(10), backgroundColor: pc }}>
                <Txt size={14} weight={700} color="#FFFFFF">
                  توكلنا على الله
                </Txt>
              </Press>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Set Custom Page */}
      <Modal visible={modalSetPage} transparent animationType="fade" onRequestClose={() => setModalSetPage(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,.6)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ width: '100%', maxWidth: 360, backgroundColor: t.card, borderRadius: r(20), padding: 20, gap: 14, borderWidth: 1, borderColor: t.line }}>
            <Txt font="display" size={20} weight={700}>
              تحديث موضع الصفحة
            </Txt>
            <Txt size={13} color={t.muted}>
              أدخل رقم الصفحة التي وصلت إليها في المصحف (1 - 604):
            </Txt>
            <TextInput
              value={inputPage}
              onChangeText={setInputPage}
              keyboardType="number-pad"
              placeholder={String(curPage)}
              placeholderTextColor={t.muted}
              style={{
                borderWidth: 1,
                borderColor: t.line,
                borderRadius: r(12),
                padding: 12,
                fontSize: 18,
                fontWeight: '700',
                color: t.ink,
                textAlign: 'center',
              }}
            />
            <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'flex-end' }}>
              <Press onPress={() => setModalSetPage(false)} label="إلغاء" style={{ paddingVertical: 10, paddingHorizontal: 16, borderRadius: r(10), backgroundColor: t.soft }}>
                <Txt size={14} color={t.muted}>
                  إلغاء
                </Txt>
              </Press>
              <Press onPress={handleSetCustomPage} label="تحديث" style={{ paddingVertical: 10, paddingHorizontal: 20, borderRadius: r(10), backgroundColor: pc }}>
                <Txt size={14} weight={700} color="#FFFFFF">
                  تحديث
                </Txt>
              </Press>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Dua of Khatm Al-Quran */}
      <Modal visible={modalDua} transparent animationType="slide" onRequestClose={() => setModalDua(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,.65)', justifyContent: 'flex-end' }}>
          <View
            style={{
              maxHeight: '85%',
              backgroundColor: t.card,
              borderTopLeftRadius: r(28),
              borderTopRightRadius: r(28),
              padding: 24,
              gap: 16,
              borderTopWidth: 1,
              borderColor: t.line,
            }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Txt font="display" size={24} weight={700} color={t.primary}>
                دعاء ختم القرآن الكريم
              </Txt>
              <Press onPress={() => setModalDua(false)} label="إغلاق" style={{ padding: 6 }}>
                <Txt size={18} color={t.muted}>
                  ✕
                </Txt>
              </Press>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              <View style={{ backgroundColor: t.bg, borderRadius: r(16), padding: 16, borderWidth: 1, borderColor: t.line }}>
                <Txt font="display" size={18} lh={2.3} color={t.ink}>
                  {KHATM_DUA}
                </Txt>
              </View>
            </ScrollView>

            <Press onPress={() => setModalDua(false)} label="تم" style={{ height: 44, borderRadius: r(12), backgroundColor: pc, alignItems: 'center', justifyContent: 'center' }}>
              <Txt size={15} weight={700} color="#FFFFFF">
                آمين يا رب العالمين
              </Txt>
            </Press>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
