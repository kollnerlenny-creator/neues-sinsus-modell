import {
  AXIS_LABELS,
  CLASSIC_MILIEUS_2026,
  COMPARISON_ROWS,
  MILIEUS,
  RIFT_LINES,
  TRANSFORMATION_ARGUMENTS,
  type AxisLabelSpec,
  type ClassicMilieu2026Spec,
  type ComparisonRow,
  type MilieuId,
  type MilieuSpec,
  type RiftLineSpec,
  type ShapeVariant,
  type TransformationArgument,
} from './milieus';

export type ContentSectionId =
  | 'meta'
  | 'milieus_2035'
  | 'milieus_2026'
  | 'axes_rifts'
  | 'transformation'
  | 'distribution'
  | 'self_test';

export const CONTENT_SECTION_IDS: readonly ContentSectionId[] = [
  'meta',
  'milieus_2035',
  'milieus_2026',
  'axes_rifts',
  'transformation',
  'distribution',
  'self_test',
] as const;

export const VALID_MILIEU_ID_LIST: readonly MilieuId[] = [
  'avantgarde',
  'konservativ',
  'digital_adaptiv',
  'erodierte_mitte',
  'senioren',
  'prekariat',
] as const;

export interface NavLinkItem {
  href: string;
  label: string;
}

export interface HeroShiftItem {
  metric: string;
  title: string;
  detail: string;
  accent: string;
}

export interface SiteMetaSection {
  sectionId: 'meta';
  navBrand: string;
  navLinks: NavLinkItem[];
  navCtaLabel: string;
  footerLeft: string;
  footerRight: string;
  heroEyebrow: string;
  heroHeadline: string;
  heroLead: string;
  heroExploreBtn: string;
  heroSelftestBtn: string;
  heroShiftsBarTitle: string;
  heroShiftsBarTag: string;
  heroScrollCue: string;
  heroShifts: HeroShiftItem[];
  stageEyebrow: string;
  stageHeadline: string;
  stageDescription: string;
  stageMode2026Label: string;
  stageMode2035Label: string;
  stageAxisKeyX: string;
  stageAxisKeyY: string;
  stageAxisKeyZ: string;
  gridEyebrow: string;
  gridHeadline: string;
  gridDescription: string;
}

export interface Milieus2035Section {
  sectionId: 'milieus_2035';
  milieus: MilieuSpec[];
}

export interface Milieus2026Section {
  sectionId: 'milieus_2026';
  classicMilieus: ClassicMilieu2026Spec[];
}

export interface AxesRiftsSection {
  sectionId: 'axes_rifts';
  axisLabels: AxisLabelSpec[];
  riftLines: RiftLineSpec[];
}

export interface CalculationStepItem {
  number: string;
  color: string;
  title: string;
  delta: string;
  summary: string;
}

export interface TransformationSectionData {
  sectionId: 'transformation';
  eyebrow: string;
  headline: string;
  description: string;
  arguments: TransformationArgument[];
  calcEyebrow: string;
  calcHeadline: string;
  calcSteps: CalculationStepItem[];
  compHeadline: string;
  compDescription: string;
  comparisonRows: ComparisonRow[];
}

export interface CausalSubGroupItem {
  milieuId: MilieuId;
  name: string;
  share: string;
  color: string;
  text: string;
}

export interface EditableCausalShift {
  number: string;
  tag: string;
  question: string;
  transition: string;
  delta: string;
  trend: 'up' | 'down' | 'merge';
  accentColor: string;
  baseline2026?: string;
  developmentLabel?: string;
  development2035?: string;
  subGroups?: CausalSubGroupItem[];
}

export interface DistributionSectionData {
  sectionId: 'distribution';
  eyebrow: string;
  headline: string;
  description: string;
  ledgerFooterLabel: string;
  causalShifts: EditableCausalShift[];
}

export interface EditableScaleOption {
  value: 1 | 2 | 3 | 4 | 5;
  label: string;
  shortLabel: string;
}

export interface EditableSelfTestQuestion {
  id: number;
  dimension: 'X' | 'Y' | 'Z';
  dimensionLabel: string;
  inverted: boolean;
  text: string;
}

export interface IdealCoordSpec {
  x: number;
  y: number;
  z: number;
}

export interface SelfTestSectionData {
  sectionId: 'self_test';
  eyebrow: string;
  headline: string;
  description: string;
  scaleOptions: EditableScaleOption[];
  questions: EditableSelfTestQuestion[];
  idealCoords: Record<MilieuId, IdealCoordSpec>;
  secondSentences: Record<MilieuId, string>;
}

export interface SiteContentState {
  meta: SiteMetaSection;
  milieus_2035: Milieus2035Section;
  milieus_2026: Milieus2026Section;
  axes_rifts: AxesRiftsSection;
  transformation: TransformationSectionData;
  distribution: DistributionSectionData;
  self_test: SelfTestSectionData;
}

