import test from 'node:test';
import assert from 'node:assert/strict';
import { CLASSIC_MILIEUS_2026, MILIEUS } from '../data/milieus';
import {
  getMilieuSnapshotForMode,
  interpolateMilieuFrame,
  ndcToScreen,
  resolveLabelOverlaps,
  scoreToWorldCoords,
  sumClassicShares2026,
  sumShares2035,
} from './projection';

test('all 6 milieus (2035) and all 10 classic milieus (2026) each sum to 100%', () => {
  assert.equal(MILIEUS.length, 6);
  assert.equal(CLASSIC_MILIEUS_2026.length, 10);
  assert.equal(sumShares2035(), 100);
  assert.equal(sumClassicShares2026(), 100);
});

test('2035 resilience scores and floating elevations match exact sociological hierarchy', () => {
  const byId = Object.fromEntries(MILIEUS.map((m) => [m.id, m]));
  assert.equal(byId.avantgarde.resilienceScore, 92);
  assert.equal(byId.digital_adaptiv.resilienceScore, 80);
  assert.equal(byId.konservativ.resilienceScore, 58);
  assert.equal(byId.erodierte_mitte.resilienceScore, 32);
  assert.equal(byId.senioren.resilienceScore, 22);
  assert.equal(byId.prekariat.resilienceScore, 12);

  assert.ok(byId.avantgarde.elevation2035 > byId.digital_adaptiv.elevation2035);
  assert.ok(byId.digital_adaptiv.elevation2035 > byId.konservativ.elevation2035);
  assert.ok(byId.konservativ.elevation2035 > byId.erodierte_mitte.elevation2035);
  assert.ok(byId.erodierte_mitte.elevation2035 > byId.senioren.elevation2035);
  assert.ok(byId.senioren.elevation2035 > byId.prekariat.elevation2035);
});

test('2026 mode descends floating islands to floor while 2035 elevates them to Z', () => {
  const avantgarde = MILIEUS.find((m) => m.id === 'avantgarde')!;
  const snap2026 = getMilieuSnapshotForMode(avantgarde, '2026');
  const snap2035 = getMilieuSnapshotForMode(avantgarde, '2035');

  assert.equal(snap2026.elevation, 0.08);
  assert.equal(snap2026.opacity2026, 1);
  assert.equal(snap2026.opacity2035, 0);

  assert.equal(snap2035.elevation, avantgarde.elevation2035);
  assert.equal(snap2035.opacity2035, 1);
  assert.equal(snap2035.opacity2026, 0);
});

test('interpolateMilieuFrame smoothly lifts and spreads islands across 0..1 progress', () => {
  const avantgarde = MILIEUS.find((m) => m.id === 'avantgarde')!;
  const start = interpolateMilieuFrame(avantgarde, 0);
  const mid = interpolateMilieuFrame(avantgarde, 0.55);
  const end = interpolateMilieuFrame(avantgarde, 1);

  assert.ok(mid.x > start.x && mid.x < end.x);
  assert.ok(mid.elevation > start.elevation && mid.elevation < end.elevation);
});

test('scoreToWorldCoords maps 0..100 user coordinates consistently into 3D space', () => {
  const high = scoreToWorldCoords(100, 100, 100);
  const low = scoreToWorldCoords(0, 0, 0);
  assert.ok(high.x > 0 && high.z < 0 && high.y === 7.5);
  assert.ok(low.x < 0 && low.z > 0 && low.y < 1);
});

test('ndcToScreen and resolveLabelOverlaps behave deterministically', () => {
  const center = ndcToScreen(0, 0, 0.5, 1200, 700);
  assert.equal(center.x, 600);
  assert.equal(center.y, 350);
  assert.equal(center.visible, true);

  const resolved = resolveLabelOverlaps(
    [
      { id: 'a', x: 500, y: 400, width: 160, height: 42, priority: 10 },
      { id: 'b', x: 505, y: 404, width: 160, height: 42, priority: 5 },
    ],
    1200,
    700,
  );

  const a = resolved.find((r) => r.id === 'a')!;
  const b = resolved.find((r) => r.id === 'b')!;
  assert.equal(Math.abs(a.x - b.x) < 160 && Math.abs(a.y - b.y) < 42, false);
});
