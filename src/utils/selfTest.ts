import { MILIEUS, type MilieuId, type MilieuSpec } from '../data/milieus';

export type SelfTestDimension = 'X' | 'Y' | 'Z';

export interface SelfTestQuestion {
  id: number;
  dimension: SelfTestDimension;
  dimensionLabel: string;
  inverted: boolean;
  text: string;
}

export interface SelfTestScaleOption {
  value: 1 | 2 | 3 | 4 | 5;
  label: string;
  shortLabel: string;
}

export const SELF_TEST_SCALE_OPTIONS: SelfTestScaleOption[] = [
  { value: 1, label: 'Stimme gar nicht zu', shortLabel: 'Gar nicht' },
  { value: 2, label: 'Stimme eher nicht zu', shortLabel: 'Eher nicht' },
  { value: 3, label: 'Teils / teils', shortLabel: 'Teils / teils' },
  { value: 4, label: 'Stimme eher zu', shortLabel: 'Eher zu' },
  { value: 5, label: 'Stimme voll zu', shortLabel: 'Voll zu' },
];

export const SELF_TEST_QUESTIONS: SelfTestQuestion[] = [
  {
    id: 1,
    dimension: 'X',
    dimensionLabel: 'Dimension X · Werteorientierung',
    inverted: false,
    text: 'Für konsequenten Klimaschutz und gesellschaftlichen Wandel bin ich bereit, meinen eigenen Lebensstil und Konsum spürbar umzustellen.',
  },
  {
    id: 2,
    dimension: 'X',
    dimensionLabel: 'Dimension X · Werteorientierung',
    inverted: true,
    text: 'Bewährte Traditionen, nationale Identität und soziale Sicherheit sind mir wichtiger als schnelle gesellschaftliche Experimente.',
  },
  {
    id: 3,
    dimension: 'X',
    dimensionLabel: 'Dimension X · Werteorientierung',
    inverted: false,
    text: 'Diversität, globale Vernetzung und neue Lebensmodelle sehe ich als große Bereicherung für unsere Gesellschaft.',
  },
  {
    id: 4,
    dimension: 'Y',
    dimensionLabel: 'Dimension Y · Soziale Lage & Ressourcen',
    inverted: false,
    text: 'Ich strebe einen hohen Bildungsabschluss (z. B. Studium/Meister) an bzw. besitze ihn und erwarte ein überdurchschnittliches Einkommen.',
  },
  {
    id: 5,
    dimension: 'Y',
    dimensionLabel: 'Dimension Y · Soziale Lage & Ressourcen',
    inverted: false,
    text: 'Finanzielle Rücklagen, Vermögensaufbau oder Eigentum spielen in meiner Lebensplanung eine zentrale, realistische Rolle.',
  },
  {
    id: 6,
    dimension: 'Y',
    dimensionLabel: 'Dimension Y · Soziale Lage & Ressourcen',
    inverted: true,
    text: 'Steigende Mieten, Lebensmittel- und Energiepreise schränken meinen Alltag und meine Zukunftsplanung stark ein.',
  },
  {
    id: 7,
    dimension: 'Z',
    dimensionLabel: 'Dimension Z · Krisen- & Transformationsresilienz 2035',
    inverted: false,
    text: 'Ich nutze Künstliche Intelligenz (KI) und digitale Tools bereits aktiv, um meine Arbeit oder mein Lernen deutlich effizienter zu machen.',
  },
  {
    id: 8,
    dimension: 'Z',
    dimensionLabel: 'Dimension Z · Krisen- & Transformationsresilienz 2035',
    inverted: false,
    text: 'Mein angestrebter oder aktueller Beruf lässt sich kaum durch Automatisierung ersetzen – oder ich gehöre zu denen, die KI-Systeme steuern und entwickeln.',
  },
  {
    id: 9,
    dimension: 'Z',
    dimensionLabel: 'Dimension Z · Krisen- & Transformationsresilienz 2035',
    inverted: false,
    text: 'Ich kann mich extrem schnell in neue Technologien einarbeiten und sehe berufliche Umbrüche eher als Chance denn als Bedrohung.',
  },
  {
    id: 10,
    dimension: 'Z',
    dimensionLabel: 'Dimension Z · Krisen- & Transformationsresilienz 2035',
    inverted: true,
    text: 'Bei einem plötzlichen wirtschaftlichen Abschwung oder technologischen Umbruch hätte ich große Sorge, sozial abzurutschen.',
  },
];