const DEFAULT_META: SiteMetaSection = {
  sectionId: 'meta',
  navBrand: 'SINUS 2035',
  navLinks: [
    { href: '#modell-3d', label: '3D-Modell' },
    { href: '#milieus-detail', label: 'Die 6 Milieus' },
    { href: '#transformation', label: 'Transformation' },
    { href: '#verteilung', label: 'Verteilung' },
    { href: '#selbsttest', label: 'Selbsttest' },
  ],
  navCtaLabel: 'Selbsttest starten',
  footerLeft: 'SOZIALSTRUKTUR DEUTSCHLAND 2035 · Das schwebende 3D-SINUS-Modell',
  footerRight: 'Gemeinschaftskunde / GRW · Klasse 12',
  heroEyebrow: 'Sozialstruktur Deutschland · Zukunftsstudie 2026 → 2035',
  heroHeadline: 'Wohin driftet unsere Gesellschaft bis 2035?',
  heroLead:
    'Zehn vertraute Lebenswelten lösen sich auf. KI-Automatisierung, Klimakosten und der Renteneintritt der Babyboomer spalten das Land in sechs schwebende Ebenen der Zukunftsfähigkeit.',
  heroExploreBtn: '3D-Modell entdecken',
  heroSelftestBtn: 'Eigenen Standort testen',
  heroShiftsBarTitle: 'Drei Strukturverschiebungen bis 2035',
  heroShiftsBarTag: 'SINUS-Raum · X × Y × Z',
  heroScrollCue: 'Nach unten scrollen für das interaktive 3D-Modell',
  heroShifts: [
    {
      metric: '10 → 6 Milieus',
      title: 'Verdichtung der Lebenswelten',
      detail:
        'Aus zehn vielfältigen Alltagsstilen entstehen sechs scharf abgegrenzte Strukturblöcke.',
      accent: '#f7f8f8',
    },
    {
      metric: 'Z-Achse · 0–100',
      title: 'Neue Höhe: Krisenresilienz',
      detail:
        'Bildung, Eigentum und KI-Kompetenz bestimmen, welches Milieu 2035 schwebt oder absinkt.',
      accent: '#34d399',
    },
    {
      metric: '24 % Senioren',
      title: 'Demografischer Kipp-Punkt',
      detail:
        'Mit den Babyboomern wird die traditionelle Senioren-Mehrheit zur größten Gruppe im Land.',
      accent: '#a78bfa',
    },
  ],
  stageEyebrow: '01 · Interaktives Raummodell · 2026 vs. 2035',
  stageHeadline: 'Das schwebende 3D-SINUS-Modell',
  stageDescription:
    'Drehe den sozialen Raum frei um alle Achsen und vergleiche die 10 klassischen Lebenswelten 2026 mit 6 Zukunfts-Blöcken 2035.',
  stageMode2026Label: '2026: Klassisch (10 Milieus)',
  stageMode2035Label: '2035: Schwebend 3D (6 Milieus)',
  stageAxisKeyX: 'Tradition ↔ Neuorientierung (Öko/Tech)',
  stageAxisKeyY: 'Untere Schicht ↔ Oberschicht',
  stageAxisKeyZ: 'Resilienz & Schutzhöhe (0–100)',
  gridEyebrow: '02 · Strukturprofil 2035 · Sechs verdichtete Lebenswelten',
  gridHeadline: 'Die 6 Milieus im Detail',
  gridDescription:
    'Kompakte Übersicht aller sechs Zukunfts-Blöcke nach Bevölkerungsanteil und Krisenresilienz – vertiefende Profile lassen sich gezielt einblenden.',
};

const DEFAULT_AXIS_LABELS: AxisLabelSpec[] = AXIS_LABELS.map((item) => ({
  ...item,
  worldPos: { ...item.worldPos },
}));

// Match exact 3D placard defaults used by SinusSceneManager
DEFAULT_AXIS_LABELS[0] = {
  ...DEFAULT_AXIS_LABELS[0],
  text: '← Tradition & Bewahrung',
  subtext: 'Sicherheit · Bestand',
  worldPos: { x: -6.6, y: 1.22, z: 7.95 },
};
DEFAULT_AXIS_LABELS[1] = {
  ...DEFAULT_AXIS_LABELS[1],
  text: 'X · Grundorientierung',
  subtext: 'Werteachse',
  worldPos: { x: 0.0, y: 1.22, z: 8.05 },
};
DEFAULT_AXIS_LABELS[2] = {
  ...DEFAULT_AXIS_LABELS[2],
  text: 'Neuorientierung · Öko/Tech →',
  subtext: 'Transformation',
  worldPos: { x: 6.6, y: 1.22, z: 7.95 },
};
DEFAULT_AXIS_LABELS[3] = {
  ...DEFAULT_AXIS_LABELS[3],
  text: 'Untere Schicht',
  subtext: 'Geringe Ressourcen',
  worldPos: { x: -10.35, y: 1.22, z: 5.1 },
};
DEFAULT_AXIS_LABELS[4] = {
  ...DEFAULT_AXIS_LABELS[4],
  text: 'Y · Soziale Lage',
  subtext: 'Mittlere Schicht',
  worldPos: { x: -10.35, y: 1.22, z: 0.0 },
};
DEFAULT_AXIS_LABELS[5] = {
  ...DEFAULT_AXIS_LABELS[5],
  text: 'Oberschicht',
  subtext: 'Wohlstand · Bildung',
  worldPos: { x: -10.35, y: 1.22, z: -5.1 },
};
DEFAULT_AXIS_LABELS[6] = {
  ...DEFAULT_AXIS_LABELS[6],
  text: 'Z · Resilienz 2035',
  subtext: 'Schutzhöhe 0–100',
  worldPos: { x: 9.2, y: 8.5, z: -5.8 },
};

