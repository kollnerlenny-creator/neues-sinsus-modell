export type SimulationYear = '2020' | '2035';

export type MilieuId =
  | 'avantgarde'
  | 'konservativ'
  | 'digital_adaptiv'
  | 'erodierte_mitte'
  | 'senioren'
  | 'prekariat';

export type ShapeVariant =
  | 'tower_triangle'
  | 'block_rectangle'
  | 'slender_pillar'
  | 'fractured_shards'
  | 'broad_plateau'
  | 'flat_slab';

export interface MilieuSpec {
  id: MilieuId;
  name: string;
  shortName: string;
  badge2035: string;
  colorHex: string;
  emissiveHex: string;
  share2035: number;
  share2020: number;
  /** World coordinates on the floor plane: x = Grundorientierung (-left/+right), z = Soziale Lage (+front/-back) */
  pos2035: { x: number; z: number };
  pos2020: { x: number; z: number };
  /** Vertical resilience height in Three.js Y units */
  height2035: number;
  height2020: number;
  /** Base horizontal scale multiplier */
  scale2035: number;
  scale2020: number;
  /** Approximate footprint radius in world units */
  footprintRadius: number;
  shapeVariant: ShapeVariant;
  socialLayerLabel: string;
  valueOrientationLabel: string;
  resilienceScore: number; // 0-100
  resilienceRatingLabel: string;
  summary2035: string;
  causalChain: string[];
  keyDrivers: string[];
  conflictLine: string;
}

export interface AxisLabelSpec {
  id: string;
  axis: 'X' | 'Y' | 'Z';
  text: string;
  subtext?: string;
  worldPos: { x: number; y: number; z: number };
  accentColor: string;
}

export interface RiftLineSpec {
  id: string;
  label: string;
  points: Array<{ x: number; z: number }>;
}

