import assert from 'node:assert/strict';
import test from 'node:test';
import {
  aggregateSurveyResults,
  clampSurveyCoord,
  generateSurveyCode,
  isValidSurveyCode,
  normalizeSurveyCode,
} from './liveSurveyMath';

test('normalizeSurveyCode uppercases and strips invalid characters', () => {
  assert.equal(normalizeSurveyCode(' k7-m9 p2xx '), 'K7M9P2');
  assert.equal(normalizeSurveyCode('abc'), 'ABC');
});

test('generateSurveyCode produces valid 6-character codes', () => {
  for (let i = 0; i < 20; i++) {
    const code = generateSurveyCode();
    assert.equal(isValidSurveyCode(code), true);
  }
});

test('clampSurveyCoord bounds values cleanly within 0..100', () => {
  assert.equal(clampSurveyCoord(-12), 0);
  assert.equal(clampSurveyCoord(145), 100);
  assert.equal(clampSurveyCoord(66.6666), 66.67);
  assert.equal(clampSurveyCoord(Number.NaN), 50);
});

test('aggregateSurveyResults computes counts, shares, and averages accurately', () => {
  const agg = aggregateSurveyResults([
    {
      surveyCode: 'K7M9P2',
      clientId: 'dev_alpha_1',
      milieuId: 'avantgarde',
      uX: 90,
      uY: 85,
      uZ: 95,
    },
    {
      surveyCode: 'K7M9P2',
      clientId: 'dev_beta_2',
      milieuId: 'avantgarde',
      uX: 80,
      uY: 75,
      uZ: 85,
    },
    {
      surveyCode: 'K7M9P2',
      clientId: 'dev_gamma_3',
      milieuId: 'digital_adaptiv',
      uX: 70,
      uY: 65,
      uZ: 75,
    },
  ]);

  assert.equal(agg.totalResponses, 3);
  assert.equal(agg.avgX, 80);
  assert.equal(agg.avgY, 75);
  assert.equal(agg.avgZ, 85);
  assert.equal(agg.leadingMilieu?.milieu.id, 'avantgarde');
  assert.equal(agg.leadingMilieu?.count, 2);
  assert.equal(agg.leadingMilieu?.percent, 67);
});
