/**
 * BookCover — Classical Islamic Typographic Book Cover Component.
 * Renders an authentic heritage leather-bound book cover with ornate Islamic gold-foil borders,
 * noble typography (Amiri display), and category-specific hues with 0KB network payload.
 */
import { Image } from 'expo-image';
import { useMemo } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { Txt } from '@/components/core/Txt';
import { isRTL } from '@/theme/layout';

export interface BookCoverProps {
  title: string;
  author?: string | null;
  category?: string | null;
  source?: string | null;
  coverUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

interface Palette {
  base: string;
  dark: string;
  gold: string;
  goldLight: string;
  goldDark: string;
  textGold: string;
  ribbon: string;
}

const PALETTES: Record<string, Palette> = {
  العقيدة: {
    base: '#0D3327',
    dark: '#061D15',
    gold: '#C5A059',
    goldLight: '#F3E4BE',
    goldDark: '#8A6D30',
    textGold: '#F8E9C8',
    ribbon: '#0A281E',
  },
  الفقه: {
    base: '#0D223B',
    dark: '#061120',
    gold: '#C5A059',
    goldLight: '#F3E4BE',
    goldDark: '#8A6D30',
    textGold: '#F8E9C8',
    ribbon: '#091A2E',
  },
  التفسير: {
    base: '#0A2F2B',
    dark: '#051A18',
    gold: '#C5A059',
    goldLight: '#F3E4BE',
    goldDark: '#8A6D30',
    textGold: '#F8E9C8',
    ribbon: '#082522',
  },
  'التجويد وعلوم القرآن': {
    base: '#0A2F2B',
    dark: '#051A18',
    gold: '#C5A059',
    goldLight: '#F3E4BE',
    goldDark: '#8A6D30',
    textGold: '#F8E9C8',
    ribbon: '#082522',
  },
  الحديث: {
    base: '#3E101A',
    dark: '#22070D',
    gold: '#C5A059',
    goldLight: '#F3E4BE',
    goldDark: '#8A6D30',
    textGold: '#F8E9C8',
    ribbon: '#2F0B13',
  },
  السيرة: {
    base: '#2D1910',
    dark: '#1A0D07',
    gold: '#C5A059',
    goldLight: '#F3E4BE',
    goldDark: '#8A6D30',
    textGold: '#F8E9C8',
    ribbon: '#23120A',
  },
  'التاريخ الإسلامي': {
    base: '#2D1910',
    dark: '#1A0D07',
    gold: '#C5A059',
    goldLight: '#F3E4BE',
    goldDark: '#8A6D30',
    textGold: '#F8E9C8',
    ribbon: '#23120A',
  },
  'أصول الفقه': {
    base: '#231535',
    dark: '#12091E',
    gold: '#C5A059',
    goldLight: '#F3E4BE',
    goldDark: '#8A6D30',
    textGold: '#F8E9C8',
    ribbon: '#1B0F2B',
  },
  'الرقائق والآداب': {
    base: '#181E22',
    dark: '#0D1114',
    gold: '#C5A059',
    goldLight: '#F3E4BE',
    goldDark: '#8A6D30',
    textGold: '#F8E9C8',
    ribbon: '#12171B',
  },
  'اللغة العربية': {
    base: '#181E22',
    dark: '#0D1114',
    gold: '#C5A059',
    goldLight: '#F3E4BE',
    goldDark: '#8A6D30',
    textGold: '#F8E9C8',
    ribbon: '#12171B',
  },
};

const DEFAULT_PALETTE: Palette = PALETTES['العقيدة'];

const SIZES = {
  sm: { w: 60, h: 84, fsTitle: 10.5, fsAuthor: 7.5, pad: 4, borderPad: 3, ribs: false, cornerSize: 4 },
  md: { w: 110, h: 154, fsTitle: 13.5, fsAuthor: 9.5, pad: 8, borderPad: 6, ribs: true, cornerSize: 7 },
  lg: { w: 170, h: 242, fsTitle: 17.5, fsAuthor: 11, pad: 12, borderPad: 9, ribs: true, cornerSize: 10 },
  xl: { w: 230, h: 322, fsTitle: 22, fsAuthor: 13.5, pad: 16, borderPad: 12, ribs: true, cornerSize: 14 },
};

export function BookCover({
  title,
  author,
  category,
  source,
  coverUrl,
  size = 'md',
  width: customW,
  height: customH,
  style,
}: BookCoverProps) {
  const p = (category && PALETTES[category]) ? PALETTES[category] : DEFAULT_PALETTE;
  const cfg = SIZES[size] ?? SIZES.md;
  const w = customW ?? cfg.w;
  const h = customH ?? cfg.h;
  const rtl = isRTL();

  // Parse title into Main Title and Subtitle for elegant typography
  const { mainTitle, subTitle } = useMemo(() => {
    if (!title) return { mainTitle: '', subTitle: null };
    const m = title.match(/^([^(]+)(?:\((.*)\))?$/);
    if (m) {
      let sub = m[2] ? m[2].trim() : null;
      if (sub) {
        sub = sub
          .replace(/\b105\b/g, '١٠٥')
          .replace(/\b21\b/g, '٢١')
          .replace(/\b420\b/g, '٤٢٠')
          .replace(/\b1896\b/g, '١٨٩٦');
      }
      return {
        mainTitle: m[1].trim(),
        subTitle: sub,
      };
    }
    return { mainTitle: title.trim(), subTitle: null };
  }, [title]);

  // Clean author name for display on the classical book binding
  const displayAuthor = useMemo(() => {
    if (!author) return null;
    let a = author.trim();
    a = a.replace(/^(تأليف|المؤلف)\s*[:—\-]?\s*/, '');
    if (a.includes('الطحاوي')) return 'الإمام أبو جعفر الطحاوي (ت ٣٢١ هـ)';
    if (a.includes('ابن كثير')) return 'الحافظ عماد الدين ابن كثير (ت ٧٧٤ هـ)';
    if (a.includes('ابن تيمية')) return 'شيخ الإسلام ابن تيمية (ت ٧٢٨ هـ)';
    if (a.includes('النووي')) return 'الإمام يحيى بن شرف النووي (ت ٦٧٦ هـ)';
    if (a.includes('المقدسي') && a.includes('عبد الغني')) return 'الحافظ عبد الغني المقدسي (ت ٦٠٠ هـ)';
    if (a.includes('محمد بن عبد الوهاب')) return 'الإمام محمد بن عبد الوهاب (ت ١٢٠٦ هـ)';
    if (a.includes('السعدي')) return 'العلامة الشيخ عبد الرحمن السعدي';
    if (a.includes('الترمذي')) return 'الإمام أبو عيسى الترمذي (ت ٢٧٩ هـ)';
    if (a.includes('ابن قدامة')) return 'الإمام موفق الدين ابن قدامة (ت ٦٢٠ هـ)';
    if (a.includes('ابن حجر')) return 'الحافظ ابن حجر العسقلاني (ت ٨٥٢ هـ)';
    if (a.includes('ابن آجروم')) return 'الإمام ابن آجروم الصنهاجي';
    if (a.includes('الجويني')) return 'إمام الحرمين أبو المعالي الجويني';
    return a;
  }, [author]);

  // Clean footer publisher / edition text
  const footerSource = useMemo(() => {
    if (!source) return 'دار بصيرة للتراث الإسلامي';
    let s = source.replace(/https?:\/\/[^\s)]+/g, '').replace(/shamela\.ws\/[^\s)]+/g, '').replace(/[\(\/]\s*[\)\/]/g, '').trim();
    if (s.includes('المكتبة الشاملة') || s.length < 3) {
      return 'طبعة محققة معتمدة';
    }
    return s.split('—')[0].trim() || 'دار بصيرة للتراث الإسلامي';
  }, [source]);

