import { MILIEUS, type MilieuSpec, type SimulationYear } from '../data/milieus';

export interface MilieuFrameTarget {
  x: number;
  z: number;
  height: number;
  scale: number;
  share: number;
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
 * Choreographed interpolation between 2020 (t = 0, flat overlapping 2D)
 * and 2035 (t = 1, separated extruded 3D transformation model).
 * Phase 1 (0.0 -> 0.55): horizontal separation & footprint morphing as rifts open.
 * Phase 2 (0.22 -> 1.0): smooth vertical resilience extrusion.
 */
export function interpolateMilieuFrame(
  milieu: MilieuSpec,
  progress: number,
): MilieuFrameTarget {
  const t = clamp01(progress);
  const spreadEase = smootherstep(0.0, 0.58, t);
  const heightEase = smootherstep(0.2, 1.0, t);
  const shareEase = smootherstep(0.0, 1.0, t);

  const lerp = (a: number, b: number, alpha: number) => a + (b - a) * alpha;

  return {
    x: lerp(milieu.pos2020.x, milieu.pos2035.x, spreadEase),
    z: lerp(milieu.pos2020.z, milieu.pos2035.z, spreadEase),
    height: lerp(milieu.height2020, milieu.height2035, heightEase),
    scale: lerp(milieu.scale2020, milieu.scale2035, spreadEase),
    share: Math.round(lerp(milieu.share2020, milieu.share2035, shareEase)),
  };
}

/**
 * Maps continuous slider progress [0..1] to display year [2020..2035].
 */
export function getDisplayYear(progress: number): number {
  return Math.round(2020 + clamp01(progress) * 15);
}

/**
 * Returns the target transform and share for a milieu in either 2020 (2D) or 2035 (3D).
 */
export function getMilieuSnapshotForYear(
  milieu: MilieuSpec,
  year: SimulationYear,
): MilieuFrameTarget {
  return interpolateMilieuFrame(milieu, year === '2035' ? 1 : 0);
}

/**
 * Validates that population shares for a given simulation year sum to 100%.
 */
export function sumSharesForYear(year: SimulationYear, list: MilieuSpec[] = MILIEUS): number {
  return list.reduce((acc, m) => acc + (year === '2020' ? m.share2020 : m.share2035), 0);
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
  margins: SafeMarginBox = { left: 24, right: 24, top: 86, bottom: 96 },
): LabelLayoutOutput[] {
  const working = items
    .map((item) => ({ ...item }))
    .sort((a, b) => b.priority - a.priority);

  const clampItem = (item: LabelLayoutInput) => {
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

  const paddingX = 10;
  const paddingY = 8;

  for (let pass = 0; pass < 6; pass++) {
    for (let i = 0; i < working.length; i++) {
      for (let j = i + 1; j < working.length; j++) {
        const a = working[i];
        const b = working[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const reqX = (a.width + b.width) * 0.5 + paddingX;
        const reqY = (a.height + b.height) * 0.5 + paddingY;

        if (Math.abs(dx) < reqX && Math.abs(dy) < reqY) {
          const overlapX = reqX - Math.abs(dx);
          const overlapY = reqY - Math.abs(dy);

          if (overlapY <= overlapX) {
            const dir = dy >= 0 ? 1 : -1;
            a.y -= dir * overlapY * 0.35;
            b.y += dir * overlapY * 0.65;
          } else {
            const dir = dx >= 0 ? 1 : -1;
            a.x -= dir * overlapX * 0.35;
            b.x += dir * overlapX * 0.65;
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
