import { TAWHEED_GATES } from '@/data/tawheedGatewaysData';
import { useTawheed } from '@/state/tawheed-store';

describe('Tawheed & Sunnah Gateways Data & Store', () => {
  beforeEach(() => {
    useTawheed.getState().resetTawheedProgress();
  });

  test('contains exactly 7 well-structured gateways', () => {
    expect(TAWHEED_GATES).toHaveLength(7);

    const ids = new Set();
    TAWHEED_GATES.forEach((gate, index) => {
      expect(gate.number).toBe(index + 1);
      expect(gate.title).toBeTruthy();
      expect(gate.subtitle).toBeTruthy();
      expect(gate.corePrinciple).toBeTruthy();
      expect(gate.badgeTitle).toBeTruthy();

      // Ensure no duplicate IDs
      expect(ids.has(gate.id)).toBe(false);
      ids.add(gate.id);

      // Verify authentic components
      expect(gate.verses.length).toBeGreaterThan(0);
      expect(gate.hadiths.length).toBeGreaterThan(0);
      expect(gate.scholarlyQuotes.length).toBeGreaterThan(0);
      expect(gate.shubuhat.length).toBeGreaterThan(0);
      expect(gate.quiz.length).toBeGreaterThan(0);

      // Verify quiz validity
      gate.quiz.forEach((q) => {
        expect(q.options.length).toBeGreaterThanOrEqual(2);
        expect(q.correctIndex).toBeGreaterThanOrEqual(0);
        expect(q.correctIndex).toBeLessThan(q.options.length);
        expect(q.explanation).toBeTruthy();
      });
    });
  });

  test('verifies Gate 4 specifically covers ruling by Allahs revelation with Ibn Abbas and Salaf quotes', () => {
    const gate4 = TAWHEED_GATES.find((g) => g.id === 'gate-4-tahkeem-shariah');
    expect(gate4).toBeDefined();
    expect(gate4?.title).toContain('الحكم');

    // Ibn Abbas quote on Kufr duna Kufr
    const ibnAbbasQuote = gate4?.scholarlyQuotes.find((q) => q.scholar.includes('عباس'));
    expect(ibnAbbasQuote).toBeDefined();
    expect(ibnAbbasQuote?.quote).toContain('كفر دون كفر');

    // Shaykh al-Islam Ibn Taymiyyah quote
    const ibnTaymiyyahQuote = gate4?.scholarlyQuotes.find((q) => q.scholar.includes('ابن تيمية'));
    expect(ibnTaymiyyahQuote).toBeDefined();

    // Verify shubuhat clarify the Khawarij and Murjiah deviations
    const khawarijShubha = gate4?.shubuhat.find((s) => s.shubha.includes('الخوارج'));
    expect(khawarijShubha).toBeDefined();
  });

  test('manages gateway unlocking and completion progress accurately', () => {
    const store = useTawheed.getState();

    // Initially Gate 1 is unlocked, others locked
    expect(store.unlockedGates['gate-1-tawheed-types']).toBe(true);
    expect(store.unlockedGates['gate-2-shahada-conditions']).toBeFalsy();
    expect(store.completedGates['gate-1-tawheed-types']).toBeFalsy();

    // Complete Gate 1 with score 100, unlocking Gate 2
    store.completeGate('gate-1-tawheed-types', 100, 'gate-2-shahada-conditions');

    const updated = useTawheed.getState();
    expect(updated.completedGates['gate-1-tawheed-types']).toBe(true);
    expect(updated.unlockedGates['gate-2-shahada-conditions']).toBe(true);
    expect(updated.quizScores['gate-1-tawheed-types']).toBe(100);
  });
});
