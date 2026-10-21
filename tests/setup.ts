// Jest setup: in-memory AsyncStorage and a lightweight Reanimated stand-in (no native worklets).
// eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories must use require()
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

jest.mock('react-native-reanimated', () => {
  const RN = jest.requireActual('react-native');
  const chain = { duration: () => chain, delay: () => chain, withInitialValues: () => chain };
  class Keyframe {
    duration() {
      return this;
    }
  }
  const Animated = { View: RN.View, Text: RN.Text, ScrollView: RN.ScrollView, createAnimatedComponent: (c: unknown) => c };
  return {
    __esModule: true,
    default: Animated,
    ...Animated,
    Keyframe,
    FadeIn: chain,
    FadeInDown: chain,
    Easing: { out: (f: unknown) => f, in: (f: unknown) => f, inOut: (f: unknown) => f, ease: (t: number) => t, linear: (t: number) => t },
    useReducedMotion: () => false,
    useSharedValue: (v: unknown) => ({ value: v }),
    useAnimatedStyle: () => ({}),
    useAnimatedReaction: () => {},
    useFrameCallback: () => {},
    withTiming: (v: unknown) => v,
    withRepeat: (v: unknown) => v,
    runOnJS: (f: unknown) => f,
  };
});
