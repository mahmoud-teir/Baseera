/**
 * Intro — port of `Baseerah Intro Vertical.html` (1080×2337 composition, five scenes over 24s:
 * Logo · Promise · Academy · Trust · Close). The clock is a Reanimated shared value advanced on
 * the UI thread; every element reads it in a worklet style, so the sequence stays smooth on
 * devices. Scaled to fit the screen (contain) on a #0E2A25 background.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useWindowDimensions, View, type ViewStyle } from 'react-native';
import Animated, { runOnJS, useAnimatedReaction, useAnimatedStyle, useFrameCallback, useSharedValue, type SharedValue } from 'react-native-reanimated';

import { Press } from '@/components/core/Press';
import { Txt } from '@/components/core/Txt';
import { Lattice } from '@/components/layout/Ornament';
import { clamp01, CUES, draw, enter, pop, animate, INTRO_TOTAL } from '@/animations/timeline';

const M = { g: '#145C4B', d: '#0E2A25', a: '#C4A66A' };
const IV = '#FAF8F2';
const INK = '#182D29';
const W = 1080;
const H = 2337;

const Clock = createContext<SharedValue<number> | null>(null);
const useT = () => useContext(Clock)!;

type Anim = (t: number) => ViewStyle;
function A({ anim, style, children, pointerEvents }: { anim: Anim; style?: ViewStyle; children?: ReactNode; pointerEvents?: 'none' | 'box-none' }) {
  const T = useT();
  const s = useAnimatedStyle(() => anim(T.value) as never);
  return (
    <Animated.View pointerEvents={pointerEvents} style={[style, s]}>
      {children}
    </Animated.View>
  );
}

function Star({ size, start }: { size: number; start: number }) {
  const sq = (s: number, c: string, r: number, k: number) => (
    <A
      key={k}
      style={{ position: 'absolute', left: (size - s) / 2, top: (size - s) / 2, width: s, height: s, backgroundColor: c }}
      anim={(t) => {
        'worklet';
        const a = draw(t, start, start + 1.6);
        return { opacity: a, transform: [{ rotate: `${r}deg` }, { scale: a }] };
      }}
    />
  );
  const b = (t: number) => {
    'worklet';
    return pop(t, start + 1.2, start + 2.2);
  };
  return (
    <View style={{ width: size, height: size }}>
      {sq(size * 0.727, M.a, 0, 1)}
      {sq(size * 0.727, M.a, 45, 2)}
      {sq(size * 0.606, M.g, 0, 3)}
      {sq(size * 0.606, M.g, 45, 4)}
      {sq(size * 0.47, M.a, 0, 5)}
      {sq(size * 0.47, M.a, 45, 6)}
      {sq(size * 0.409, M.g, 0, 7)}
      {sq(size * 0.409, M.g, 45, 8)}
      <A
        style={{ position: 'absolute', left: size * 0.348, top: size * 0.348, width: size * 0.303, height: size * 0.303, borderRadius: size, backgroundColor: IV }}
        anim={(t) => {
          'worklet';
          return { transform: [{ scale: b(t) }] };
        }}
      />
      <A
        style={{ position: 'absolute', left: size * 0.417, top: size * 0.318, width: size * 0.273, height: size * 0.273, borderRadius: size, backgroundColor: M.g }}
        anim={(t) => {
          'worklet';
          return { transform: [{ scale: b(t) }] };
        }}
      />
      <A
        style={{ position: 'absolute', left: size * 0.591, top: size * 0.394, width: size * 0.076, height: size * 0.076, backgroundColor: M.a }}
        anim={(t) => {
          'worklet';
          return { transform: [{ rotate: '45deg' }, { scale: b(t) }] };
        }}
      />
    </View>
  );
}

function Percent() {
  const T = useT();
  const [p, setP] = useState(0);
  useAnimatedReaction(
    () => Math.round(animate(T.value, CUES.Academy + 1.6, CUES.Academy + 4.6, 'easeInOutCubic', 0, 0.62) * 100),
    (v, prev) => {
      if (v !== prev) runOnJS(setP)(v);
    },
  );
  return (
    <Txt size={26} weight={700} color={M.g} fixed>
      {p}%
    </Txt>
  );
}

function Phone() {
  const subs = ['العقيدة والتوحيد', 'الفقه والعبادات', 'القرآن والتفسير', 'الحديث النبوي'];
  return (
    <A
      style={{ position: 'absolute', left: 300, width: 480, height: 1000, borderRadius: 60, backgroundColor: IV, boxShadow: '0px 40px 90px rgba(0,0,0,0.55)', overflow: 'hidden' }}
      anim={(t) => {
        'worklet';
        const inA = enter(t, CUES.Academy - 0.6, CUES.Academy + 0.8);
        const out = 1 - enter(t, CUES.Trust - 0.2, CUES.Trust + 0.6);
        return { top: 700 + (1 - inA) * 160 - (1 - out) * 80, opacity: inA * out };
      }}>
      <View style={{ paddingTop: 70, paddingHorizontal: 30, direction: 'rtl' }}>
        <Txt font="display" size={46} weight={700} color={INK} fixed>
          الأكاديمية الإسلامية
        </Txt>
        <View style={{ flexDirection: 'row', gap: 12, marginVertical: 24, alignItems: 'center' }}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={{ flex: 1, height: 12, borderRadius: 9, backgroundColor: i === 1 ? M.g : '#E6E1D2' }} />
          ))}
        </View>
        {subs.map((n, i) => (
          <A
            key={n}
            style={{ backgroundColor: '#FFFFFF', borderRadius: 28, paddingVertical: 18, paddingHorizontal: 20, marginBottom: 16, flexDirection: 'row', gap: 16, alignItems: 'center' }}
            anim={(t) => {
              'worklet';
              const e = enter(t, CUES.Academy + 0.6 + i * 0.25, CUES.Academy + 1.2 + i * 0.25);
              const lit = enter(t, CUES.Academy + 3.8, CUES.Academy + 4.6);
              const on = i === 0 && lit > 0.5;
              return { opacity: e, transform: [{ translateY: (1 - e) * 30 }], borderWidth: on ? 2 : 1, borderColor: on ? M.g : '#E6E1D2' };
            }}>
            <View style={{ width: 62, height: 62, borderRadius: 20, backgroundColor: i === 0 ? '#E3EFEA' : '#F4ECD8' }} />
            <View style={{ flex: 1 }}>
              <Txt size={28} weight={600} color={INK} fixed>
                {n}
              </Txt>
              <View style={{ height: 10, borderRadius: 9, backgroundColor: '#E6E1D2', marginTop: 10, overflow: 'hidden' }}>
                {i === 0 && (
                  <A
                    style={{ height: 10, borderRadius: 9, backgroundColor: M.g }}
                    anim={(t) => {
                      'worklet';
                      return { width: `${animate(t, CUES.Academy + 1.6, CUES.Academy + 4.6, 'easeInOutCubic', 0, 0.62) * 100}%` };
                    }}
                  />
                )}
              </View>
            </View>
            {i === 0 && <Percent />}
          </A>
        ))}
      </View>
    </A>
  );
}

/** The closing CTA only exists once it has animated in, so it is never focusable while invisible. */
function CloseCta({ onDone }: { onDone: () => void }) {
  const T = useT();
  const [shown, setShown] = useState(false);
  useAnimatedReaction(
    () => T.value >= CUES.Close + 1.6,
    (v, prev) => {
      if (v !== prev) runOnJS(setShown)(v);
    },
  );
  return (
    <A
      style={{ marginTop: 40 }}
      anim={(t) => {
        'worklet';
        const b = pop(t, CUES.Close + 1.6, CUES.Close + 2.4);
        return { opacity: Math.min(b, 1), transform: [{ scale: b }] };
      }}>
      {shown ? (
        <Press onPress={onDone} label="ابدأ رحلتك" style={{ backgroundColor: M.a, paddingVertical: 20, paddingHorizontal: 76, borderRadius: 34 }}>
          <Txt size={48} weight={700} color={INK} fixed>
            ابدأ رحلتك
          </Txt>
        </Press>
      ) : (
        <View style={{ paddingVertical: 20, paddingHorizontal: 76 }} />
      )}
    </A>
  );
}

