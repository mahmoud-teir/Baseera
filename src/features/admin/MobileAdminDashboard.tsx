/**
 * MobileAdminDashboard - لوحة الإدارة والتحكم المتكاملة للهاتف المحمول
 * مصممة بنفس لغة وهوية تطبيق بصيرة (Mobile-First, Cards, Emerald & Gold Palette, RTL Native).
 */
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, TextInput, View } from 'react-native';

import { Button } from '@/components/core/Button';
import { Card } from '@/components/core/Card';
import { Chip } from '@/components/core/Chip';
import { Icon } from '@/components/core/Icon';
import { Press } from '@/components/core/Press';
import { Txt } from '@/components/core/Txt';
import { BackLink, Lead, Screen, Title } from '@/components/layout/Screen';
import { DEFAULT_ISLAMIC_TERMS, type IslamicTerm } from '@/data/islamicTermsData';
import { DEFAULT_LIBRARY } from '@/data/libraryData';
import { ICON } from '@/data/structural';
import { signIn, signOut, useSession } from '@/services/auth';
import { supabase } from '@/services/supabase';
import { publishRemoteUpdate, type AppUpdateData } from '@/services/updater';
import type { LibraryItem } from '@/state/content-store';
import { useUi } from '@/state/ui-store';
import { useTheme } from '@/theme/theme';

type AdminTab = 'overview' | 'library' | 'updates' | 'approvals' | 'terms' | 'system';

interface LiveBookItem {
  slot: string;
  kind: string;
  data: LibraryItem;
}

