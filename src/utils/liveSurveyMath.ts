import { MILIEUS, type MilieuId, type MilieuSpec } from '../data/milieus';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const SURVEY_CODE_REGEX = /^[A-Z0-9]{6}$/;
export const CLIENT_ID_REGEX = /^[a-zA-Z0-9_-]+$/;
export const VALID_MILIEU_IDS = new Set<MilieuId>(MILIEUS.map((m) => m.id));

export interface LiveSurveySession {
  code: string;
  title: string;
  status: 'active';
}

export interface SurveyResponseDoc {
  surveyCode: string;
  clientId: string;
  milieuId: MilieuId;
  uX: number;
  uY: number;
  uZ: number;
}

export interface AggregatedMilieuBucket {
  milieu: MilieuSpec;
  count: number;
  percent: number;
  deltaVsGermany: number;
}

export interface LiveSurveyAggregation {
  totalResponses: number;
  buckets: AggregatedMilieuBucket[];
  avgX: number;
  avgY: number;
  avgZ: number;
  leadingMilieu: AggregatedMilieuBucket | null;
}

export function normalizeSurveyCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
}

export function isValidSurveyCode(code: string): boolean {
  return SURVEY_CODE_REGEX.test(code);
}

export function generateSurveyCode(): string {
  const bytes = new Uint8Array(6);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 6; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return code;
}

export function clampSurveyCoord(val: number): number {
  if (!Number.isFinite(val)) return 50;
  return Math.round(Math.min(100, Math.max(0, val)) * 100) / 100;
}

export function aggregateSurveyResults(
  responses: SurveyResponseDoc[],
): LiveSurveyAggregation {
  const total = responses.length;
  const counts = new Map<MilieuId, number>();
  for (const m of MILIEUS) counts.set(m.id, 0);

  let sumX = 0;
  let sumY = 0;
  let sumZ = 0;

  for (const r of responses) {
    if (counts.has(r.milieuId)) {
      counts.set(r.milieuId, (counts.get(r.milieuId) ?? 0) + 1);
      sumX += r.uX;
      sumY += r.uY;
      sumZ += r.uZ;
    }
  }

  const buckets: AggregatedMilieuBucket[] = MILIEUS.map((milieu) => {
    const count = counts.get(milieu.id) ?? 0;
    const percent = total > 0 ? Math.round((count / total) * 100) : 0;
    return {
      milieu,
      count,
      percent,
      deltaVsGermany: percent - milieu.share2035,
    };
  }).sort((a, b) => b.count - a.count || b.milieu.share2035 - a.milieu.share2035);

  const leadingMilieu = total > 0 ? buckets[0] : null;

  return {
    totalResponses: total,
    buckets,
    avgX: total > 0 ? Math.round(sumX / total) : 50,
    avgY: total > 0 ? Math.round(sumY / total) : 50,
    avgZ: total > 0 ? Math.round(sumZ / total) : 50,
    leadingMilieu,
  };
}