export const MILIEUS: MilieuSpec[] = [
  {
    id: 'avantgarde',
    name: 'Tech-Ökologische Avantgarde',
    shortName: 'Tech-Öko Avantgarde',
    badge2035: 'Leitmilieu 2035',
    colorHex: '#10b981',
    emissiveHex: '#059669',
    share2035: 16,
    share2020: 11,
    pos2035: { x: 5.3, z: -4.4 },
    pos2020: { x: 3.4, z: -2.7 },
    height2035: 7.4,
    height2020: 0.55,
    scale2035: 1.0,
    scale2020: 0.88,
    footprintRadius: 2.35,
    shapeVariant: 'tower_triangle',
    socialLayerLabel: 'Hohe soziale Lage (Wohlstand / Akademiker)',
    valueOrientationLabel: 'Neuorientierung & Transformation (Öko / Digital)',
    resilienceScore: 94,
    resilienceRatingLabel: 'Sehr hoch (Transformationsgewinner)',
    summary2035:
      'Das kulturell und ökonomisch prägende Leitmilieu 2035 verbindet digitale Kapitalmacht mit ökologischer Modernisierung.',
    causalChain: [
      'KI-gestützte Wissensarbeit und Beteiligungen an Green-Tech-Unternehmen generieren überdurchschnittliche Einkommens- und Kapitalrenditen.',
      'Hohe formale Bildung sowie klimaresilientes, energieautarkes Wohneigentum schützen weitgehend vor Energiepreis- und Klimarisiken.',
      'Als gesellschaftliches Leitmilieu definiert diese Gruppe maßgeblich politische Agenden, Nachhaltigkeitsstandards und kulturelle Normen.',
    ],
    keyDrivers: [
      'KI-Produktivitätsgewinne & Kapitalerträge',
      'Klimaresilientes Eigentum (Wärmepumpe, Solar, Lage)',
      'Hohe berufliche & räumliche Flexibilität',
    ],
    conflictLine:
      'Starker Werte- und Verteilungskonflikt mit Besitzstandswahrern und dem abgehängten Prekariat über CO₂-Bepreisung und Regulierung.',
  },
  {
    id: 'konservativ',
    name: 'Konservativ-Etablierte Besitzstandswahrer',
    shortName: 'Konservativ-Etablierte',
    badge2035: 'Vermögens-Anker',
    colorHex: '#3b82f6',
    emissiveHex: '#2563eb',
    share2035: 14,
    share2020: 15,
    pos2035: { x: -5.3, z: -4.3 },
    pos2020: { x: -3.2, z: -2.6 },
    height2035: 4.3,
    height2020: 0.55,
    scale2035: 1.0,
    scale2020: 1.04,
    footprintRadius: 2.25,
    shapeVariant: 'block_rectangle',
    socialLayerLabel: 'Hohe soziale Lage (Wohlstand / Erben)',
    valueOrientationLabel: 'Tradition & Bewahrung (Sicherheit / Ordnung)',
    resilienceScore: 66,
    resilienceRatingLabel: 'Mittel (Finanziell gepuffert, kulturell defensiv)',
    summary2035:
      'Wohlhabende Ältere, Familienunternehmer und Erbengenerationen, die materielle Stabilität gegen tiefgreifenden Wandel verteidigen.',
    causalChain: [
      'Große Immobilien-, Sach- und Finanzvermögen federn Inflation, Energiekosten und konjunkturelle Krisen zuverlässig ab.',
      'Geringe Bereitschaft zu tiefgreifenden ökologischen oder digitalen Lebensstilumbrüchen erzeugt politische Reibung mit der Avantgarde.',
      'Fokus auf Besitzstandswahrung und Standortkonservatismus führt zur Abschottung gegenüber transformativer Umverteilung.',
    ],
    keyDrivers: [
      'Erb- und Immobilienvermögen als Krisenpuffer',
      'Skepsis gegenüber schneller Dekarbonisierung',
      'Festhalten an klassischen Status- und Ordnungsmodellen',
    ],
    conflictLine:
      'Dauerkonflikt mit der Tech-Ökologischen Avantgarde um Erbschaftssteuer, Sanierungspflichten und kulturelle Hegemonie.',
  },
  {
    id: 'digital_adaptiv',
    name: 'Digital-Adaptives Leistungs-Milieu',
    shortName: 'Digital-Adaptives Milieu',
    badge2035: 'Aufstiegsmilieu',
    colorHex: '#06b6d4',
    emissiveHex: '#0891b2',
    share2035: 15,
    share2020: 12,
    pos2035: { x: 5.4, z: 0.4 },
    pos2020: { x: 3.1, z: -0.2 },
    height2035: 5.8,
    height2020: 0.55,
    scale2035: 1.0,
    scale2020: 0.9,
    footprintRadius: 1.9,
    shapeVariant: 'slender_pillar',
    socialLayerLabel: 'Mittlere bis gehobene soziale Lage',
    valueOrientationLabel: 'Modernisierung & Transformation (Leistung / Tech)',
    resilienceScore: 81,
    resilienceRatingLabel: 'Hoch (Strukturwandel aktiv gemeistert)',
    summary2035:
      'Hochqualifizierte Fachkräfte in KI-Integration, Energietechnik und digitalen Dienstleistungen mit klarer Aufstiegsdynamik.',
    causalChain: [
      'Durch gezielte Weiterbildung in KI-Workflows, Datenanalyse und Automatisierung steigen Produktivität und Marktwert dieser Gruppe.',
      'Während die klassische Büromitte schrumpft, koppelt sich dieses Milieu erfolgreich an die Wertschöpfung der Avantgarde an.',
      'Pragmatische Anpassungsfähigkeit an flexible Arbeitsmärkte ermöglicht sozialen Aufstieg in die obere Lage.',
    ],
    keyDrivers: [
      'MINT- & KI-Anwendungskompetenz',
      'Hohe berufliche Weiterbildungsbereitschaft',
      'Leistungsorientierter Aufstieg durch Fachkräftemangel',
    ],
    conflictLine:
      'Wachsende soziale Distanz zur Erodierten Mitte durch unterschiedliche Anpassungsgeschwindigkeit auf dem Arbeitsmarkt.',
  },
  {
    id: 'erodierte_mitte',
    name: 'Erodierte Mitte (Verunsicherte Arbeitnehmer)',
    shortName: 'Erodierte Mitte',
    badge2035: 'Unter Abstiegsdruck',
    colorHex: '#f59e0b',
    emissiveHex: '#d97706',
    share2035: 15,
    share2020: 27,
    pos2035: { x: 0.2, z: 0.3 },
    pos2020: { x: 0.0, z: 0.1 },
    height2035: 1.55,
    height2020: 0.55,
    scale2035: 1.0,
    scale2020: 1.36,
    footprintRadius: 2.35,
    shapeVariant: 'fractured_shards',
    socialLayerLabel: 'Mittlere soziale Lage (abwärtsgefährdet)',
    valueOrientationLabel: 'Modernisierung & Individualisierung (Mitte)',
    resilienceScore: 34,
    resilienceRatingLabel: 'Niedrig (Rissige Stabilität, akuter Abstiegsdruck)',
    summary2035:
      'Der ehemals breite „Bürgerliche Mainstream“ von 2020 (27 %) ist bis 2035 geschrumpft und innerlich zerrissen zwischen Aufstiegsangst und Abstieg.',
    causalChain: [
      'Generative KI und Prozessautomatisierung verdrängen klassische Sachbearbeitungs-, Verwaltungs- und mittlere Dienstleistungsberufe.',
      'Steigende Wohn-, Energie- und Abgabenlasten zehren Reallöhne auf und verhindern den Vermögensaufbau der Mittelschicht.',
      'Das frühere Aufstiegsversprechen bricht auf: Ein Teil steigt digital-adaptiv auf, ein größerer Teil rutscht Richtung Prekariat ab.',
    ],
    keyDrivers: [
      'KI-Automatisierung in Routine-Büroberufen',
      'Hohe Miet-, Energie- und Lebenshaltungskosten',
      'Statusverlust & Verunsicherung des ehemaligen Mainstreams',
    ],
    conflictLine:
      'Politischer Vertrauensverlust und Polarisierung zwischen Sehnsucht nach Sicherheit (2020) und Angst vor weiterem Abstieg.',
  },
  {
    id: 'senioren',
    name: 'Traditionelle Senioren-Mehrheit',
    shortName: 'Traditionelle Senioren',
    badge2035: 'Demografische Größe',
    colorHex: '#8b5cf6',
    emissiveHex: '#7c3aed',
    share2035: 24,
    share2020: 18,
    pos2035: { x: -5.3, z: 2.0 },
    pos2020: { x: -3.5, z: 1.5 },
    height2035: 0.95,
    height2020: 0.55,
    scale2035: 1.0,
    scale2020: 0.84,
    footprintRadius: 3.05,
    shapeVariant: 'broad_plateau',
    socialLayerLabel: 'Niedrige bis mittlere soziale Lage',
    valueOrientationLabel: 'Tradition & Bewahrung (Sicherheit / Gewohnheit)',
    resilienceScore: 26,
    resilienceRatingLabel: 'Sehr niedrig (Demografisch groß, aber vulnerabel)',
    summary2035:
      'Durch den Renteneintritt der Babyboomer-Jahrgänge mit 24 % größte Bevölkerungsgruppe, aber stark verwundbar durch Inflation und digitale Exklusion.',
    causalChain: [
      'Der demografische Wandel lässt die Gruppe der Rentnerinnen und Rentner ohne großes Privatvermögen zur größten Wählergruppe anwachsen.',
      'Hohes politisches Gewicht sichert zwar kurzfristig Rentenniveaus, verschärft jedoch den Generationenkonflikt über Beitragssätze.',
      'Geringe digitale Teilhabe sowie steigende Pflege-, Gesundheits- und Heizkosten erzeugen hohe Alltagsvulnerabilität.',
    ],
    keyDrivers: [
      'Renteneintritt der Babyboomer-Kohorten (24 % Anteil)',
      'Hohe Wahlbeteiligung & Veto-Macht bei Rentenpolitik',
      'Verwundbarkeit durch Pflegekosten, Hitze & Digitalisierung',
    ],
    conflictLine:
      'Generationenkonflikt mit jüngeren Erwerbstätigen über Rentenfinanzierung, Pflegebeiträge und kommunale Infrastruktur.',
  },
  {
    id: 'prekariat',
    name: 'Abgehängtes Digital- & Klima-Prekariat',
    shortName: 'Digital- & Klima-Prekariat',
    badge2035: 'Transformationsverlierer',
    colorHex: '#ef4444',
    emissiveHex: '#dc2626',
    share2035: 16,
    share2020: 17,
    pos2035: { x: -0.9, z: 5.0 },
    pos2020: { x: -0.7, z: 3.0 },
    height2035: 0.38,
    height2020: 0.55,
    scale2035: 1.0,
    scale2020: 0.98,
    footprintRadius: 2.6,
    shapeVariant: 'flat_slab',
    socialLayerLabel: 'Niedrige soziale Lage (Prekariat / Geringverdiener)',
    valueOrientationLabel: 'Tradition bis Modernisierung (Überlebenssicherung)',
    resilienceScore: 14,
    resilienceRatingLabel: 'Minimal (Strukturell abgehängt am Bodenniveau)',
    summary2035:
      'Verlierer der doppelten Transformation: geringe Löhne in nicht-automatisierbaren Präsenzjobs treffen auf ungedämpfte Klima- und Mietkosten.',
    causalChain: [
      'Beschäftigung in prekären, nicht-automatisierbaren Dienstleistungs-, Logistik- und Hilfsjobs bietet kaum reale Lohnzuwächse.',
      'Unsanierte Mietwohnungen mit fossiler Heizung führen zu überproportionaler Belastung durch CO₂-Preise und sommerliche Hitzewellen.',
      'Fehlende Rücklagen, digitale Bildungsbarrieren und verfestigte „soziale Gräben“ blockieren soziale Aufstiegsmobilität.',
    ],
    keyDrivers: [
      'Niedriglohnsektor ohne Tarifbindung',
      'Unsanierte Wohnlagen & volle CO₂-Preis-Last',
      'Fehlende Aufstiegskanäle & gesellschaftliche Entkopplung',
    ],
    conflictLine:
      'Tiefe Entfremdung von politischen Institutionen und scharfer sozialer Graben gegenüber wohlhabenden Transformationsgewinnern.',
  },
];