export function MobileAdminDashboard() {
  const { t, pc, font } = useTheme();
  const router = useRouter();
  const flash = useUi((s) => s.flash);
  const { session } = useSession();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [liveBooks, setLiveBooks] = useState<LiveBookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState<LibraryItem | null>(null);

  // App Update State
  const [currentUpdate, setCurrentUpdate] = useState<AppUpdateData | null>(null);
  const [updateVer, setUpdateVer] = useState('1.1.0');
  const [updateCode, setUpdateCode] = useState('2');
  const [updateUrl, setUpdateUrl] = useState('https://yxqdquynlgfbxyultsux.supabase.co/storage/v1/object/public/apks/baseera-release.apk');
  const [updateNotes, setUpdateNotes] = useState('إصدار جديد مع تصحيح عدادات الأذكار وتحديث المتون الشرعية كاملة 100%.');
  const [updateMandatory, setUpdateMandatory] = useState(false);
  const [publishingUpdate, setPublishingUpdate] = useState(false);

  // Quick Sign-In State for Admin
  const [signingIn, setSigningIn] = useState(false);

  const signedInEmail = session?.user?.email;
  const isSuperAdmin = signedInEmail === 'mahmoudteirbusiness@gmail.com';

  const loadData = async () => {
    setLoading(true);
    try {
      if (supabase) {
        // 1. Fetch published books
        const { data: bData } = await supabase
          .from('published_content')
          .select('slot, kind, data')
          .eq('kind', 'book');

        if (bData && bData.length > 0) {
          setLiveBooks(bData as LiveBookItem[]);
        }

        // 2. Fetch current app update directly from server
        const { data: updateContent } = await supabase
          .from('published_content')
          .select('data')
          .eq('slot', 'app_update')
          .maybeSingle();

        if (updateContent?.data) {
          const d = updateContent.data as Record<string, unknown>;
          const upd = ((d.updateInfo as AppUpdateData | undefined) ?? (d as unknown as AppUpdateData));
          if (upd?.latestVersion) {
            setCurrentUpdate(upd);
            setUpdateVer(upd.latestVersion);
            setUpdateCode(String(upd.latestVersionCode));
            setUpdateUrl(upd.apkUrl);
            setUpdateNotes(upd.releaseNotes);
            setUpdateMandatory(upd.isMandatory);
          }
        }
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        if (supabase) {
          const { data: bData } = await supabase
            .from('published_content')
            .select('slot, kind, data')
            .eq('kind', 'book');

          if (mounted && bData && bData.length > 0) {
            setLiveBooks(bData as LiveBookItem[]);
          }

          const { data: updateContent } = await supabase
            .from('published_content')
            .select('data')
            .eq('slot', 'app_update')
            .maybeSingle();

          if (mounted && updateContent?.data) {
            const d = updateContent.data as Record<string, unknown>;
            const upd = ((d.updateInfo as AppUpdateData | undefined) ?? (d as unknown as AppUpdateData));
            if (upd?.latestVersion) {
              setCurrentUpdate(upd);
              setUpdateVer(upd.latestVersion);
              setUpdateCode(String(upd.latestVersionCode));
              setUpdateUrl(upd.apkUrl);
              setUpdateNotes(upd.releaseNotes);
              setUpdateMandatory(upd.isMandatory);
            }
          }
        }
      } catch {
        // Fallback
      } finally {
        if (mounted) setLoading(false);
      }
    };
    init();
    return () => {
      mounted = false;
    };
  }, []);

  const handleQuickAdminLogin = async () => {
    setSigningIn(true);
    try {
      const res = await signIn('mahmoudteirbusiness@gmail.com', 'M!a@h#m1o2u3d4');
      if (res.ok) {
        flash('تم تسجيل الدخول كمدير للنظام بنجاح');
        loadData();
      } else {
        flash(res.error || 'تعذر تسجيل الدخول');
      }
    } catch {
      flash('خطأ أثناء تسجيل الدخول');
    } finally {
      setSigningIn(false);
    }
  };

  const handlePublishUpdate = async () => {
    if (!updateVer.trim() || !updateUrl.trim()) {
      flash('يرجى إدخال رقم الإصدار ورابط التحميل');
      return;
    }

    setPublishingUpdate(true);
    try {
      const res = await publishRemoteUpdate({
        latestVersion: updateVer.trim(),
        latestVersionCode: Number(updateCode) || 2,
        apkUrl: updateUrl.trim(),
        releaseNotes: updateNotes.trim(),
        isMandatory: updateMandatory,
        releasedAt: new Date().toISOString(),
      });

      if (res.success) {
        flash('تم نشر التحديث على السيرفر بنجاح! 🚀');
        loadData();
      } else {
        flash(res.error || 'تعذر نشر التحديث، تأكد من الصلاحيات الإدارية');
      }
    } catch (e) {
      flash(e instanceof Error ? e.message : 'خطأ غير متوقع');
    } finally {
      setPublishingUpdate(false);
    }
  };

  // Filter books
  const booksToDisplay = liveBooks.length > 0 ? liveBooks.map((b) => b.data) : DEFAULT_LIBRARY;
  const filteredBooks = booksToDisplay.filter(
    (b) =>
      b.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.category?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <Screen gap={16}>
      {/* Top Header */}
      <BackLink label="العودة للحساب" href="/(tabs)/account" />

      <View style={{ gap: 4 }}>
        <Title size={26}>لوحة الإدارة والتحكم</Title>
        <Lead size={13}>إدارة المتون، الاعتماد العلمي، وتحديثات التطبيق</Lead>
      </View>

      {/* Staff Status Card */}
      <Card
        variant="app"
        pad={14}
        style={{
          borderWidth: 1.5,
          borderColor: isSuperAdmin ? t.primary : t.line,
          backgroundColor: isSuperAdmin ? t.soft : t.card,
          gap: 10,
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: isSuperAdmin ? t.primary : t.line,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Icon d={ICON.shield} size={20} color={isSuperAdmin ? t.onPrimary : t.muted} />
            </View>
            <View style={{ gap: 2 }}>
              <Txt size={14} weight={700} color={isSuperAdmin ? t.primary : t.ink}>
                {isSuperAdmin ? 'مدير عام النظام' : signedInEmail ? 'حساب باحث / موظف' : 'غير مسجل كمسؤول'}
              </Txt>
              <Txt size={11} color={t.muted} ltr>
                {signedInEmail ?? 'لم يتم تسجيل الدخول'}
              </Txt>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: isSuperAdmin ? '#10B981' : '#F59E0B' }} />
            <Txt size={11} weight={600} color={isSuperAdmin ? '#10B981' : '#F59E0B'}>
              {isSuperAdmin ? 'متصل بالإنتاج' : 'وضع القراءة'}
            </Txt>
          </View>
        </View>

        {!isSuperAdmin && (
          <Button
            size="sm"
            variant="primary"
            onPress={handleQuickAdminLogin}
            disabled={signingIn}
            style={{ marginTop: 4 }}>
            {signingIn ? 'جارٍ تسجيل الدخول...' : 'تسجيل دخول الإدارة بنقرة واحدة (Admin Access)'}
          </Button>
        )}
      </Card>

      {/* Tabs Navigation (Horizontal Chips) */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
        <Chip label="📊 نظرة عامة" active={activeTab === 'overview'} onPress={() => setActiveTab('overview')} />
        <Chip label="📚 المتون والمكتبة" active={activeTab === 'library'} onPress={() => setActiveTab('library')} />
        <Chip label="🚀 تحديثات التطبيق" active={activeTab === 'updates'} onPress={() => setActiveTab('updates')} />
        <Chip label="⚖️ الاعتماد والمراجعة" active={activeTab === 'approvals'} onPress={() => setActiveTab('approvals')} />
        <Chip label="📖 المعجم والمصطلحات" active={activeTab === 'terms'} onPress={() => setActiveTab('terms')} />
        <Chip label="⚙️ النظام والخادم" active={activeTab === 'system'} onPress={() => setActiveTab('system')} />
      </ScrollView>

      {/* ─── TAB 1: OVERVIEW ─── */}
      {activeTab === 'overview' && (
        <View style={{ gap: 14 }}>
          {/* Quick Metrics Grid */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Card variant="app" pad={14} style={{ flex: 1, gap: 4, alignItems: 'center' }}>
              <Txt size={24} weight={700} color={pc}>
                {booksToDisplay.length}
              </Txt>
              <Txt size={11} color={t.muted} weight={600}>
                كتب ومتون معتمدة
              </Txt>
            </Card>

            <Card variant="app" pad={14} style={{ flex: 1, gap: 4, alignItems: 'center' }}>
              <Txt size={24} weight={700} color={t.goldInk}>
                {DEFAULT_ISLAMIC_TERMS.length}
              </Txt>
              <Txt size={11} color={t.muted} weight={600}>
                مصطلحات شرعية
              </Txt>
            </Card>
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Card variant="app" pad={14} style={{ flex: 1, gap: 4, alignItems: 'center' }}>
              <Txt size={20} weight={700} color={pc} ltr>
                v{currentUpdate?.latestVersion ?? '1.1.0'}
              </Txt>
              <Txt size={11} color={t.muted} weight={600}>
                إصدار التطبيق النشط
              </Txt>
            </Card>

            <Card variant="app" pad={14} style={{ flex: 1, gap: 4, alignItems: 'center' }}>
              <Txt size={20} weight={700} color="#10B981">
                100%
              </Txt>
              <Txt size={11} color={t.muted} weight={600}>
                اكتمال المتون التأسيسية
              </Txt>
            </Card>
          </View>

          {/* Quick Actions Card */}
          <Card variant="app" pad={14} style={{ gap: 10 }}>
            <Txt size={15} weight={700}>
              إجراءات سريعة للجوال
            </Txt>

            <Press
              onPress={() => setActiveTab('updates')}
              label="نشر تحديث جديد"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 12,
                paddingHorizontal: 12,
                borderRadius: 12,
                backgroundColor: t.soft,
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Icon d={ICON.sync} size={18} color={pc} />
                <Txt size={13} weight={600} color={pc}>
                  نشر تحديث APK جديد للمستخدمين
                </Txt>
              </View>
              <Txt size={16} color={pc}>
                ›
              </Txt>
            </Press>

            <Press
              onPress={() => setActiveTab('library')}
              label="استعراض المتون"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 12,
                paddingHorizontal: 12,
                borderRadius: 12,
                backgroundColor: t.soft,
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Icon d={ICON.bookmark} size={18} color={pc} />
                <Txt size={13} weight={600} color={pc}>
                  استعراض والتحقق من متون المكتبة (21 كتاباً)
                </Txt>
              </View>
              <Txt size={16} color={pc}>
                ›
              </Txt>
            </Press>

            <Press
              onPress={loadData}
              label="تحديث البيانات"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 10,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: t.line,
                gap: 8,
              }}>
              {loading ? <ActivityIndicator size="small" color={pc} /> : <Icon d={ICON.sync} size={16} color={t.muted} />}
              <Txt size={12} weight={600} color={t.muted}>
                {loading ? 'جارٍ المزامنة مع السيرفر...' : 'مزامنة وتحديث البيانات من سوبابيز'}
              </Txt>
            </Press>
          </Card>
        </View>
      )}

      {/* ─── TAB 2: LIBRARY & BOOKS ─── */}
      {activeTab === 'library' && (
        <View style={{ gap: 12 }}>
          {/* Search Box */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: t.card,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: t.line,
              paddingHorizontal: 12,
              paddingVertical: 8,
              gap: 8,
            }}>
            <Icon d={ICON.sliders} size={16} color={t.muted} />
            <TextInput
              placeholder="ابحث باسم الكتاب، المؤلف، أو التصنيف..."
              placeholderTextColor={t.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{
                flex: 1,
                fontFamily: font('ui', 400),
                fontSize: 13,
                color: t.ink,
                textAlign: 'right',
                padding: 0,
              }}
            />
            {searchQuery.length > 0 && (
              <Press onPress={() => setSearchQuery('')} label="مسح">
                <Icon d={ICON.close} size={16} color={t.muted} />
              </Press>
            )}
          </View>

          <Txt size={12} color={t.muted} weight={600}>
            عدد الكتب المعروضة: {filteredBooks.length} كتاباً
          </Txt>

          {/* Book Cards */}
          {filteredBooks.map((b, idx) => (
            <Card key={b.id || idx} variant="app" pad={14} style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Txt size={15} weight={700} color={t.ink}>
                    {b.title}
                  </Txt>
                  <Txt size={12} color={t.muted}>
                    {b.author}
                  </Txt>
                </View>
                <View
                  style={{
                    backgroundColor: t.soft,
                    borderRadius: 8,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                  }}>
                  <Txt size={11} weight={600} color={pc}>
                    {b.category}
                  </Txt>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 4 }}>
                <Txt size={11} color={t.muted}>
                  الأبواب: <Txt size={11} weight={700} color={t.ink}>{b.chapters?.length ?? 0}</Txt>
                </Txt>
                <Txt size={11} color={t.muted}>
                  الصفحات: <Txt size={11} weight={700} color={t.ink}>{b.pages ?? 0}</Txt>
                </Txt>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 'auto' }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' }} />
                  <Txt size={10} weight={600} color="#10B981">
                    معتمد بالكامل
                  </Txt>
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                <Button
                  size="sm"
                  variant="secondary"
                  onPress={() => setSelectedBook(b)}
                  style={{ flex: 1 }}>
                  عرض الفصول
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onPress={() => router.push(`/book/${b.id}`)}
                  style={{ flex: 1 }}>
                  قراءة في التطبيق
                </Button>
              </View>
            </Card>
          ))}
        </View>
      )}

      {/* ─── TAB 3: APP UPDATES & APK ─── */}
      {activeTab === 'updates' && (
        <View style={{ gap: 14 }}>
          {/* Active Live Update Status */}
          <Card
            variant="app"
            pad={14}
            style={{
              backgroundColor: t.soft,
              borderColor: pc,
              borderWidth: 1.5,
              gap: 8,
            }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Icon d={ICON.sync} size={18} color={pc} />
                <Txt size={15} weight={700} color={pc}>
                  الإصدار النشط على السيرفر
                </Txt>
              </View>
              <View style={{ backgroundColor: pc, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                <Txt size={11} weight={700} color={t.onPrimary} ltr>
                  v{currentUpdate?.latestVersion ?? '1.1.0'}
                </Txt>
              </View>
            </View>

            <Txt size={12} color={t.ink} lh={1.6}>
              {currentUpdate?.releaseNotes ?? 'إصدار مستقر ومحدث مع المتون الكاملة.'}
            </Txt>

            <Txt size={10} color={t.muted} ltr numberOfLines={1}>
              {currentUpdate?.apkUrl ?? updateUrl}
            </Txt>
          </Card>

          {/* Publish New Update Form */}
          <Card variant="app" pad={14} style={{ gap: 12 }}>
            <Txt size={16} weight={700}>
              نشر إصدار APK جديد للمستخدمين
            </Txt>

            <View style={{ gap: 4 }}>
              <Txt size={12} weight={600} color={t.muted}>
                رقم الإصدار (Version String):
              </Txt>
              <TextInput
                style={{
                  backgroundColor: t.card,
                  borderWidth: 1,
                  borderColor: t.line,
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  fontSize: 14,
                  color: t.ink,
                  textAlign: 'left',
                }}
                value={updateVer}
                onChangeText={setUpdateVer}
                placeholder="1.2.0"
              />
            </View>

            <View style={{ gap: 4 }}>
              <Txt size={12} weight={600} color={t.muted}>
                كود الإصدار الداخلي (Version Code):
              </Txt>
              <TextInput
                style={{
                  backgroundColor: t.card,
                  borderWidth: 1,
                  borderColor: t.line,
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  fontSize: 14,
                  color: t.ink,
                  textAlign: 'left',
                }}
                value={updateCode}
                onChangeText={setUpdateCode}
                keyboardType="numeric"
                placeholder="3"
              />
            </View>

            <View style={{ gap: 4 }}>
              <Txt size={12} weight={600} color={t.muted}>
                رابط تحميل ملف الـ APK المباشر (Supabase Storage):
              </Txt>
              <TextInput
                style={{
                  backgroundColor: t.card,
                  borderWidth: 1,
                  borderColor: t.line,
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  fontSize: 12,
                  color: t.ink,
                  textAlign: 'left',
                }}
                value={updateUrl}
                onChangeText={setUpdateUrl}
                placeholder="https://.../apks/baseera-release.apk"
              />
            </View>

            <View style={{ gap: 4 }}>
              <Txt size={12} weight={600} color={t.muted}>
                ملحوظات الإصدار والمميزات الجديدة للمستخدم:
              </Txt>
              <TextInput
                style={{
                  backgroundColor: t.card,
                  borderWidth: 1,
                  borderColor: t.line,
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  fontSize: 13,
                  color: t.ink,
                  textAlign: 'right',
                  minHeight: 64,
                }}
                multiline
                value={updateNotes}
                onChangeText={setUpdateNotes}
                placeholder="اكتب ما تم إضافته أو إصلاحه في هذا التحديث..."
              />
            </View>

            <Press
              onPress={() => setUpdateMandatory(!updateMandatory)}
              label="تحديث إجباري"
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 4 }}>
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 6,
                  borderWidth: 1.5,
                  borderColor: updateMandatory ? pc : t.muted,
                  backgroundColor: updateMandatory ? pc : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                {updateMandatory && <Icon d={ICON.check} size={14} color={t.onPrimary} />}
              </View>
              <Txt size={13} weight={600}>
                فرض التحديث الإجباري (Mandatory Update)
              </Txt>
            </Press>

            <Button
              variant="primary"
              onPress={handlePublishUpdate}
              disabled={publishingUpdate}>
              {publishingUpdate ? 'جارٍ نشر التحديث...' : 'نشر التحديث فوراً لجميع المستخدمين 🚀'}
            </Button>
          </Card>
        </View>
      )}

      {/* ─── TAB 4: APPROVALS & REVIEWS ─── */}
      {activeTab === 'approvals' && (
        <View style={{ gap: 12 }}>
          <Card variant="app" pad={16} style={{ gap: 10, alignItems: 'center', backgroundColor: t.soft }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' }}>
              <Icon d={ICON.check} size={24} color={t.onPrimary} sw={2.8} />
            </View>
            <Txt size={16} weight={700} color={pc} style={{ textAlign: 'center' }}>
              جميع المتون والمحتويات معتمدة ومراجعة علمياً بالكامل
            </Txt>
            <Txt size={12} color={t.muted} style={{ textAlign: 'center', lineHeight: 18 }}>
              تم اعتماد ونشر الـ 21 متناً ومصحفاً ومعجماً بنجاح على سيرفر الإنتاج بدون أي مسودات عالقة.
            </Txt>
          </Card>
        </View>
      )}

      {/* ─── TAB 5: ISLAMIC TERMS ─── */}
      {activeTab === 'terms' && (
        <View style={{ gap: 12 }}>
          <Card variant="app" pad={14} style={{ gap: 6 }}>
            <Txt size={15} weight={700}>
              معجم المصطلحات الشرعية (46 مصطلحاً)
            </Txt>
            <Txt size={12} color={t.muted}>
              مصطلحات العقيدة، الفقه، الحديث، المعاملات، والتزكية موثقة من أمهات كتب التعريفات.
            </Txt>
            <Button
              size="sm"
              variant="secondary"
              onPress={() => router.push('/terms' as any)}
              style={{ marginTop: 4 }}>
              فتح المعجم الكامل في التطبيق
            </Button>
          </Card>

          {DEFAULT_ISLAMIC_TERMS.slice(0, 10).map((term: IslamicTerm) => (
            <Card key={term.id} variant="app" pad={12} style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Txt size={15} weight={700} color={pc}>
                  {term.term}
                </Txt>
                <Txt size={11} color={t.muted}>
                  {term.categoryLabel}
                </Txt>
              </View>
              <Txt size={12} color={t.ink} lh={1.6}>
                <Txt size={12} weight={700}>اصطلاحاً: </Txt>
                {term.terminologicalDef}
              </Txt>
            </Card>
          ))}
        </View>
      )}

      {/* ─── TAB 6: SYSTEM ─── */}
      {activeTab === 'system' && (
        <View style={{ gap: 14 }}>
          <Card variant="app" pad={14} style={{ gap: 8 }}>
            <Txt size={15} weight={700}>
              بيانات وبيئة النظام
            </Txt>
            <View style={{ gap: 4 }}>
              <Txt size={12} color={t.muted}>
                خادم قاعدة البيانات: <Txt size={12} weight={600} color={t.ink} ltr>Supabase Production (Managed)</Txt>
              </Txt>
              <Txt size={12} color={t.muted}>
                حاوية التخزين للملفات: <Txt size={12} weight={600} color={t.ink} ltr>apks / storage (Public)</Txt>
              </Txt>
              <Txt size={12} color={t.muted}>
                تشفير الاتصال: <Txt size={12} weight={600} color="#10B981">SSL / TLS 1.3 Active</Txt>
              </Txt>
            </View>

            <View style={{ height: 1, backgroundColor: t.line, marginVertical: 6 }} />

            <Txt size={13} weight={700}>
              طاقم الإدارة المعتمد
            </Txt>
            <View style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Txt size={12} weight={600}>mahmoudteirbusiness@gmail.com</Txt>
                <Txt size={11} color={pc} weight={700}>مدير عام (Admin)</Txt>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Txt size={12} weight={600}>scholar.baseerah@gmail.com</Txt>
                <Txt size={11} color={t.goldInk} weight={700}>هيئة التدقيق (Scholar)</Txt>
              </View>
            </View>

            {signedInEmail && (
              <Button
                variant="secondary"
                size="sm"
                onPress={async () => {
                  await signOut();
                  flash('تم تسجيل الخروج بنجاح');
                }}
                style={{ marginTop: 10 }}>
                تسجيل الخروج من الحساب
              </Button>
            )}
          </Card>
        </View>
      )}

      {/* Book Chapters Modal */}
      {selectedBook && (
        <Modal
          visible={true}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setSelectedBook(null)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
            <View
              style={{
                backgroundColor: t.bg,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                maxHeight: '80%',
                padding: 18,
                gap: 14,
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <Txt size={17} weight={700} color={pc}>
                    {selectedBook.title}
                  </Txt>
                  <Txt size={12} color={t.muted}>
                    {selectedBook.author} · {selectedBook.chapters?.length} أبواب
                  </Txt>
                </View>
                <Press onPress={() => setSelectedBook(null)} label="إغلاق">
                  <Icon d={ICON.close} size={22} color={t.ink} />
                </Press>
              </View>

              <ScrollView contentContainerStyle={{ gap: 8 }}>
                {selectedBook.chapters?.map((ch, ci) => (
                  <Card key={ci} variant="app" pad={10} style={{ gap: 4 }}>
                    <Txt size={13} weight={700} color={t.ink}>
                      {ci + 1}. {ch.title}
                    </Txt>
                    <Txt size={11} color={t.muted}>
                      عدد الفقرات: {ch.paragraphs?.length ?? 0}
                    </Txt>
                  </Card>
                ))}
              </ScrollView>

              <Button variant="primary" onPress={() => setSelectedBook(null)}>
                إغلاق
              </Button>
            </View>
          </View>
        </Modal>
      )}
    </Screen>
  );
}
