import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateSelfTestResult,
  SELF_TEST_QUESTIONS,
} from './selfTest.ts';

test('SELF_TEST_QUESTIONS has exactly 10 questions with proper inverted flags', () => {
  assert.equal(SELF_TEST_QUESTIONS.length, 10);
  const invertedIds = SELF_TEST_QUESTIONS.filter((q) => q.inverted).map(
    (q) => q.id,
  );
  assert.deepEqual(invertedIds, [2, 6, 10]);
});

test('maximum transformative/privileged/resilient profile yields (100, 100, 100) and Avantgarde', () => {
  const answers: Record<number, number> = {
    1: 5,
    2: 1, // inverted -> 5
    3: 5,
    4: 5,
    5: 5,
    6: 1, // inverted -> 5
    7: 5,
    8: 5,
    9: 5,
    10: 1, // inverted -> 5
  };
  const res = calculateSelfTestResult(answers);
  assert.equal(res.uXRounded, 100);
  assert.equal(res.uYRounded, 100);
  assert.equal(res.uZRounded, 100);
  assert.equal(res.topMatch.milieu.id, 'avantgarde');
  assert.ok(res.topMatch.percent >= 55);
  assert.equal(
    res.ranked.reduce((s, r) => s + r.percent, 0),
    100,
  );
});

test('minimum scores yield (0, 0, 0) and Prekariat / Senioren at bottom', () => {
  const answers: Record<number, number> = {
    1: 1,
    2: 5, // inverted -> 1
    3: 1,
    4: 1,
    5: 1,
    6: 5, // inverted -> 1
    7: 1,
    8: 1,
    9: 1,
    10: 5, // inverted -> 1
  };
  const res = calculateSelfTestResult(answers);
  assert.equal(res.uXRounded, 0);
  assert.equal(res.uYRounded, 0);
  assert.equal(res.uZRounded, 0);
  assert.equal(res.topMatch.milieu.id, 'prekariat');
  assert.equal(
    res.ranked.reduce((s, r) => s + r.percent, 0),
    100,
  );
});

test('traditional affluent profile maps to Konservativ-Etablierte', () => {
  const answers: Record<number, number> = {
    1: 1,
    2: 5, // inverted -> 1 (low X)
    3: 2,
    4: 5,
    5: 5,
    6: 1, // inverted -> 5 (high Y)
    7: 3,
    8: 4,
    9: 3,
    10: 2, // inverted -> 4 (moderate-high Z)
  };
  const res = calculateSelfTestResult(answers);
  assert.equal(res.topMatch.milieu.id, 'konservativ');
  assert.equal(
    res.ranked.reduce((s, r) => s + r.percent, 0),
    100,
  );
});

test('Largest-Remainder rounding guarantees exact 100% sum across arbitrary combinations', () => {
  for (let offset = 0; offset < 5; offset++) {
    const answers: Record<number, number> = {};
    for (let q = 1; q <= 10; q++) {
      answers[q] = ((q + offset) % 5) + 1;
    }
    const res = calculateSelfTestResult(answers);
    const sum = res.ranked.reduce((s, r) => s + r.percent, 0);
    assert.equal(sum, 100);
    for (let i = 1; i < res.ranked.length; i++) {
      assert.ok(res.ranked[i - 1].percent >= res.ranked[i].percent);
    }
  }
});