  // Only use external image if it is explicitly an image file extension (.jpg, .png, etc.), NOT a website URL
  const isImageFile = useMemo(() => {
    if (!coverUrl || typeof coverUrl !== 'string') return false;
    return /\.(jpe?g|png|webp|avif)($|\?)/i.test(coverUrl);
  }, [coverUrl]);

  if (isImageFile && coverUrl) {
    return (
      <View
        style={[
          styles.container,
          {
            width: w,
            height: h,
            borderRadius: Math.round(w * 0.08),
            backgroundColor: p.base,
          },
          style,
        ]}>
        <Image
          source={{ uri: coverUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={200}
        />
      </View>
    );
  }

  const spineWidth = size === 'sm' ? 4 : size === 'md' ? 8 : 12;
  const bp = cfg.borderPad;
  const innerW = w - spineWidth - bp * 2;
  const innerH = h - bp * 2;
  const cs = cfg.cornerSize;

  return (
    <View
      style={[
        styles.container,
        {
          width: w,
          height: h,
          borderRadius: Math.max(6, Math.round(w * 0.06)),
          backgroundColor: p.base,
        },
        style,
      ]}>
      {/* Background Deep Leather Gradient */}
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={`bgGrad-${w}-${h}`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={p.base} stopOpacity="1" />
            <Stop offset="0.6" stopColor={p.base} stopOpacity="1" />
            <Stop offset="1" stopColor={p.dark} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width={w} height={h} fill={`url(#bgGrad-${w}-${h})`} />
      </Svg>

      {/* Book Spine (Raised Leather Ribbing & Gold Edge Line) */}
      <View
        style={[
          styles.spine,
          rtl ? { right: 0 } : { left: 0 },
          {
            width: spineWidth,
            backgroundColor: p.ribbon,
            borderLeftWidth: rtl ? 1 : 0,
            borderRightWidth: rtl ? 0 : 1,
            borderColor: p.goldDark,
          },
        ]}>
        {cfg.ribs && (
          <View style={styles.spineRibsContainer}>
            <View style={[styles.spineRib, { backgroundColor: p.goldDark }]} />
            <View style={[styles.spineRib, { backgroundColor: p.goldDark }]} />
            <View style={[styles.spineRib, { backgroundColor: p.goldDark }]} />
            <View style={[styles.spineRib, { backgroundColor: p.goldDark }]} />
          </View>
        )}
      </View>

      {/* Ornate Islamic Gold Border with Corner Knots */}
      <View
        pointerEvents="none"
        style={[
          styles.borderWrapper,
          rtl ? { right: spineWidth } : { left: spineWidth },
          { width: w - spineWidth, height: h },
        ]}>
        <Svg width={w - spineWidth} height={h} style={StyleSheet.absoluteFill}>
          {/* Outer Gold Border */}
          <Rect
            x={bp}
            y={bp}
            width={innerW}
            height={innerH}
            rx={Math.max(2, cs * 0.4)}
            fill="none"
            stroke={p.gold}
            strokeWidth={size === 'sm' ? 0.85 : 1.3}
            strokeOpacity={0.88}
          />
          {/* Inner Fine Gold Border */}
          {size !== 'sm' && (
            <Rect
              x={bp + 3.5}
              y={bp + 3.5}
              width={innerW - 7}
              height={innerH - 7}
              rx={Math.max(1, cs * 0.3)}
              fill="none"
              stroke={p.goldLight}
              strokeWidth={0.65}
              strokeOpacity={0.7}
            />
          )}

          {/* Corner Islamic Decorative Knots (Rub el Hizb inspired corners) */}
          {size !== 'sm' && (
            <>
              {/* Top-Right Corner */}
              <Path
                d={`M ${bp + 2} ${bp + cs} L ${bp + cs} ${bp + 2} M ${bp + 2} ${bp + 2} L ${bp + cs} ${bp + cs}`}
                stroke={p.goldLight}
                strokeWidth={1}
                strokeOpacity={0.8}
              />
              {/* Top-Left Corner */}
              <Path
                d={`M ${innerW + bp - 2} ${bp + cs} L ${innerW + bp - cs} ${bp + 2} M ${innerW + bp - 2} ${bp + 2} L ${innerW + bp - cs} ${bp + cs}`}
                stroke={p.goldLight}
                strokeWidth={1}
                strokeOpacity={0.8}
              />
              {/* Bottom-Right Corner */}
              <Path
                d={`M ${bp + 2} ${innerH + bp - cs} L ${bp + cs} ${innerH + bp - 2} M ${bp + 2} ${innerH + bp - 2} L ${bp + cs} ${innerH + bp - cs}`}
                stroke={p.goldLight}
                strokeWidth={1}
                strokeOpacity={0.8}
              />
              {/* Bottom-Left Corner */}
              <Path
                d={`M ${innerW + bp - 2} ${innerH + bp - cs} L ${innerW + bp - cs} ${innerH + bp - 2} M ${innerW + bp - 2} ${innerH + bp - 2} L ${innerW + bp - cs} ${innerH + bp - cs}`}
                stroke={p.goldLight}
                strokeWidth={1}
                strokeOpacity={0.8}
              />
            </>
          )}
        </Svg>
      </View>

      {/* Main Content Area (Typographic Masterpiece) */}
      <View
        style={[
          styles.content,
          rtl ? { marginRight: spineWidth } : { marginLeft: spineWidth },
          { paddingHorizontal: cfg.pad, paddingVertical: cfg.pad * 1.15 },
        ]}>
        {/* Top Header Motif: Bismillah */}
        {size !== 'sm' ? (
          <View style={styles.topHeader}>
            <Txt
              font="display"
              size={size === 'xl' ? 12 : 9}
              color={p.goldLight}
              weight={600}
              style={{ letterSpacing: 0.5, opacity: 0.9 }}>
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </Txt>
            <View style={[styles.headerDivider, { backgroundColor: p.gold, opacity: 0.45 }]} />
          </View>
        ) : (
          <View style={{ height: 2 }} />
        )}

        {/* Center Title Cartouche */}
        <View style={styles.centerSection}>
          <Txt
            font="display"
            size={cfg.fsTitle}
            weight={700}
            color={p.textGold}
            lh={1.25}
            numberOfLines={size === 'sm' ? 2 : 3}
            style={[
              styles.titleText,
              {
                textShadowColor: 'rgba(0,0,0,0.65)',
                textShadowOffset: { width: 0, height: 1.5 },
                textShadowRadius: 3,
              },
            ]}>
            {mainTitle}
          </Txt>

          {/* Subtitle Cartouche (e.g. كاملة بجميع بنودها ١٠٥) */}
          {subTitle && size !== 'sm' && (
            <Txt
              font="display"
              size={Math.max(9, Math.round(cfg.fsTitle * 0.62))}
              weight={500}
              color={p.goldLight}
              lh={1.2}
              numberOfLines={1}
              style={{
                textAlign: 'center',
                opacity: 0.88,
                marginTop: 3,
                paddingHorizontal: 4,
              }}>
              {subTitle}
            </Txt>
          )}

          {/* Central Arabesque Divider (— ۞ —) */}
          {size !== 'sm' && (
            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: p.gold, opacity: 0.5 }]} />
              <Txt size={size === 'xl' ? 14 : 11} color={p.goldLight} weight={700}>
                ۞
              </Txt>
              <View style={[styles.dividerLine, { backgroundColor: p.gold, opacity: 0.5 }]} />
            </View>
          )}

          {/* Author Name */}
          {displayAuthor ? (
            <Txt
              font="display"
              size={cfg.fsAuthor}
              weight={600}
              color={p.goldLight}
              numberOfLines={size === 'sm' ? 1 : 2}
              style={[
                styles.authorText,
                {
                  opacity: 0.95,
                  marginTop: size === 'sm' ? 2 : 4,
                },
              ]}>
              {displayAuthor}
            </Txt>
          ) : null}
        </View>

        {/* Bottom Publisher / Heritage Footer */}
        {size === 'lg' || size === 'xl' ? (
          <View style={styles.footerSection}>
            <View style={[styles.footerLine, { backgroundColor: p.gold, opacity: 0.35 }]} />
            <Txt size={size === 'xl' ? 10 : 8.5} color={p.gold} weight={600} style={{ opacity: 0.88 }}>
              {footerSource}
            </Txt>
          </View>
        ) : (
          <View style={{ height: 2 }} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
    boxShadow: '0px 6px 16px rgba(0,0,0,0.22)',
    elevation: 4,
  },
  spine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    zIndex: 10,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
  },
  spineRibsContainer: {
    flex: 1,
    justifyContent: 'space-around',
    width: '100%',
    alignItems: 'center',
  },
  spineRib: {
    width: '100%',
    height: 1.5,
    opacity: 0.45,
  },
  borderWrapper: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    zIndex: 5,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 8,
  },
  topHeader: {
    alignItems: 'center',
    gap: 3,
  },
  headerDivider: {
    width: 24,
    height: 1,
  },
  centerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  titleText: {
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 4,
    width: '70%',
    justifyContent: 'center',
  },
  dividerLine: {
    flex: 1,
    height: 0.75,
  },
  authorText: {
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  footerSection: {
    alignItems: 'center',
    gap: 3,
    width: '80%',
  },
  footerLine: {
    width: '100%',
    height: 0.75,
  },
});