const DEFAULT_TRANSFORMATION: TransformationSectionData = {
  sectionId: 'transformation',
  eyebrow: '03 · Soziologische Analyse · Strukturwandel 2026 → 2035',
  headline: 'Vom 2D-Überlappungsmodell zur schwebenden 3D-Polarisierung',
  description:
    'Warum sich die zehn Lebenswelten der Gegenwart bis 2035 durch KI, Klimakosten und Demografie zu sechs scharf getrennten Strukturblöcken verdichten.',
  arguments: TRANSFORMATION_ARGUMENTS.map((a) => ({ ...a })),
  calcEyebrow: 'Quantitative Herleitung · Bevölkerungsanteile',
  calcHeadline: 'Rechenweg & Begründung: Wie entstehen die Prozentwerte 2035?',
  calcSteps: [
    {
      number: '01',
      color: '#8b5cf6',
      title: 'Demografischer Faktor',
      delta: '16 % → 24 %',
      summary:
        'Senioren-Mehrheit wächst von 16 % auf 24 % durch den vollständigen Renteneintritt der Babyboomer.',
    },
    {
      number: '02',
      color: '#f59e0b',
      title: 'KI-Polarisierung',
      delta: '20 % → 15 %',
      summary:
        'Erodierte Mitte schrumpft von 20 % auf 15 % durch KI-Automatisierung in Büro- und Routineberufen.',
    },
    {
      number: '03',
      color: '#ef4444',
      title: 'Transformationskosten',
      delta: '13 % → 16 %',
      summary:
        'Abgehängtes Prekariat wächst von 13 % auf 16 % infolge von Wohn-, Energie- und CO₂-Kosten.',
    },
    {
      number: '04',
      color: '#10b981',
      title: 'Bündelung der Eliten & Aufsteiger',
      delta: '16 % · 15 % · 14 %',
      summary:
        'Tech-Öko Avantgarde 16 %, Digital-Adaptives Milieu 15 %, Konservativ-Etablierte 14 % – Gesamtsumme = 100 %.',
    },
  ],
  compHeadline: 'Systemvergleich: SINUS 2026 vs. Transformation 2035',
  compDescription:
    'Wie sich Raumdimensionen, Milieuzahl und soziale Durchlässigkeit in neun Jahren verschieben',
  comparisonRows: COMPARISON_ROWS.map((r) => ({ ...r })),
};

