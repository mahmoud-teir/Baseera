import fs from 'fs';
import path from 'path';

const p = path.resolve('src/features/qibla/Compass.tsx');
let c = fs.readFileSync(p, 'utf8');

const oldMiniCompass = `      <View
        accessibilityRole="image"
        accessibilityLabel={bearing != null ? \`اتجاه القبلة \${Math.round(bearing)} درجة من الشمال\` : 'اتجاه القبلة غير محدد'}
        style={{ width: 132, height: 132, borderRadius: 66, borderWidth: 2, borderColor: aligned ? pc : t.line, backgroundColor: t.soft }}>
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            transform: [{ rotate: \`\${dialRotation}deg\` }],
            transitionProperty: reduceMotion ? 'none' : 'transform',
            transitionDuration: 120,
          }}>
          <Txt size={12} color={t.muted} align="center" style={{ marginTop: 4 }}>
            ش
          </Txt>
        </Animated.View>
        {bearing != null && (
          <Animated.View
            style={{
              position: 'absolute',
              left: 64,
              top: 16,
              width: 4,
              height: 100,
              transform: [{ rotate: \`\${angle}deg\` }],
              transitionProperty: reduceMotion ? 'none' : 'transform',
              transitionDuration: 120,
            }}>
            <View style={{ position: 'absolute', top: 0, left: -6, width: 16, height: 16, backgroundColor: gc, transform: [{ rotate: '45deg' }] }} />
            <View style={{ position: 'absolute', top: 10, left: 0, width: 4, height: 44, backgroundColor: pc, borderRadius: 3 }} />
          </Animated.View>
        )}
        <View style={{ position: 'absolute', left: 61, top: 61, width: 10, height: 10, borderRadius: 5, backgroundColor: pc }} />
      </View>`;

const newMiniCompass = `      <View
        accessibilityRole="image"
        accessibilityLabel={bearing != null ? \`اتجاه القبلة \${Math.round(bearing)} درجة من الشمال\` : 'اتجاه القبلة غير محدد'}
        style={{
          width: 136,
          height: 136,
          borderRadius: 68,
          borderWidth: 2.5,
          borderColor: aligned ? '#10B981' : gc,
          backgroundColor: dark ? '#0B1E19' : t.soft,
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: aligned ? \`0px 0px 16px rgba(16, 185, 129, 0.4)\` : undefined,
        }}>
        <View style={{ position: 'absolute', top: 3, zIndex: 5, width: 0, height: 0, borderLeftWidth: 4, borderRightWidth: 4, borderTopWidth: 6, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: aligned ? '#10B981' : gc }} />
        <Animated.View
          style={{
            position: 'absolute',
            width: 130,
            height: 130,
            transform: [{ rotate: \`\${dialRotation}deg\` }],
            transitionProperty: reduceMotion ? 'none' : 'transform',
            transitionDuration: 120,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Txt size={12} weight={800} color="#EF4444" style={{ position: 'absolute', top: 5 }}>
            ش
          </Txt>
          <Txt size={11} weight={700} color={t.muted} style={{ position: 'absolute', right: 8 }}>
            ق
          </Txt>
          <Txt size={11} weight={700} color={t.muted} style={{ position: 'absolute', bottom: 5 }}>
            ج
          </Txt>
          <Txt size={11} weight={700} color={t.muted} style={{ position: 'absolute', left: 8 }}>
            غ
          </Txt>
        </Animated.View>
        {bearing != null && (
          <Animated.View
            style={{
              position: 'absolute',
              width: 130,
              height: 130,
              transform: [{ rotate: \`\${angle}deg\` }],
              transitionProperty: reduceMotion ? 'none' : 'transform',
              transitionDuration: 120,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <View style={{ position: 'absolute', top: 12, alignItems: 'center' }}>
              <View style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: '#1C1917', borderWidth: 1.5, borderColor: gc, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: 10, height: 2, backgroundColor: gc }} />
              </View>
              <View style={{ width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderBottomWidth: 10, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: gc }} />
              <View style={{ width: 3, height: 34, backgroundColor: gc, borderRadius: 1.5 }} />
            </View>
            <View style={{ position: 'absolute', bottom: 18, width: 2, height: 24, backgroundColor: dark ? '#4A6B60' : '#94A3B8' }} />
          </Animated.View>
        )}
        <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: gc, borderWidth: 1.5, borderColor: '#143831' }} />
      </View>`;

const oldButton = `<Press onPress={() => router.navigate('/prayer/qibla')} label="خريطة القبلة" style={{ minHeight: 44, paddingHorizontal: 14, borderRadius: r(12), backgroundColor: t.soft, alignItems: 'center', justifyContent: 'center' }}>
            <Txt size={15} weight={600} color={t.primary}>
              خريطة القبلة ‹
            </Txt>
          </Press>`;

const newButton = `<Press onPress={() => router.navigate('/prayer/qibla')} label="البوصلة الواقعية والخريطة" style={{ minHeight: 44, paddingHorizontal: 14, borderRadius: r(12), backgroundColor: t.goldSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Txt size={15} weight={700} color={t.goldInk}>
              البوصلة الواقعية المكبرة والخريطة ‹
            </Txt>
          </Press>`;

const norm = (s) => s.replace(/\r\n/g, '\n');
c = norm(c).replace(norm(oldMiniCompass), norm(newMiniCompass)).replace(norm(oldButton), norm(newButton));

fs.writeFileSync(p, c, 'utf8');
console.log('Successfully upgraded Compass.tsx mini card!');
