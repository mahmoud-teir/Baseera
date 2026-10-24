/**
 * شاشة تفاصيل البوابة وتثبيت المعرفة — Gate Details & Interactive Arena
 * تعرض الآيات المحكمة، الأحاديث الصحيحة، أقوال السلف، رد الشبهات، واختبار فك القفل
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Button } from '@/components/core/Button';
import { Card } from '@/components/core/Card';
import { Icon } from '@/components/core/Icon';
import { Press } from '@/components/core/Press';
import { Txt } from '@/components/core/Txt';
import { RoundBackHeader, Screen } from '@/components/layout/Screen';
import { ICON } from '@/data/structural';
import { TAWHEED_GATES, type TawheedGate } from '@/data/tawheedGatewaysData';
import { useTawheed } from '@/state/tawheed-store';
import { useTheme } from '@/theme/theme';

type TabType = 'overview' | 'sunnah' | 'shubuhat' | 'quiz';

export default function TawheedGateDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, gc, r, dark } = useTheme();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [isQuizSubmitted, setIsQuizSubmitted] = useState(false);

  const completeGate = useTawheed((s) => s.completeGate);

  const gateIndex = useMemo(() => {
    return TAWHEED_GATES.findIndex((g) => g.id === id);
  }, [id]);

  const gate: TawheedGate | undefined = useMemo(() => {
    return TAWHEED_GATES[gateIndex >= 0 ? gateIndex : 0];
  }, [gateIndex]);

  const nextGate = useMemo(() => {
    if (gateIndex >= 0 && gateIndex < TAWHEED_GATES.length - 1) {
      return TAWHEED_GATES[gateIndex + 1];
    }
    return null;
  }, [gateIndex]);

  // حساب نتيجة الاختبار
  const quizScore = useMemo(() => {
    if (!gate) return 0;
    let correct = 0;
    gate.quiz.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctIndex) {
        correct++;
      }
    });
    return Math.round((correct / gate.quiz.length) * 100);
  }, [gate, selectedAnswers]);

  const allQuestionsAnswered = gate ? gate.quiz.every((q) => selectedAnswers[q.id] !== undefined) : false;

  const handleAnswerSelect = (questionId: string, optionIndex: number) => {
    if (isQuizSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleFinishQuiz = () => {
    if (!gate) return;
    setIsQuizSubmitted(true);
    // إذا حصل على 70% أو أكثر يعتبر مجتازاً
    if (quizScore >= 70) {
      completeGate(gate.id, quizScore, nextGate?.id);
    }
  };

  const handleRetakeQuiz = () => {
    setSelectedAnswers({});
    setIsQuizSubmitted(false);
  };

  if (!gate) {
    return (
      <Screen bg={t.bg}>
        <RoundBackHeader title="بوابات التوحيد" href="/tawheed" />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Txt size={16} color={t.muted}>
            البوابة المطلوبة غير موجودة
          </Txt>
        </View>
      </Screen>
    );
  }

  return (
    <Screen bg={t.bg}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <RoundBackHeader title={`البوابة ${gate.number}: ${gate.title}`} href="/tawheed" size={20} />

      {/* شريط التبويبات العلوي المتجاوب */}
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
        }}>
        {[
          { key: 'overview', label: 'البيان والقرآن', icon: ICON.kaaba },
          { key: 'sunnah', label: 'السنة والآثار', icon: ICON.hadith },
          { key: 'shubuhat', label: 'رد الشبهات', icon: ICON.scales },
          { key: 'quiz', label: 'تثبيت المعرفة', icon: ICON.star8 },
        ].map((tab) => {
          const isSelected = activeTab === tab.key;
          return (
            <Press
              key={tab.key}
              onPress={() => setActiveTab(tab.key as TabType)}
              label={tab.label}
              style={{
                flex: 1,
                minWidth: 84,
                paddingHorizontal: 8,
                paddingVertical: 8,
                borderRadius: r(10),
                backgroundColor: isSelected ? (dark ? 'rgba(197, 155, 39, 0.2)' : t.goldSoft) : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: isSelected ? gc : 'transparent',
              }}>
              <Txt size={12} weight={isSelected ? 700 : 500} color={isSelected ? gc : t.muted}>
                {tab.label}
              </Txt>
            </Press>
          );
        })}
      </ScrollView>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 48,
        }}
        showsVerticalScrollIndicator={false}>
        {/* ── تبويب 1: البيان والقرآن ── */}
        {activeTab === 'overview' && (
          <View style={{ gap: 16 }}>
            {/* بطاقة الخلاصة والأصل */}
            <Card
              pad={16}
              radius={18}
              style={{
                backgroundColor: dark ? '#132821' : '#F4F9F6',
                borderColor: 'rgba(46, 125, 90, 0.4)',
                borderWidth: 1,
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Icon d={ICON.star8} size={18} color={gc} />
                <Txt size={14} weight={700} color={t.ink}>
                  الأصل العقدي المقرر
                </Txt>
              </View>
              <Txt size={14} color={t.ink} lh={1.7}>
                {gate.corePrinciple}
              </Txt>
            </Card>

            <Card pad={16} radius={18} style={{ backgroundColor: t.card, borderColor: t.line, borderWidth: 1 }}>
              <Txt size={15} weight={700} color={gc} style={{ marginBottom: 6 }}>
                البيان والإيضاح
              </Txt>
              <Txt size={14} color={t.ink} lh={1.7}>
                {gate.summary}
              </Txt>
            </Card>

            {/* الآيات القرآنية المحكمة */}
            <View style={{ marginTop: 6, gap: 12 }}>
              <Txt size={16} weight={700} color={t.ink}>
                الآيات القرآنية المحكمة
              </Txt>
              {gate.verses.map((v, i) => (
                <Card key={i} pad={16} radius={16} style={{ backgroundColor: t.card, borderColor: t.line, borderWidth: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                    <Txt size={12} weight={700} color={gc}>
                      سورة {v.surah} · آية {v.ayah}
                    </Txt>
                  </View>
                  <Txt font="quran" size={19} color={t.ink} lh={2.4} style={{ paddingBottom: 12, paddingHorizontal: 4 }}>
                    {v.text}
                  </Txt>
                  <View
                    style={{
                      marginTop: 6,
                      padding: 12,
                      borderRadius: r(12),
                      backgroundColor: dark ? '#15241E' : '#F2F8F5',
                      borderWidth: 1,
                      borderColor: dark ? 'rgba(46, 125, 90, 0.3)' : 'rgba(46, 125, 90, 0.18)',
                    }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <Icon d={ICON.tafsir} size={14} color={gc} />
                      <Txt size={12} weight={700} color={gc}>
                        التفسير والبيان السلفي:
                      </Txt>
                    </View>
                    <Txt size={13} color={t.ink} lh={1.6}>
                      {v.tafsirSnippet}
                    </Txt>
                  </View>
                </Card>
              ))}
            </View>

            <Button
              size="lg"
              onPress={() => setActiveTab('sunnah')}
              style={{ marginTop: 10, backgroundColor: gc }}>
              <Txt size={16} weight={700} color="#182D29">
                الانتقال إلى صحيح السنة والآثار ←
              </Txt>
            </Button>
          </View>
        )}

        {/* ── تبويب 2: السنة والآثار ── */}
        {activeTab === 'sunnah' && (
          <View style={{ gap: 16 }}>
            {/* الأحاديث النبوية */}
            <View style={{ gap: 12 }}>
              <Txt size={16} weight={700} color={t.ink}>
                صحيح السنة النبوية
              </Txt>
              {gate.hadiths.map((h, i) => (
                <Card key={i} pad={16} radius={16} style={{ backgroundColor: t.card, borderColor: t.line, borderWidth: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                    <Txt size={13} weight={700} color={gc} style={{ flexShrink: 1 }}>
                      {h.narrator}
                    </Txt>
                    <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: dark ? '#18241F' : t.goldSoft }}>
                      <Txt size={11} weight={600} color={gc} style={{ flexShrink: 0 }}>
                        {h.source}
                      </Txt>
                    </View>
                  </View>
                  <Txt size={15} weight={600} color={t.ink} lh={1.8} style={{ marginBottom: 10, paddingHorizontal: 4 }}>
                    «{h.text}»
                  </Txt>
                  <View
                    style={{
                      marginTop: 6,
                      padding: 12,
                      borderRadius: r(12),
                      backgroundColor: dark ? '#18241F' : '#F6FAF8',
                      borderWidth: 1,
                      borderColor: t.line,
                    }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Icon d={ICON.hadith} size={13} color={gc} />
                      <Txt size={12} weight={700} color={gc}>
                        الفقه والتوجيه العقدي:
                      </Txt>
                    </View>
                    <Txt size={13} color={t.muted} lh={1.6}>
                      {h.explanation}
                    </Txt>
                  </View>
                </Card>
              ))}
            </View>

            {/* أقوال سلف الأمة وأئمة الهدى */}
            <View style={{ marginTop: 6, gap: 12 }}>
              <Txt size={16} weight={700} color={t.ink}>
                نقولات أئمة السلف والتحقيق
              </Txt>
              {gate.scholarlyQuotes.map((q, i) => (
                <Card key={i} pad={16} radius={16} style={{ backgroundColor: t.card, borderColor: t.line, borderWidth: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                    <Txt size={14} weight={700} color={gc} style={{ flexShrink: 1 }}>
                      {q.scholar}
                    </Txt>
                    {q.era && (
                      <Txt size={11} color={t.muted} style={{ flexShrink: 0 }}>
                        {q.era}
                      </Txt>
                    )}
                  </View>
                  <Txt size={12} color={t.muted} style={{ marginBottom: 10 }}>
                    المصدر: {q.book}
                  </Txt>
                  <Txt size={14} color={t.ink} lh={1.8} style={{ fontStyle: 'italic', marginBottom: 12, paddingHorizontal: 4 }}>
                    {q.quote}
                  </Txt>
                  <View
                    style={{
                      marginTop: 4,
                      padding: 10,
                      borderRadius: r(10),
                      backgroundColor: dark ? '#18241F' : '#F6FAF8',
                      borderWidth: 1,
                      borderColor: t.line,
                    }}>
                    <Txt size={12} color={t.muted} lh={1.5}>
                      <Txt size={12} weight={700} color={gc}>السياق والتحقيق: </Txt>
                      {q.context}
                    </Txt>
                  </View>
                </Card>
              ))}
            </View>

            <Button
              size="lg"
              onPress={() => setActiveTab('shubuhat')}
              style={{ marginTop: 10, backgroundColor: gc }}>
              <Txt size={16} weight={700} color="#182D29">
                الانتقال إلى رد الشبهات ←
              </Txt>
            </Button>
          </View>
        )}

        {/* ── تبويب 3: رد الشبهات ── */}
        {activeTab === 'shubuhat' && (
          <View style={{ gap: 16 }}>
            <Txt size={16} weight={700} color={t.ink}>
              دحض الشبهات العصرية بالبراهين
            </Txt>
            {gate.shubuhat.map((s, i) => (
              <Card key={i} pad={16} radius={18} style={{ gap: 10, backgroundColor: t.card, borderColor: t.line, borderWidth: 1 }}>
                {/* الشبهة */}
                <View
                  style={{
                    backgroundColor: dark ? '#2A1818' : '#FDF0ED',
                    padding: 12,
                    borderRadius: r(12),
                    borderWidth: 1,
                    borderColor: 'rgba(217, 83, 79, 0.3)',
                  }}>
                  <Txt size={12} weight={700} color="#D9534F" style={{ marginBottom: 4 }}>
                    الشبهة المطروحة:
                  </Txt>
                  <Txt size={13} color={dark ? '#FFB8B5' : '#8A201C'} lh={1.6}>
                    {s.shubha}
                  </Txt>
                </View>

                {/* الرد والتحرير */}
                <View
                  style={{
                    backgroundColor: dark ? '#132821' : '#F2F8F5',
                    padding: 12,
                    borderRadius: r(12),
                    borderWidth: 1,
                    borderColor: 'rgba(46, 125, 90, 0.3)',
                  }}>
                  <Txt size={12} weight={700} color={t.primary} style={{ marginBottom: 4 }}>
                    البيان والتحرير الموثق:
                  </Txt>
                  <Txt size={13} color={t.ink} lh={1.6}>
                    {s.clarification}
                  </Txt>
                </View>

                {/* الدليل المعتمد */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <Icon d={ICON.star8} size={14} color={gc} />
                  <Txt size={12} weight={600} color={gc}>
                    الدليل: {s.evidence}
                  </Txt>
                </View>
              </Card>
            ))}

            <Button
              size="lg"
              onPress={() => setActiveTab('quiz')}
              style={{ marginTop: 10, backgroundColor: gc }}>
              <Txt size={16} weight={700} color="#182D29">
                دخول تثبيت المعرفة وفك القفل ←
              </Txt>
            </Button>
          </View>
        )}

        {/* ── تبويب 4: تثبيت المعرفة والاختبار ── */}
        {activeTab === 'quiz' && (
          <View style={{ gap: 18 }}>
            <Card
              pad={16}
              radius={18}
              style={{
                backgroundColor: dark ? '#18241F' : '#F6FAF8',
                borderColor: gc,
                borderWidth: 1,
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Icon d={ICON.star8} size={20} color={gc} />
                <Txt size={16} weight={700} color={t.ink}>
                  تثبيت المعرفة وبراهين النجاة
                </Txt>
              </View>
              <Txt size={13} color={t.muted} lh={1.5}>
                أجب عن أسئلة البوابة ({gate.quiz.length} أسئلة محكمة) لتأكيد إتقانك لأصول المنهج الحق وفك قفل البوابة التالية (نسبة الاجتياز ٧٠٪ أو أكثر).
              </Txt>
            </Card>

            {/* قائمة الأسئلة */}
            {gate.quiz.map((q, qIndex) => {
              const selectedOpt = selectedAnswers[q.id];
              const isCorrect = selectedOpt === q.correctIndex;

              return (
                <Card key={q.id} pad={16} radius={18} style={{ backgroundColor: t.card, borderColor: t.line, borderWidth: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12, width: '100%' }}>
                    <View
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 8,
                        backgroundColor: t.goldSoft,
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                      <Txt size={12} weight={700} color={gc}>
                        سؤال {qIndex + 1} / {gate.quiz.length}
                      </Txt>
                    </View>
                    <Txt size={15} weight={700} color={t.ink} style={{ flex: 1, minWidth: 0, flexShrink: 1 }} lh={1.5}>
                      {q.question}
                    </Txt>
                  </View>

                  {/* الخيارات */}
                  <View style={{ gap: 8 }}>
                    {q.options.map((opt, optIndex) => {
                      const isChosen = selectedOpt === optIndex;
                      let optBg = dark ? '#222B27' : '#F8F9FA';
                      let optBorder = t.line;
                      let optColor = t.ink;

                      if (isQuizSubmitted) {
                        if (optIndex === q.correctIndex) {
                          optBg = dark ? '#132821' : '#E8F5E9';
                          optBorder = t.primary;
                          optColor = t.primary;
                        } else if (isChosen && !isCorrect) {
                          optBg = dark ? '#2A1818' : '#FFEBEE';
                          optBorder = '#D9534F';
                          optColor = '#D9534F';
                        }
                      } else if (isChosen) {
                        optBg = dark ? 'rgba(197, 155, 39, 0.2)' : t.goldSoft;
                        optBorder = gc;
                        optColor = gc;
                      }

                      return (
                        <Press
                          key={optIndex}
                          onPress={() => handleAnswerSelect(q.id, optIndex)}
                          disabled={isQuizSubmitted}
                          label={opt}
                          style={{
                            padding: 12,
                            borderRadius: r(12),
                            backgroundColor: optBg,
                            borderWidth: 1,
                            borderColor: optBorder,
                          }}>
                          <Txt size={14} weight={isChosen ? 700 : 500} color={optColor} lh={1.4}>
                            {opt}
                          </Txt>
                        </Press>
                      );
                    })}
                  </View>

                  {/* التوضيح عند الإرسال */}
                  {isQuizSubmitted && (
                    <View
                      style={{
                        marginTop: 12,
                        padding: 10,
                        borderRadius: r(10),
                        backgroundColor: isCorrect
                          ? dark
                            ? '#132821'
                            : '#E8F5E9'
                          : dark
                            ? '#2A1818'
                            : '#FFEBEE',
                        borderWidth: 1,
                        borderColor: isCorrect ? t.primary : '#D9534F',
                      }}>
                      <Txt size={12} weight={700} color={isCorrect ? t.primary : '#D9534F'} style={{ marginBottom: 2 }}>
                        {isCorrect ? 'إجابة صحيحة ✓' : 'إجابة غير دقيقة ✗'}
                      </Txt>
                      <Txt size={12} color={t.ink} lh={1.5}>
                        {q.explanation}
                      </Txt>
                    </View>
                  )}
                </Card>
              );
            })}

            {/* أزرار الإرسال والنتيجة */}
            {!isQuizSubmitted ? (
              <Button
                size="xl"
                disabled={!allQuestionsAnswered}
                onPress={handleFinishQuiz}
                style={{ marginTop: 8, backgroundColor: allQuestionsAnswered ? gc : t.line }}>
                <Txt size={17} weight={700} color={allQuestionsAnswered ? '#182D29' : t.muted}>
                  {allQuestionsAnswered ? 'اعتماد الإجابات وتقييم الإتقان' : 'يرجى الإجابة عن جميع الأسئلة'}
                </Txt>
              </Button>
            ) : (
              <View style={{ gap: 12, marginTop: 8 }}>
                <Card
                  pad={16}
                  radius={16}
                  style={{
                    alignItems: 'center',
                    backgroundColor: quizScore >= 70 ? (dark ? '#132821' : '#E8F5E9') : dark ? '#2A1818' : '#FFEBEE',
                    borderColor: quizScore >= 70 ? t.primary : '#D9534F',
                    borderWidth: 1,
                  }}>
                  <Txt size={20} weight={700} color={quizScore >= 70 ? t.primary : '#D9534F'}>
                    النتيجة: {quizScore}% ({gate.quiz.filter((q) => selectedAnswers[q.id] === q.correctIndex).length} من {gate.quiz.length})
                  </Txt>
                  <Txt size={14} color={t.ink} align="center" style={{ marginTop: 4 }}>
                    {quizScore >= 70
                      ? 'مبارك! أتقنت براهين هذه البوابة وفُك قفل البوابة التالية بنجاح.'
                      : 'لم تجتز النسبة المطلوبة (٧٠٪). يمكنك مراجعة الأدلة والآثار وإعادة المحاولة.'}
                  </Txt>
                </Card>

                {quizScore >= 70 && nextGate && (
                  <Button
                    size="xl"
                    onPress={() => {
                      router.replace(`/tawheed/${nextGate.id}` as any);
                    }}
                    style={{ backgroundColor: gc }}>
                    <Txt size={16} weight={700} color="#182D29">
                      الانتقال للبوابة التالية ({nextGate.number}: {nextGate.title}) ←
                    </Txt>
                  </Button>
                )}

                {quizScore >= 70 && !nextGate && (
                  <Button
                    size="xl"
                    onPress={() => {
                      router.replace('/tawheed' as any);
                    }}
                    style={{ backgroundColor: gc }}>
                    <Txt size={16} weight={700} color="#182D29">
                      عرض وسام التوحيد المكتمل وخريطة البوابات 🏆
                    </Txt>
                  </Button>
                )}

                {quizScore < 70 && (
                  <Button size="lg" tone="ivory" onPress={handleRetakeQuiz}>
                    إعادة محاولة الاختبار
                  </Button>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