const DEFAULT_DISTRIBUTION: DistributionSectionData = {
  sectionId: 'distribution',
  eyebrow: '04 · Mathematische & Soziologische Logik · Kausalketten 2026 → 2035',
  headline: 'Wie kommt die Prozentverteilung 2035 zustande?',
  description:
    'Im SINUS-Modell 2026 verteilen sich 10 Milieus relativ gleichmäßig (8–12 %). Bis 2035 verschieben Demografie, KI-Automatisierung und Klimakosten die Gewichte zu sechs klar abgegrenzten Blöcken.',
  ledgerFooterLabel: 'Struktur-Bilanz der 6 Zukunfts-Milieus 2035',
  causalShifts: [
    {
      number: '01',
      tag: 'Demografischer Faktor',
      question: 'Warum wächst die „Traditionelle Senioren-Mehrheit“ auf 24 %?',
      transition: '16 % → 24 %',
      delta: '+8 %',
      trend: 'up',
      accentColor: '#8b5cf6',
      baseline2026:
        'Traditionelles Milieu (9 %) + ältere Teile der Nostalgisch-Bürgerlichen (ca. 7 %) = 16 %.',
      developmentLabel: 'Entwicklung bis 2035 (+8 %)',
      development2035:
        'Laut der 15. koordinierten Bevölkerungsvorausberechnung des Statistischen Bundesamtes gehen bis 2035 die geburtenstarken Babyboomer-Jahrgänge (1955–1969) vollständig in Rente. Der Anteil der über 65-Jährigen steigt massiv an. Da ältere Kohorten statistisch deutlich stärker an Sicherheit und Bewahrung orientiert sind, wächst dieses Milieu auf 24 % – fast ein Viertel der Gesamtbevölkerung.',
    },
    {
      number: '02',
      tag: 'KI- & Polarisierungseffekt',
      question: 'Warum schrumpft die „Erodierte Mitte“ auf 15 %?',
      transition: '20 % → 15 %',
      delta: '−5 %',
      trend: 'down',
      accentColor: '#f59e0b',
      baseline2026:
        'Adaptiv-Pragmatische Mitte (12 %) + jüngere Nostalgisch-Bürgerliche (4 %) + Teile der Konsum-Hedonisten (4 %) = 20 %.',
      developmentLabel: 'Entwicklung bis 2035 (−5 %)',
      development2035:
        'Die klassische Mitte spaltet sich in zwei Richtungen auf: Wer digitale Kompetenzen erwirbt, steigt nach oben in das Digital-Adaptive Leistungs-Milieu auf. Wer jedoch in klassischen Verwaltungs-, Sachbearbeiter- oder Routineberufen arbeitet, die bis 2035 weitgehend durch KI-Systeme automatisiert werden, rutscht durch Reallohnverluste nach unten ins Prekariat ab. Übrig bleibt ein verunsicherter Kern von 15 %.',
    },
    {
      number: '03',
      tag: 'Transformationskosten',
      question: 'Warum wächst das „Abgehängte Digital- & Klima-Prekariat“ auf 16 %?',
      transition: '13 % → 16 %',
      delta: '+3 %',
      trend: 'up',
      accentColor: '#ef4444',
      baseline2026:
        'Prekäres Milieu (9 %) + untere Teile der Konsum-Hedonisten (4 %) = 13 %.',
      developmentLabel: 'Entwicklung bis 2035 (+3 %)',
      development2035:
        'Steigende Wohn- und Energiekosten (CO₂-Bepreisung bei unsanierten Mietwohnungen) sowie der Wegfall einfacher Tätigkeiten führen zu sozialem Abstieg aus der unteren Mitte. Dadurch wächst das Prekariat auf 16 % an.',
    },
    {
      number: '04',
      tag: 'Bündelung der Eliten & Aufsteiger',
      question:
        'Warum verschmelzen die oberen & modernen Milieus zu 16 %, 15 % und 14 %?',
      transition: '16 % + 15 % + 14 %',
      delta: '45 % gesamt',
      trend: 'merge',
      accentColor: '#10b981',
      subGroups: [
        {
          milieuId: 'avantgarde',
          name: 'Tech-Ökologische Avantgarde',
          share: '16 %',
          color: '#10b981',
          text: 'Entsteht aus der Verschmelzung des Postmateriellen (12 %), Neo-Ökologischen (8 %) und Teilen des Expeditiven Milieus (10 %). Da ein Teil dieser Gruppen durch hohe Lebenshaltungskosten oder traditionellere Orientierung im Alter in andere Segmente wandert, bündelt sich die hochgebildete, klimaresiliente Elite bei 16 %.',
        },
        {
          milieuId: 'digital_adaptiv',
          name: 'Digital-Adaptives Leistungs-Milieu',
          share: '15 %',
          color: '#06b6d4',
          text: 'Setzt sich aus dem Milieu der Performer (10 %) und rund 5 % digitalen Aufsteigern aus der ehemaligen Mitte zusammen.',
        },
        {
          milieuId: 'konservativ',
          name: 'Konservativ-Etablierte Besitzstandswahrer',
          share: '14 %',
          color: '#3b82f6',
          text: 'Bildet sich aus dem Konservativ-Gehobenen Milieu (11 %) sowie wohlhabenden, aber veränderungsskeptischen Teilen der Performer (3 %).',
        },
      ],
    },
  ],
};

const DEFAULT_SELF_TEST: SelfTestSectionData = {
  sectionId: 'self_test',
  eyebrow: '05 · Interaktive Standortbestimmung & Klassen-Umfrage',
  headline: 'Milieu-Selbsttest 2035: Wo stehst du in 10 Jahren?',
  description:
    'Bestimme deinen eigenen Standort im 3D-Raum oder starte eine Live-Umfrage per QR-Code für den ganzen Kurs.',
  scaleOptions: [
    { value: 1, label: 'Stimme gar nicht zu', shortLabel: 'Gar nicht' },
    { value: 2, label: 'Stimme eher nicht zu', shortLabel: 'Eher nicht' },
    { value: 3, label: 'Teils / teils', shortLabel: 'Teils / teils' },
    { value: 4, label: 'Stimme eher zu', shortLabel: 'Eher zu' },
    { value: 5, label: 'Stimme voll zu', shortLabel: 'Voll zu' },
  ],
  questions: [
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
  ],
  idealCoords: {
    avantgarde: { x: 88, y: 88, z: 92 },
    konservativ: { x: 22, y: 85, z: 58 },
    digital_adaptiv: { x: 75, y: 60, z: 80 },
    erodierte_mitte: { x: 48, y: 48, z: 32 },
    senioren: { x: 18, y: 42, z: 22 },
    prekariat: { x: 35, y: 15, z: 12 },
  },
  secondSentences: {
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
  },
};