function Scene({ onDone }: { onDone: () => void }) {
  const prom = ['علم شرعي موثّق', 'مجاني بالكامل', 'بلا إعلانات ولا اختلاق'];
  const steps = ['المسألة', 'المصدر', 'النص المراجَع', 'وجه الاستدلال', 'مستوى الاعتماد'];
  return (
    <View style={{ position: 'absolute', left: 0, top: 208, width: W, height: 1920 }}>
      {/* Logo */}
      <A
        style={{ position: 'absolute', left: 280, width: 520, height: 520 }}
        anim={(t) => {
          'worklet';
          const logoIn = enter(t, CUES.Logo, CUES.Logo + 0.6);
          const mv = draw(t, CUES.Promise - 0.3, CUES.Promise + 0.9) * (1 - draw(t, CUES.Close - 0.4, CUES.Close + 0.8));
          const hideA = enter(t, CUES.Academy - 0.2, CUES.Academy + 0.5) - enter(t, CUES.Close - 0.5, CUES.Close + 0.3);
          return { top: 700 - 260 + mv * -440, opacity: logoIn * (1 - hideA), transform: [{ scale: 1 - mv * 0.55 }] };
        }}>
        <Star size={520} start={CUES.Logo + 0.2} />
      </A>
      {/* Name */}
      <A
        style={{ position: 'absolute', left: 0, right: 0, top: 1010, alignItems: 'center' }}
        anim={(t) => {
          'worklet';
          const name = enter(t, CUES.Logo + 1.8, CUES.Logo + 2.8);
          const logoMove = draw(t, CUES.Promise - 0.3, CUES.Promise + 0.9);
          return { opacity: name * (1 - logoMove), transform: [{ translateY: (1 - name) * 30 }] };
        }}>
        <Txt font="display" size={170} weight={700} color={IV} lh={1.1} fixed>
          بصيرة
        </Txt>
        <Txt size={34} color={M.a} ltr fixed style={{ letterSpacing: 20, marginTop: 6 }}>
          BASEERAH
        </Txt>
      </A>
      {/* Promise */}
      <A
        style={{ position: 'absolute', left: 60, right: 60, top: 600, gap: 44, alignItems: 'flex-start', direction: 'rtl' }}
        anim={(t) => {
          'worklet';
          return { opacity: draw(t, CUES.Promise - 0.3, CUES.Promise + 0.9) * (1 - draw(t, CUES.Close - 0.4, CUES.Close + 0.8)) };
        }}>
        {prom.map((p, i) => (
          <A
            key={p}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 24 }}
            anim={(t) => {
              'worklet';
              const e = enter(t, CUES.Promise + 0.8 + i * 0.9, CUES.Promise + 1.6 + i * 0.9);
              return { opacity: e * (1 - enter(t, CUES.Academy + 0.2, CUES.Academy + 1)), transform: [{ translateX: (1 - e) * -80 }] };
            }}>
            <View style={{ width: 30, height: 30, backgroundColor: M.a, transform: [{ rotate: '45deg' }] }} />
            <Txt font="display" size={76} weight={700} color={IV} lh={1.3} fixed>
              {p}
            </Txt>
          </A>
        ))}
      </A>
      {/* Academy headline */}
      <A
        style={{ position: 'absolute', left: 60, right: 60, top: 200, alignItems: 'center' }}
        anim={(t) => {
          'worklet';
          const acIn = enter(t, CUES.Academy + 0.8, CUES.Academy + 1.8);
          const acOut = 1 - enter(t, CUES.Trust - 0.2, CUES.Trust + 0.5);
          return { opacity: Math.min(clamp01(acIn), acOut) };
        }}>
        <Txt font="display" size={92} weight={700} color={IV} lh={1.3} align="center" fixed>
          تعلّم خطوة بخطوة
        </Txt>
        <Txt size={38} color="#E8F0EC" lh={1.8} align="center" fixed style={{ marginTop: 14 }}>
          كل درس يفتح الذي بعده بعد اجتياز اختباره.
        </Txt>
      </A>
      <Phone />
      {/* Trust card */}
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, bottom: 0, left: 90, right: 90, justifyContent: 'center' }}>
        <A
          style={{ backgroundColor: '#FFFFFF', borderRadius: 48, paddingTop: 48, paddingHorizontal: 54, paddingBottom: 30, boxShadow: '0px 40px 100px rgba(0,0,0,0.5)', direction: 'rtl' }}
          anim={(t) => {
            'worklet';
            const trustIn = enter(t, CUES.Trust, CUES.Trust + 0.8);
            const trustOut = 1 - enter(t, CUES.Close - 0.3, CUES.Close + 0.5);
            return { opacity: trustIn * trustOut, transform: [{ translateY: (1 - trustIn) * 80 }] };
          }}>
          <Txt font="display" size={70} weight={700} color={INK} fixed>
            اعرف الدليل
          </Txt>
          <Txt size={32} color="#7A5F26" fixed style={{ marginTop: 4, marginBottom: 30 }}>
            من أين جاءت المعلومة؟
          </Txt>
          {steps.map((s, i) => (
            <A
              key={s}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 22, marginBottom: 26 }}
              anim={(t) => {
                'worklet';
                return { opacity: Math.min(pop(t, CUES.Trust + 0.8 + i * 0.55, CUES.Trust + 1.4 + i * 0.55), 1) };
              }}>
              <A
                style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: M.g, alignItems: 'center', justifyContent: 'center' }}
                anim={(t) => {
                  'worklet';
                  return { transform: [{ scale: pop(t, CUES.Trust + 0.8 + i * 0.55, CUES.Trust + 1.4 + i * 0.55) }] };
                }}>
                <Txt size={30} color="#FFFFFF" fixed>
                  ✓
                </Txt>
              </A>
              <Txt size={42} weight={600} color={INK} fixed style={{ width: 330 }}>
                {s}
              </Txt>
              <View style={{ flex: 1, height: 16, borderRadius: 9, backgroundColor: '#E6E1D2', overflow: 'hidden' }}>
                <A
                  style={{ height: 16, backgroundColor: i === 4 ? M.a : '#C9D6D1' }}
                  anim={(t) => {
                    'worklet';
                    return { width: `${Math.min(pop(t, CUES.Trust + 0.8 + i * 0.55, CUES.Trust + 1.4 + i * 0.55), 1) * 100}%` };
                  }}
                />
              </View>
            </A>
          ))}
        </A>
      </View>
      {/* Close */}
      <View style={{ position: 'absolute', left: 60, right: 60, top: 1180, alignItems: 'center' }} pointerEvents="box-none">
        <A
          anim={(t) => {
            'worklet';
            const e = enter(t, CUES.Close + 0.5, CUES.Close + 1.5);
            return { opacity: e, transform: [{ translateY: (1 - e) * 30 }] };
          }}>
          <Txt font="display" size={84} weight={700} color={IV} lh={1.4} align="center" fixed>
            رحلتك في طلب العلم الشرعي
          </Txt>
        </A>
        <CloseCta onDone={onDone} />
      </View>
    </View>
  );
}