export interface IdealCoord {
  x: number;
  y: number;
  z: number;
}

export const MILIEU_IDEAL_COORDS: Record<MilieuId, IdealCoord> = {
  avantgarde: { x: 88, y: 88, z: 92 },
  konservativ: { x: 22, y: 85, z: 58 },
  digital_adaptiv: { x: 75, y: 60, z: 80 },
  erodierte_mitte: { x: 48, y: 48, z: 32 },
  senioren: { x: 18, y: 42, z: 22 },
  prekariat: { x: 35, y: 15, z: 12 },
};

export interface MilieuMatchEntry {
  milieu: MilieuSpec;
  distance: number;
  weight: number;
  rawPercent: number;
  percent: number;
}

export interface SelfTestResult {
  uX: number;
  uY: number;
  uZ: number;
  uXRounded: number;
  uYRounded: number;
  uZRounded: number;
  ranked: MilieuMatchEntry[];
  topMatch: MilieuMatchEntry;
  explanation: string;
}

export const DEFAULT_SECOND_SENTENCES: Record<MilieuId, string> = {
  avantgarde:
    'Damit erfüllst du die typischen Kriterien des Leitmilieus 2035, das technologischen Wandel und Klimatransformation aktiv gestaltet und davon profitiert.',
  konservativ:
    'Finanzielle Stabilität und Bewahrung prägen dein Profil, wodurch du gegen Krisen gut gepuffert bist, schnellem kulturell-technischem Umbruch aber eher skeptisch begegnest.',
  digital_adaptiv:
    'Durch hohe digitale Lernbereitschaft und solide Qualifikation gehörst du zu den dynamischen Aufsteigern, die vom KI-Strukturwandel profitieren.',
  erodierte_mitte:
    'Dein Profil spiegelt die typische Spannungslage der verunsicherten Arbeitnehmer in der Mitte wider, die zwischen Modernisierungsanspruch, steigenden Lebenshaltungskosten und Abstiegssorgen balanciert.',
  senioren:
    'Beständigkeit und soziale Absicherung stehen für dich im Vordergrund, während rasante digitale und ökonomische Umbrüche eher als Belastung erlebt werden.',
  prekariat:
    'Steigende Alltagskosten bei begrenzten Schutzpuffern führen dazu, dass strukturelle Transformationskosten im Modell überproportional stark durchschlagen.',
};

function buildTwoSentenceExplanation(
  top: MilieuSpec,
  uX: number,
  uY: number,
  uZ: number,
  secondSentences: Record<MilieuId, string> = DEFAULT_SECOND_SENTENCES,
): string {
  const xDesc =
    uX >= 65
      ? `stark transformativen, öko-digitalen Werteorientierung (X: ${uX} %)`
      : uX <= 35
        ? `traditions- und sicherheitsorientierten Grundhaltung (X: ${uX} %)`
        : `ausgewogenen, modernisierungsbereiten Wertehaltung (X: ${uX} %)`;

  const yDesc =
    uY >= 68
      ? `hohen Bildungs- und Ressourcenlage (Y: ${uY} %)`
      : uY <= 34
        ? `angespannten materiellen Ressourcenlage (Y: ${uY} %)`
        : `mittleren sozialen Ausgangslage (Y: ${uY} %)`;

  const zDesc =
    uZ >= 68
      ? `überdurchschnittlichen Krisen- und KI-Resilienz (Z: ${uZ} %)`
      : uZ <= 34
        ? `spürbaren Verwundbarkeit gegenüber ökonomischen und digitalen Umbrüchen (Z: ${uZ} %)`
        : `moderaten Anpassungsfähigkeit an den Strukturwandel (Z: ${uZ} %)`;

  return `Deine Kombination aus einer ${xDesc}, einer ${yDesc} und einer ${zDesc} liegt im 3D-Raum am nächsten beim Profil „${top.name}“. ${secondSentences[top.id] ?? DEFAULT_SECOND_SENTENCES[top.id]}`;
}