export function createDefaultSiteContent(): SiteContentState {
  return {
    meta: structuredClone(DEFAULT_META),
    milieus_2035: {
      sectionId: 'milieus_2035',
      milieus: structuredClone(MILIEUS),
    },
    milieus_2026: {
      sectionId: 'milieus_2026',
      classicMilieus: structuredClone(CLASSIC_MILIEUS_2026),
    },
    axes_rifts: {
      sectionId: 'axes_rifts',
      axisLabels: structuredClone(DEFAULT_AXIS_LABELS),
      riftLines: structuredClone(RIFT_LINES),
    },
    transformation: structuredClone(DEFAULT_TRANSFORMATION),
    distribution: structuredClone(DEFAULT_DISTRIBUTION),
    self_test: structuredClone(DEFAULT_SELF_TEST),
  };
}

export const DEFAULT_SITE_CONTENT: SiteContentState = createDefaultSiteContent();

// ---------------------------------------------------------------------------
// Defensive Sanitization & Payload Bounding (aligned with firebase-blueprint)
// ---------------------------------------------------------------------------
function clampStr(val: unknown, fallback: string, maxLen: number): string {
  const s = typeof val === 'string' ? val.trim() : '';
  return (s.length > 0 ? s : fallback).slice(0, maxLen);
}

function clampOptionalStr(val: unknown, maxLen: number): string | undefined {
  if (typeof val !== 'string') return undefined;
  const s = val.trim().slice(0, maxLen);
  return s.length > 0 ? s : undefined;
}

function clampNum(val: unknown, fallback: number, min: number, max: number): number {
  const n = typeof val === 'number' ? val : Number(val);
  if (!Number.isFinite(n)) return fallback;
  return Math.round(Math.min(max, Math.max(min, n)) * 100) / 100;
}

function clampColor(val: unknown, fallback: string): string {
  if (typeof val === 'string' && /^#[0-9a-fA-F]{6}$/.test(val.trim())) {
    return val.trim().toLowerCase();
  }
  return fallback;
}

function clampAnchorHref(val: unknown, fallback: string): string {
  if (typeof val === 'string' && /^#[a-z0-9-]+$/.test(val.trim())) {
    return val.trim().slice(0, 60);
  }
  return fallback;
}

const VALID_SHAPES = new Set<ShapeVariant>([
  'tower_triangle',
  'block_rectangle',
  'slender_pillar',
  'fractured_shards',
  'broad_plateau',
  'flat_slab',
]);