export const AXIS_LABELS: AxisLabelSpec[] = [
  {
    id: 'axis-x-left',
    axis: 'X',
    text: '← Tradition & Bewahrung',
    subtext: 'Sicherheit · Ordnung',
    worldPos: { x: -2.6, y: 0.2, z: 6.9 },
    accentColor: '#94a3b8',
  },
  {
    id: 'axis-x-center',
    axis: 'X',
    text: 'X-Achse: Grundorientierung / Werte',
    subtext: 'Modernisierung & Individualisierung',
    worldPos: { x: 0.2, y: 0.2, z: 8.55 },
    accentColor: '#cbd5e1',
  },
  {
    id: 'axis-x-right',
    axis: 'X',
    text: 'Neuorientierung & Transformation →',
    subtext: 'Öko · Digital',
    worldPos: { x: 9.4, y: 0.2, z: 4.4 },
    accentColor: '#38bdf8',
  },
  {
    id: 'axis-y-front',
    axis: 'Y',
    text: 'Niedrige soziale Lage',
    subtext: 'Prekariat · Geringverdiener',
    worldPos: { x: -10.8, y: 0.2, z: 3.9 },
    accentColor: '#f87171',
  },
  {
    id: 'axis-y-mid',
    axis: 'Y',
    text: 'Y-Achse: Soziale Lage',
    subtext: 'Mittlere Lage',
    worldPos: { x: -11.0, y: 0.2, z: 0.0 },
    accentColor: '#cbd5e1',
  },
  {
    id: 'axis-y-back',
    axis: 'Y',
    text: 'Hohe soziale Lage ↑',
    subtext: 'Wohlstand · Akademiker',
    worldPos: { x: -10.8, y: 0.2, z: -5.4 },
    accentColor: '#34d399',
  },
  {
    id: 'axis-z-top',
    axis: 'Z',
    text: 'Z-Achse: Krisenresilienz 2035 ↑',
    subtext: 'Profiteure vs. Abgehängte',
    worldPos: { x: 9.2, y: 7.85, z: -5.8 },
    accentColor: '#10b981',
  },
];

