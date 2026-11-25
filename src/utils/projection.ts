import {
  CLASSIC_MILIEUS_2026,
  MILIEUS,
  type ClassicMilieu2026Spec,
  type MilieuSpec,
  type ModelMode,
} from '../data/milieus';

export interface MilieuFrameTarget {
  x: number;
  z: number;
  elevation: number;
  scale: number;
  share: number;
  opacity2035: number;
  opacity2026: number;
}

export interface ScreenPoint {
  x: number;
  y: number;
  visible: boolean;
  ndcZ: number;
}

export interface LabelLayoutInput {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  priority: number;
  fixed?: boolean;
}

export interface LabelLayoutOutput {
  id: string;
  x: number;
  y: number;
}

export interface SafeMarginBox {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function smootherstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/**
 * Choreographed interpolation between 2026 (t = 0, 10 overlapping 2D milieus on floor)
 * and 2035 (t = 1, 6 floating 3D organic islands at exact Z resilience elevation).
 * Phase 1 (0.0 -> 0.45): 2026 circles fade & merge into the 6 blocks on the floor.
 * Phase 2 (0.25 -> 1.0): 6 islands float upward along Z with plumb lines extending down.
 */
export function interpolateMilieuFrame(
  milieu: MilieuSpec,
  progress: number,
): MilieuFrameTarget {
  const t = clamp01(progress);
  const spreadEase = smootherstep(0.08, 0.68, t);
  const liftEase = smootherstep(0.22, 1.0, t);
  const shareEase = smootherstep(0.0, 1.0, t);

  const opacity2035 = smootherstep(0.18, 0.62, t);
  const opacity2026 = 1 - smootherstep(0.08, 0.52, t);

  const lerp = (a: number, b: number, alpha: number) => a + (b - a) * alpha;

  return {
    x: lerp(milieu.pos2026.x, milieu.pos2035.x, spreadEase),
    z: lerp(milieu.pos2026.z, milieu.pos2035.z, spreadEase),
    elevation: lerp(0.08, milieu.elevation2035, liftEase),
    scale: lerp(0.86, milieu.scale2035, spreadEase),
    share: Math.round(lerp(milieu.share2026, milieu.share2035, shareEase)),
    opacity2035,
    opacity2026,
  };
}

/**
 * Maps 0..100 user coordinates (uX, uY, uZ) from the Self-Test into Three.js world space.
 */
export function scoreToWorldCoords(
  uX: number,
  uY: number,
  uZ: number,
): { x: number; y: number; z: number } {
  return {
    x: ((uX - 50) / 50) * 7.2,
    y: Math.max(0.28, (uZ / 100) * 7.5),
    z: ((50 - uY) / 50) * 6.2,
  };
}

/**
 * Returns the target transform and share for a milieu in either 2026 (2D) or 2035 (3D).
 */
export function getMilieuSnapshotForMode(
  milieu: MilieuSpec,
  mode: ModelMode,
): MilieuFrameTarget {
  return interpolateMilieuFrame(milieu, mode === '2035' ? 1 : 0);
}

/**
 * Validates that population shares for 2035 (6 milieus) and 2026 (10 classic milieus) both sum to 100%.
 */
export function sumShares2035(list: MilieuSpec[] = MILIEUS): number {
  return list.reduce((acc, m) => acc + m.share2035, 0);
}

export function sumClassicShares2026(
  list: ClassicMilieu2026Spec[] = CLASSIC_MILIEUS_2026,
): number {
  return list.reduce((acc, m) => acc + m.share2026, 0);
}

/**
 * Converts Normalized Device Coordinates (-1..1) into viewport pixel coordinates.
 */
export function ndcToScreen(
  ndcX: number,
  ndcY: number,
  ndcZ: number,
  viewportWidth: number,
  viewportHeight: number,
): ScreenPoint {
  const visible = ndcZ >= -1 && ndcZ <= 1;
  return {
    x: ((ndcX + 1) * 0.5) * viewportWidth,
    y: ((-ndcY + 1) * 0.5) * viewportHeight,
    visible,
    ndcZ,
  };
}

/**
 * Resolves 2D label collisions cleanly using deterministic iterative separation
 * so floating HTML labels stay legible and never overlap each other or viewport edges.
 */
export function resolveLabelOverlaps(
  items: LabelLayoutInput[],
  viewportWidth: number,
  viewportHeight: number,
  margins: SafeMarginBox = { left: 24, right: 24, top: 24, bottom: 24 },
): LabelLayoutOutput[] {
  const working = items
    .map((item) => ({ ...item }))
    .sort((a, b) => b.priority - a.priority);

  const clampItem = (item: LabelLayoutInput) => {
    if (item.fixed) return;
    const halfW = item.width * 0.5;
    const halfH = item.height * 0.5;
    const minX = margins.left + halfW;
    const maxX = Math.max(minX, viewportWidth - margins.right - halfW);
    const minY = margins.top + halfH;
    const maxY = Math.max(minY, viewportHeight - margins.bottom - halfH);

    item.x = Math.min(maxX, Math.max(minX, item.x));
    item.y = Math.min(maxY, Math.max(minY, item.y));
  };

  for (const item of working) {
    clampItem(item);
  }

  const paddingX = 8;
  const paddingY = 6;

  for (let pass = 0; pass < 8; pass++) {
    for (let i = 0; i < working.length; i++) {
      for (let j = i + 1; j < working.length; j++) {
        const a = working[i];
        const b = working[j];
        if (a.fixed && b.fixed) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const reqX = (a.width + b.width) * 0.5 + paddingX;
        const reqY = (a.height + b.height) * 0.5 + paddingY;

        if (Math.abs(dx) < reqX && Math.abs(dy) < reqY) {
          const overlapX = reqX - Math.abs(dx);
          const overlapY = reqY - Math.abs(dy);
          const wA = a.fixed ? 0 : b.fixed ? 1 : 0.35;
          const wB = b.fixed ? 0 : a.fixed ? 1 : 0.65;

          if (overlapY <= overlapX) {
            const dir = dy >= 0 ? 1 : -1;
            a.y -= dir * overlapY * wA;
            b.y += dir * overlapY * wB;
          } else {
            const dir = dx >= 0 ? 1 : -1;
            a.x -= dir * overlapX * wA;
            b.x += dir * overlapX * wB;
          }

          clampItem(a);
          clampItem(b);
        }
      }
    }
  }

  return working.map((item) => ({
    id: item.id,
    x: Math.round(item.x),
    y: Math.round(item.y),
  }));
}