export function sanitizeSectionData<K extends ContentSectionId>(
  sectionId: K,
  raw: SiteContentState[K],
): SiteContentState[K] {
  const defaults = createDefaultSiteContent();

  switch (sectionId) {
    case 'meta': {
      const d = defaults.meta;
      const input = raw as SiteMetaSection;
      const sanitized: SiteMetaSection = {
        sectionId: 'meta',
        navBrand: clampStr(input.navBrand, d.navBrand, 60),
        navLinks: (Array.isArray(input.navLinks) && input.navLinks.length > 0
          ? input.navLinks
          : d.navLinks
        )
          .slice(0, 8)
          .map((link, idx) => {
            const def = d.navLinks[idx] ?? d.navLinks[0];
            return {
              href: clampAnchorHref(link?.href, def.href),
              label: clampStr(link?.label, def.label, 60),
            };
          }),
        navCtaLabel: clampStr(input.navCtaLabel, d.navCtaLabel, 60),
        footerLeft: clampStr(input.footerLeft, d.footerLeft, 180),
        footerRight: clampStr(input.footerRight, d.footerRight, 180),
        heroEyebrow: clampStr(input.heroEyebrow, d.heroEyebrow, 180),
        heroHeadline: clampStr(input.heroHeadline, d.heroHeadline, 240),
        heroLead: clampStr(input.heroLead, d.heroLead, 600),
        heroExploreBtn: clampStr(input.heroExploreBtn, d.heroExploreBtn, 80),
        heroSelftestBtn: clampStr(input.heroSelftestBtn, d.heroSelftestBtn, 80),
        heroShiftsBarTitle: clampStr(input.heroShiftsBarTitle, d.heroShiftsBarTitle, 140),
        heroShiftsBarTag: clampStr(input.heroShiftsBarTag, d.heroShiftsBarTag, 80),
        heroScrollCue: clampStr(input.heroScrollCue, d.heroScrollCue, 140),
        heroShifts: (Array.isArray(input.heroShifts) && input.heroShifts.length > 0
          ? input.heroShifts
          : d.heroShifts
        )
          .slice(0, 6)
          .map((item, idx) => {
            const def = d.heroShifts[idx] ?? d.heroShifts[0];
            return {
              metric: clampStr(item?.metric, def.metric, 60),
              title: clampStr(item?.title, def.title, 120),
              detail: clampStr(item?.detail, def.detail, 300),
              accent: clampColor(item?.accent, def.accent),
            };
          }),
        stageEyebrow: clampStr(input.stageEyebrow, d.stageEyebrow, 180),
        stageHeadline: clampStr(input.stageHeadline, d.stageHeadline, 240),
        stageDescription: clampStr(input.stageDescription, d.stageDescription, 600),
        stageMode2026Label: clampStr(input.stageMode2026Label, d.stageMode2026Label, 80),
        stageMode2035Label: clampStr(input.stageMode2035Label, d.stageMode2035Label, 80),
        stageAxisKeyX: clampStr(input.stageAxisKeyX, d.stageAxisKeyX, 140),
        stageAxisKeyY: clampStr(input.stageAxisKeyY, d.stageAxisKeyY, 140),
        stageAxisKeyZ: clampStr(input.stageAxisKeyZ, d.stageAxisKeyZ, 140),
        gridEyebrow: clampStr(input.gridEyebrow, d.gridEyebrow, 180),
        gridHeadline: clampStr(input.gridHeadline, d.gridHeadline, 240),
        gridDescription: clampStr(input.gridDescription, d.gridDescription, 600),
      };
      return sanitized as SiteContentState[K];
    }

    case 'milieus_2035': {
      const defList = defaults.milieus_2035.milieus;
      const input = raw as Milieus2035Section;
      const list = defList.map((def) => {
        const found = Array.isArray(input.milieus)
          ? input.milieus.find((m) => m?.id === def.id)
          : undefined;
        const src = found ?? def;
        return {
          id: def.id,
          name: clampStr(src.name, def.name, 160),
          shortName: clampStr(src.shortName, def.shortName, 80),
          badge2035: clampStr(src.badge2035, def.badge2035, 80),
          colorHex: clampColor(src.colorHex, def.colorHex),
          emissiveHex: clampColor(src.emissiveHex, def.emissiveHex),
          share2035: clampNum(src.share2035, def.share2035, 0, 100),
          share2026: clampNum(src.share2026, def.share2026, 0, 100),
          pos2035: {
            x: clampNum(src.pos2035?.x, def.pos2035.x, -10, 10),
            z: clampNum(src.pos2035?.z, def.pos2035.z, -8, 8),
          },
          pos2026: {
            x: clampNum(src.pos2026?.x, def.pos2026.x, -10, 10),
            z: clampNum(src.pos2026?.z, def.pos2026.z, -8, 8),
          },
          elevation2035: clampNum(src.elevation2035, def.elevation2035, 0.2, 8.5),
          scale2035: clampNum(src.scale2035, def.scale2035, 0.5, 1.8),
          footprintRadius: clampNum(src.footprintRadius, def.footprintRadius, 0.8, 4.2),
          shapeVariant: VALID_SHAPES.has(src.shapeVariant)
            ? src.shapeVariant
            : def.shapeVariant,
          socialLayerLabel: clampStr(src.socialLayerLabel, def.socialLayerLabel, 180),
          valueOrientationLabel: clampStr(
            src.valueOrientationLabel,
            def.valueOrientationLabel,
            180,
          ),
          resilienceScore: Math.round(
            clampNum(src.resilienceScore, def.resilienceScore, 0, 100),
          ),
          resilienceRatingLabel: clampStr(
            src.resilienceRatingLabel,
            def.resilienceRatingLabel,
            80,
          ),
          originFrom2026: clampStr(src.originFrom2026, def.originFrom2026, 400),
          causalChainSummary: clampStr(
            src.causalChainSummary,
            def.causalChainSummary,
            600,
          ),
          detailedProfile: clampStr(src.detailedProfile, def.detailedProfile, 1200),
          resilienceMechanism: clampStr(
            src.resilienceMechanism,
            def.resilienceMechanism,
            1200,
          ),
          everydayExamples: clampStr(src.everydayExamples, def.everydayExamples, 600),
          causalChain: (Array.isArray(src.causalChain) && src.causalChain.length > 0
            ? src.causalChain
            : def.causalChain
          )
            .slice(0, 6)
            .map((step, i) => clampStr(step, def.causalChain[i] ?? 'Schritt', 400)),
          keyDrivers: (Array.isArray(src.keyDrivers) && src.keyDrivers.length > 0
            ? src.keyDrivers
            : def.keyDrivers
          )
            .slice(0, 6)
            .map((drv, i) => clampStr(drv, def.keyDrivers[i] ?? 'Treiber', 200)),
          conflictLine: clampStr(src.conflictLine, def.conflictLine, 500),
        };
      });
      return {
        sectionId: 'milieus_2035',
        milieus: list,
      } as SiteContentState[K];
    }

    case 'milieus_2026': {
      const defList = defaults.milieus_2026.classicMilieus;
      const input = raw as Milieus2026Section;
      const list = defList.map((def) => {
        const found = Array.isArray(input.classicMilieus)
          ? input.classicMilieus.find((m) => m?.id === def.id)
          : undefined;
        const src = found ?? def;
        return {
          id: def.id,
          name: clampStr(src.name, def.name, 160),
          shortName: clampStr(src.shortName, def.shortName, 80),
          share2026: clampNum(src.share2026, def.share2026, 0, 100),
          colorHex: clampColor(src.colorHex, def.colorHex),
          pos: {
            x: clampNum(src.pos?.x, def.pos.x, -10, 10),
            z: clampNum(src.pos?.z, def.pos.z, -8, 8),
          },
          radiusX: clampNum(src.radiusX, def.radiusX, 0.8, 5),
          radiusZ: clampNum(src.radiusZ, def.radiusZ, 0.8, 5),
          rotationY: clampNum(src.rotationY, def.rotationY, -3.14, 3.14),
          layerOffset: clampNum(src.layerOffset, def.layerOffset, 0.01, 0.5),
          socialLayer: clampStr(src.socialLayer, def.socialLayer, 140),
          valueOrientation: clampStr(src.valueOrientation, def.valueOrientation, 140),
          description: clampStr(src.description, def.description, 800),
          evolvesInto: clampStr(src.evolvesInto, def.evolvesInto, 500),
        };
      });
      return {
        sectionId: 'milieus_2026',
        classicMilieus: list,
      } as SiteContentState[K];
    }

    case 'axes_rifts': {
      const def = defaults.axes_rifts;
      const input = raw as AxesRiftsSection;
      const axisLabels = (Array.isArray(input.axisLabels) && input.axisLabels.length > 0
        ? input.axisLabels
        : def.axisLabels
      )
        .slice(0, 12)
        .map((ax, idx) => {
          const d = def.axisLabels[idx] ?? def.axisLabels[0];
          const axisVal = ax?.axis === 'X' || ax?.axis === 'Y' || ax?.axis === 'Z' ? ax.axis : d.axis;
          const sub = clampOptionalStr(ax?.subtext, 100);
          return {
            id: clampStr(ax?.id, d.id, 60),
            axis: axisVal,
            text: clampStr(ax?.text, d.text, 120),
            ...(sub ? { subtext: sub } : {}),
            worldPos: {
              x: clampNum(ax?.worldPos?.x, d.worldPos.x, -15, 15),
              y: clampNum(ax?.worldPos?.y, d.worldPos.y, 0, 12),
              z: clampNum(ax?.worldPos?.z, d.worldPos.z, -12, 12),
            },
            accentColor: clampColor(ax?.accentColor, d.accentColor),
          };
        });

      const riftLines = (Array.isArray(input.riftLines) && input.riftLines.length > 0
        ? input.riftLines
        : def.riftLines
      )
        .slice(0, 12)
        .map((r, idx) => {
          const d = def.riftLines[idx] ?? def.riftLines[0];
          const pts =
            Array.isArray(r?.points) && r.points.length >= 2
              ? r.points.slice(0, 12).map((p, pi) => {
                  const dp = d.points[pi] ?? d.points[0];
                  return {
                    x: clampNum(p?.x, dp.x, -12, 12),
                    z: clampNum(p?.z, dp.z, -10, 10),
                  };
                })
              : d.points;
          return {
            id: clampStr(r?.id, d.id, 60),
            label: clampStr(r?.label, d.label, 120),
            points: pts,
          };
        });

      return {
        sectionId: 'axes_rifts',
        axisLabels,
        riftLines,
      } as SiteContentState[K];
    }

    case 'transformation': {
      const def = defaults.transformation;
      const input = raw as TransformationSectionData;
      return {
        sectionId: 'transformation',
        eyebrow: clampStr(input.eyebrow, def.eyebrow, 180),
        headline: clampStr(input.headline, def.headline, 240),
        description: clampStr(input.description, def.description, 600),
        arguments: (Array.isArray(input.arguments) && input.arguments.length > 0
          ? input.arguments
          : def.arguments
        )
          .slice(0, 6)
          .map((arg, idx) => {
            const d = def.arguments[idx] ?? def.arguments[0];
            return {
              number: clampStr(arg?.number, d.number, 16),
              title: clampStr(arg?.title, d.title, 200),
              body: clampStr(arg?.body, d.body, 900),
            };
          }),
        calcEyebrow: clampStr(input.calcEyebrow, def.calcEyebrow, 180),
        calcHeadline: clampStr(input.calcHeadline, def.calcHeadline, 240),
        calcSteps: (Array.isArray(input.calcSteps) && input.calcSteps.length > 0
          ? input.calcSteps
          : def.calcSteps
        )
          .slice(0, 8)
          .map((st, idx) => {
            const d = def.calcSteps[idx] ?? def.calcSteps[0];
            return {
              number: clampStr(st?.number, d.number, 16),
              color: clampColor(st?.color, d.color),
              title: clampStr(st?.title, d.title, 160),
              delta: clampStr(st?.delta, d.delta, 60),
              summary: clampStr(st?.summary, d.summary, 500),
            };
          }),
        compHeadline: clampStr(input.compHeadline, def.compHeadline, 240),
        compDescription: clampStr(input.compDescription, def.compDescription, 400),
        comparisonRows: (Array.isArray(input.comparisonRows) && input.comparisonRows.length > 0
          ? input.comparisonRows
          : def.comparisonRows
        )
          .slice(0, 12)
          .map((row, idx) => {
            const d = def.comparisonRows[idx] ?? def.comparisonRows[0];
            return {
              criterion: clampStr(row?.criterion, d.criterion, 160),
              model2026: clampStr(row?.model2026, d.model2026, 300),
              model2035: clampStr(row?.model2035, d.model2035, 300),
            };
          }),
      } as SiteContentState[K];
    }

    case 'distribution': {
      const def = defaults.distribution;
      const input = raw as DistributionSectionData;
      return {
        sectionId: 'distribution',
        eyebrow: clampStr(input.eyebrow, def.eyebrow, 180),
        headline: clampStr(input.headline, def.headline, 240),
        description: clampStr(input.description, def.description, 600),
        ledgerFooterLabel: clampStr(input.ledgerFooterLabel, def.ledgerFooterLabel, 180),
        causalShifts: (Array.isArray(input.causalShifts) && input.causalShifts.length > 0
          ? input.causalShifts
          : def.causalShifts
        )
          .slice(0, 8)
          .map((sh, idx) => {
            const d = def.causalShifts[idx] ?? def.causalShifts[0];
            const trendVal =
              sh?.trend === 'up' || sh?.trend === 'down' || sh?.trend === 'merge'
                ? sh.trend
                : d.trend;
            const out: EditableCausalShift = {
              number: clampStr(sh?.number, d.number, 16),
              tag: clampStr(sh?.tag, d.tag, 100),
              question: clampStr(sh?.question, d.question, 240),
              transition: clampStr(sh?.transition, d.transition, 80),
              delta: clampStr(sh?.delta, d.delta, 60),
              trend: trendVal,
              accentColor: clampColor(sh?.accentColor, d.accentColor),
            };
            if (Array.isArray(sh?.subGroups) && sh.subGroups.length > 0) {
              out.subGroups = sh.subGroups.slice(0, 6).map((sg, si) => {
                const dsg = d.subGroups?.[si] ?? {
                  milieuId: 'avantgarde' as MilieuId,
                  name: 'Gruppe',
                  share: '15 %',
                  color: '#10b981',
                  text: 'Beschreibung',
                };
                return {
                  milieuId: VALID_MILIEU_ID_LIST.includes(sg?.milieuId)
                    ? sg.milieuId
                    : dsg.milieuId,
                  name: clampStr(sg?.name, dsg.name, 140),
                  share: clampStr(sg?.share, dsg.share, 32),
                  color: clampColor(sg?.color, dsg.color),
                  text: clampStr(sg?.text, dsg.text, 600),
                };
              });
            } else {
              out.baseline2026 = clampStr(
                sh?.baseline2026,
                d.baseline2026 ?? 'Ausgangslage 2026',
                400,
              );
              out.developmentLabel = clampStr(
                sh?.developmentLabel,
                d.developmentLabel ?? 'Entwicklung bis 2035',
                120,
              );
              out.development2035 = clampStr(
                sh?.development2035,
                d.development2035 ?? 'Entwicklung bis 2035',
                900,
              );
            }
            return out;
          }),
      } as SiteContentState[K];
    }

    case 'self_test': {
      const def = defaults.self_test;
      const input = raw as SelfTestSectionData;
      const scaleOptions = def.scaleOptions.map((dOpt, idx) => {
        const src = Array.isArray(input.scaleOptions)
          ? input.scaleOptions[idx] ?? dOpt
          : dOpt;
        return {
          value: dOpt.value,
          label: clampStr(src.label, dOpt.label, 80),
          shortLabel: clampStr(src.shortLabel, dOpt.shortLabel, 40),
        };
      });

      const questions = def.questions.map((dq, idx) => {
        const src = Array.isArray(input.questions)
          ? input.questions[idx] ?? dq
          : dq;
        const dim =
          src.dimension === 'X' || src.dimension === 'Y' || src.dimension === 'Z'
            ? src.dimension
            : dq.dimension;
        return {
          id: dq.id,
          dimension: dim,
          dimensionLabel: clampStr(src.dimensionLabel, dq.dimensionLabel, 120),
          inverted: Boolean(src.inverted),
          text: clampStr(src.text, dq.text, 500),
        };
      });

      const idealCoords = {} as Record<MilieuId, IdealCoordSpec>;
      const secondSentences = {} as Record<MilieuId, string>;
      for (const id of VALID_MILIEU_ID_LIST) {
        const dc = def.idealCoords[id];
        const sc = input.idealCoords?.[id] ?? dc;
        idealCoords[id] = {
          x: Math.round(clampNum(sc.x, dc.x, 0, 100)),
          y: Math.round(clampNum(sc.y, dc.y, 0, 100)),
          z: Math.round(clampNum(sc.z, dc.z, 0, 100)),
        };
        secondSentences[id] = clampStr(
          input.secondSentences?.[id],
          def.secondSentences[id],
          500,
        );
      }

      return {
        sectionId: 'self_test',
        eyebrow: clampStr(input.eyebrow, def.eyebrow, 180),
        headline: clampStr(input.headline, def.headline, 240),
        description: clampStr(input.description, def.description, 600),
        scaleOptions,
        questions,
        idealCoords,
        secondSentences,
      } as SiteContentState[K];
    }
  }
}