/** Glowing floor rift lines ("Fragmentierungs- und Echokammer-Gräben") between 2035 milieus */
export const RIFT_LINES: RiftLineSpec[] = [
  {
    id: 'rift-upper-vertical',
    label: 'Werte-Graben (Tradition vs. Öko-Tech)',
    points: [
      { x: 0.1, z: -6.8 },
      { x: -0.1, z: -4.2 },
      { x: 0.4, z: -2.4 },
    ],
  },
  {
    id: 'rift-upper-horizontal',
    label: 'Wohlstands- & Vermögensschwelle',
    points: [
      { x: -8.6, z: -1.8 },
      { x: -4.4, z: -2.0 },
      { x: 0.0, z: -2.2 },
      { x: 4.3, z: -2.1 },
      { x: 8.6, z: -2.0 },
    ],
  },
  {
    id: 'rift-lower-divide',
    label: 'Abstiegs- & Prekarisierungsgraben',
    points: [
      { x: -8.2, z: 4.6 },
      { x: -4.4, z: 3.9 },
      { x: -1.5, z: 2.6 },
      { x: 2.2, z: 2.8 },
      { x: 7.4, z: 3.4 },
    ],
  },
  {
    id: 'rift-east-tech-gap',
    label: 'Digitale Kompetenzkluft',
    points: [
      { x: 2.9, z: -2.1 },
      { x: 2.7, z: 0.3 },
      { x: 2.5, z: 3.0 },
      { x: 2.4, z: 6.2 },
    ],
  },
];