/** Full-screen intro. Plays once (the prototype auto-hides at 23.5s) and calls `onDone`. */
export function Intro({ onDone }: { onDone: () => void }) {
  const { width, height } = useWindowDimensions();
  const T = useSharedValue(0);
  const k = Math.min(width / W, height / H);
  useFrameCallback((f) => {
    'worklet';
    const dt = (f.timeSincePreviousFrame ?? 16) / 1000;
    T.value = Math.min(INTRO_TOTAL, T.value + dt);
  });
  useEffect(() => {
    const id = setTimeout(onDone, 23500);
    return () => clearTimeout(id);
  }, [onDone]);
  return (
    <Clock.Provider value={T}>
      <View accessibilityLabel="فيديو تعريفي: بصيرة — علم شرعي موثّق، مجاني بالكامل، بلا إعلانات" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: M.d, overflow: 'hidden' }}>
        <View style={{ position: 'absolute', top: -40, left: -40, right: -40, bottom: -40 }} pointerEvents="none">
          <Lattice opacity={0.07} spacing={60 * k} color={M.a} strokeWidth={2 * k} />
        </View>
        <View style={{ position: 'absolute', left: width / 2 - W / 2, top: height / 2 - H / 2, width: W, height: H, transform: [{ scale: k }], direction: 'ltr' }}>
          <Scene onDone={onDone} />
        </View>
      </View>
    </Clock.Provider>
  );
}
