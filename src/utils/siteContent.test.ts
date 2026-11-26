import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CONTENT_SECTION_IDS,
  createDefaultSiteContent,
  sanitizeSectionData,
} from '../data/siteContentDefaults.ts';
import { calculateSelfTestResult } from './selfTest.ts';

test('DEFAULT_SITE_CONTENT covers all 7 sections and 100% milieu shares', () => {
  const defaults = createDefaultSiteContent();
  for (const id of CONTENT_SECTION_IDS) {
    assert.ok(defaults[id], `missing section ${id}`);
    assert.equal(defaults[id].sectionId, id);
  }
  const sum2035 = defaults.milieus_2035.milieus.reduce(
    (acc, m) => acc + m.share2035,
    0,
  );
  const sum2026 = defaults.milieus_2026.classicMilieus.reduce(
    (acc, m) => acc + m.share2026,
    0,
  );
  assert.equal(sum2035, 100);
  assert.equal(sum2026, 100);
});

test('sanitizeSectionData clamps numeric bounds and rejects empty strings', () => {
  const defaults = createDefaultSiteContent();
  const dirtyMeta = {
    ...defaults.meta,
    navBrand: '   ',
    navLinks: [{ href: 'javascript:alert(1)', label: '' }],
  };
  const cleanMeta = sanitizeSectionData('meta', dirtyMeta);
  assert.equal(cleanMeta.navBrand, defaults.meta.navBrand);
  assert.equal(cleanMeta.navLinks[0].href, '#modell-3d');
  assert.equal(cleanMeta.navLinks[0].label, defaults.meta.navLinks[0].label);

  const dirtyMilieus = {
    ...defaults.milieus_2035,
    milieus: defaults.milieus_2035.milieus.map((m, idx) =>
      idx === 0
        ? {
            ...m,
            resilienceScore: 999,
            elevation2035: -5,
            colorHex: 'invalid-color',
          }
        : m,
    ),
  };
  const cleanMilieus = sanitizeSectionData('milieus_2035', dirtyMilieus);
  assert.equal(cleanMilieus.milieus[0].resilienceScore, 100);
  assert.equal(cleanMilieus.milieus[0].elevation2035, 0.2);
  assert.equal(cleanMilieus.milieus[0].colorHex, defaults.milieus_2035.milieus[0].colorHex);
});

test('calculateSelfTestResult respects edited idealCoords and secondSentences', () => {
  const defaults = createDefaultSiteContent();
  const customCoords = structuredClone(defaults.self_test.idealCoords);
  // Move 'senioren' directly onto (100, 100, 100) so max answers match it
  customCoords.senioren = { x: 100, y: 100, z: 100 };
  customCoords.avantgarde = { x: 0, y: 0, z: 0 };

  const customSentences = {
    ...defaults.self_test.secondSentences,
    senioren: 'Benutzerdefinierter Admin-Satz für Senioren.',
  };

  const answers: Record<number, number> = {
    1: 5,
    2: 1,
    3: 5,
    4: 5,
    5: 5,
    6: 1,
    7: 5,
    8: 5,
    9: 5,
    10: 1,
  };

  const res = calculateSelfTestResult(answers, {
    questions: defaults.self_test.questions,
    milieus: defaults.milieus_2035.milieus,
    idealCoords: customCoords,
    secondSentences: customSentences,
  });

  assert.equal(res.topMatch.milieu.id, 'senioren');
  assert.ok(res.explanation.includes('Benutzerdefinierter Admin-Satz für Senioren.'));
});
