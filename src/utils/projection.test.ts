import test from 'node:test';
import assert from 'node:assert/strict';
import { MILIEUS } from '../data/milieus';
import {
  getDisplayYear,
  getMilieuSnapshotForYear,
  interpolateMilieuFrame,
  ndcToScreen,
  resolveLabelOverlaps,
  sumSharesForYear,
} from './projection';

test('all 6 milieus sum to 100% in both 2035 and 2020', () => {
  assert.equal(MILIEUS.length, 6);
  assert.equal(sumSharesForYear('2035'), 100);
  assert.equal(sumSharesForYear('2020'), 100);
});

test('2035 height hierarchy matches sociological resilience model', () => {
  const byId = Object.fromEntries(MILIEUS.map((m) => [m.id, m]));
  assert.ok(byId.avantgarde.height2035 > byId.digital_adaptiv.height2035);
  assert.ok(byId.digital_adaptiv.height2035 > byId.konservativ.height2035);
  assert.ok(byId.konservativ.height2035 > byId.erodierte_mitte.height2035);
  assert.ok(byId.erodierte_mitte.height2035 > byId.senioren.height2035);
  assert.ok(byId.senioren.height2035 > byId.prekariat.height2035);
});

test('2020 mode flattens heights and expands Eroded Middle footprint', () => {
  const middle = MILIEUS.find((m) => m.id === 'erodierte_mitte');
  assert.ok(middle);
  const snap2020 = getMilieuSnapshotForYear(middle, '2020');
  const snap2035 = getMilieuSnapshotForYear(middle, '2035');

  assert.equal(snap2020.height, 0.55);
  assert.ok(snap2020.scale > snap2035.scale);
  assert.ok(snap2020.share > snap2035.share);
});

test('interpolateMilieuFrame smoothly separates horizontally before full extrusion', () => {
  const avantgarde = MILIEUS.find((m) => m.id === 'avantgarde')!;
  const start = interpolateMilieuFrame(avantgarde, 0);
  const mid = interpolateMilieuFrame(avantgarde, 0.5);
  const end = interpolateMilieuFrame(avantgarde, 1);

  assert.equal(start.height, avantgarde.height2020);
  assert.equal(end.height, avantgarde.height2035);
  assert.ok(mid.x > start.x && mid.x <= end.x);
  assert.ok(mid.height > start.height && mid.height < end.height);
  assert.equal(getDisplayYear(0), 2020);
  assert.equal(getDisplayYear(1), 2035);
});

test('2035 positions separate further outward than 2020 overlapping positions', () => {
  const avantgarde = MILIEUS.find((m) => m.id === 'avantgarde')!;
  const konservativ = MILIEUS.find((m) => m.id === 'konservativ')!;

  const dist2020 = Math.hypot(
    avantgarde.pos2020.x - konservativ.pos2020.x,
    avantgarde.pos2020.z - konservativ.pos2020.z,
  );
  const dist2035 = Math.hypot(
    avantgarde.pos2035.x - konservativ.pos2035.x,
    avantgarde.pos2035.z - konservativ.pos2035.z,
  );

  assert.ok(dist2035 > dist2020);
});

test('ndcToScreen converts NDC coordinates accurately', () => {
  const center = ndcToScreen(0, 0, 0.5, 1440, 900);
  assert.equal(center.x, 720);
  assert.equal(center.y, 450);
  assert.equal(center.visible, true);

  const behindCamera = ndcToScreen(0, 0, 1.2, 1440, 900);
  assert.equal(behindCamera.visible, false);
});

test('resolveLabelOverlaps separates overlapping labels inside viewport bounds', () => {
  const resolved = resolveLabelOverlaps(
    [
      { id: 'a', x: 500, y: 400, width: 160, height: 42, priority: 10 },
      { id: 'b', x: 505, y: 404, width: 160, height: 42, priority: 5 },
    ],
    1440,
    900,
  );

  const a = resolved.find((r) => r.id === 'a')!;
  const b = resolved.find((r) => r.id === 'b')!;
  const overlapX = Math.abs(a.x - b.x) < 160;
  const overlapY = Math.abs(a.y - b.y) < 42;
  assert.equal(overlapX && overlapY, false);
});