export interface SelfTestOverrides {
  questions?: SelfTestQuestion[];
  milieus?: MilieuSpec[];
  idealCoords?: Record<MilieuId, IdealCoord>;
  secondSentences?: Record<MilieuId, string>;
}

export function calculateSelfTestResult(
  answers: Record<number, number>,
  overrides?: SelfTestOverrides,
): SelfTestResult {
  const activeQuestions = overrides?.questions ?? SELF_TEST_QUESTIONS;
  const activeMilieus = overrides?.milieus ?? MILIEUS;
  const activeIdealCoords = overrides?.idealCoords ?? MILIEU_IDEAL_COORDS;
  const activeSecondSentences =
    overrides?.secondSentences ?? DEFAULT_SECOND_SENTENCES;

  let sumX = 0;
  let sumY = 0;
  let sumZ = 0;
  let countX = 0;
  let countY = 0;
  let countZ = 0;

  for (const q of activeQuestions) {
    const raw = answers[q.id] ?? 3;
    const clamped = Math.min(5, Math.max(1, Math.round(raw)));
    const score = q.inverted ? 6 - clamped : clamped;
    if (q.dimension === 'X') {
      sumX += score;
      countX += 1;
    } else if (q.dimension === 'Y') {
      sumY += score;
      countY += 1;
    } else {
      sumZ += score;
      countZ += 1;
    }
  }

  // Exact normalization to 0..100 (default: 3 questions X, 3 Y, 4 Z -> /12, /12, /16)
  const uX = countX > 0 ? ((sumX - countX) / (countX * 4)) * 100 : 50;
  const uY = countY > 0 ? ((sumY - countY) / (countY * 4)) * 100 : 50;
  const uZ = countZ > 0 ? ((sumZ - countZ) / (countZ * 4)) * 100 : 50;

  const entries = activeMilieus.map((milieu) => {
    const ideal = activeIdealCoords[milieu.id] ?? MILIEU_IDEAL_COORDS[milieu.id];
    const distance = Math.sqrt(
      Math.pow(uX - ideal.x, 2) +
        Math.pow(uY - ideal.y, 2) +
        Math.pow(uZ - ideal.z, 2),
    );
    const weight = 1 / Math.pow(distance + 1, 2.5);
    return {
      milieu,
      distance,
      weight,
      rawPercent: 0,
      percent: 0,
    };
  });

  const totalWeight = entries.reduce((acc, item) => acc + item.weight, 0);

  // Raw percentages + Largest-Remainder Method (Hamilton) for guaranteed 100% sum
  const floors = entries.map((item) => {
    item.rawPercent = (item.weight / totalWeight) * 100;
    return Math.floor(item.rawPercent);
  });

  const remainders = entries.map((item, idx) => ({
    idx,
    remainder: item.rawPercent - floors[idx],
    weight: item.weight,
  }));

  remainders.sort(
    (a, b) => b.remainder - a.remainder || b.weight - a.weight,
  );

  const floorSum = floors.reduce((a, b) => a + b, 0);
  const missing = 100 - floorSum;
  for (let i = 0; i < missing; i++) {
    floors[remainders[i].idx] += 1;
  }

  entries.forEach((item, idx) => {
    item.percent = floors[idx];
  });

  const ranked = [...entries].sort(
    (a, b) =>
      b.percent - a.percent ||
      b.rawPercent - a.rawPercent ||
      a.distance - b.distance,
  );

  const uXRounded = Math.round(uX);
  const uYRounded = Math.round(uY);
  const uZRounded = Math.round(uZ);
  const topMatch = ranked[0];

  return {
    uX,
    uY,
    uZ,
    uXRounded,
    uYRounded,
    uZRounded,
    ranked,
    topMatch,
    explanation: buildTwoSentenceExplanation(
      topMatch.milieu,
      uXRounded,
      uYRounded,
      uZRounded,
      activeSecondSentences,
    ),
  };
}
