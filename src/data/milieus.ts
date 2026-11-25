export type ModelMode = '2026' | '2035';

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
  share2026: number;
  /** World coordinates on the floor plane: x = Grundorientierung (-left/+right), z = Soziale Lage (+front/-back) */
  pos2035: { x: number; z: number };
  pos2026: { x: number; z: number };
  /** Floating vertical elevation in Three.js Y units (0..7.5) */
  elevation2035: number;
  /** Base horizontal scale multiplier */
  scale2035: number;
  /** Approximate footprint radius in world units */
  footprintRadius: number;
  shapeVariant: ShapeVariant;
  socialLayerLabel: string;
  valueOrientationLabel: string;
  resilienceScore: number; // 0-100 exact Z value
  resilienceRatingLabel: string;
  originFrom2026: string;
  causalChainSummary: string;
  detailedProfile: string;
  resilienceMechanism: string;
  everydayExamples: string;
  causalChain: string[];
  keyDrivers: string[];
  conflictLine: string;
}

export interface ClassicMilieu2026Spec {
  id: string;
  name: string;
  shortName: string;
  share2026: number;
  colorHex: string;
  pos: { x: number; z: number };
  radiusX: number;
  radiusZ: number;
  rotationY: number;
  layerOffset: number;
  socialLayer: string;
  valueOrientation: string;
  description: string;
  evolvesInto: string;
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

export interface TransformationArgument {
  number: string;
  title: string;
  body: string;
}

export interface ComparisonRow {
  criterion: string;
  model2026: string;
  model2035: string;
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
    share2026: 13,
    pos2035: { x: 5.2, z: -4.4 },
    pos2026: { x: 3.4, z: -2.9 },
    elevation2035: 6.9,
    scale2035: 1.0,
    footprintRadius: 2.25,
    shapeVariant: 'tower_triangle',
    socialLayerLabel: 'Oberschicht · Stark transformativ & ökologisch-digital',
    valueOrientationLabel: 'Neuorientierung & Transformation (Öko / Digital)',
    resilienceScore: 92,
    resilienceRatingLabel: 'Sehr hoch (92/100)',
    originFrom2026:
      'Verschmelzung aus dem Postmateriellen, Neo-Ökologischen und Teilen des Expeditiven Milieus.',
    causalChainSummary:
      'Hochgebildete Akademiker und Unternehmer profitieren massiv von KI-Produktivität, Green-Tech und Kapitalerträgen. Klimaresilientes Eigentum schützt sie vor Krisen; sie geben kulturelle und politische Standards vor.',
    detailedProfile:
      'Die Tech-Ökologische Avantgarde bildet 2035 das kulturelle, ökonomische und politische Leitmilieu Deutschlands. Ihre Angehörigen verfügen über höchste formale Bildungsabschlüsse, internationales Netzwerk-Kapital und eine ausgeprägte Gestaltungsmacht in Wissenschaft, Tech-Wirtschaft und Medien. Im Gegensatz zu klassischen Wirtschaftseliten verbinden sie wirtschaftlichen Erfolg selbstverständlich mit postmateriellen, ökologischen und global-vernetzten Werten.',
    resilienceMechanism:
      'Durch die Kombination aus Kapitalbeteiligungen an KI- und Green-Tech-Unternehmen sowie energieautarkem, energetisch vollsaniertem Wohneigentum ist dieses Milieu gegenüber Energiepreis-Schocks, CO₂-Bepreisung und Lohnkonkurrenz nahezu vollständig immunisiert. KI ersetzt ihre Arbeit nicht, sondern vervielfacht ihren persönlichen Output.',
    everydayExamples:
      'KI-Produktarchitektin mit Solar-Altbau, Gründerin eines Klimatech-Startups, Hochschulprofessor für Systemforschung, international vernetzter Nachhaltigkeitsberater.',
    causalChain: [
      'KI-Produktivität und Beteiligungen an Green-Tech-Unternehmen generieren überdurchschnittliche Einkommens- und Kapitalrenditen.',
      'Klimaresilientes, energieautarkes Eigentum schützt weitgehend vor Inflations-, Energiepreis- und Klimarisiken.',
      'Als gesellschaftliches Leitmilieu prägt die Avantgarde maßgeblich kulturelle und politische Standards.',
    ],
    keyDrivers: [
      'KI-Produktivitätsgewinne & Kapitalerträge',
      'Klimaresilientes Wohneigentum',
      'Kulturelle & politische Standardsetzung',
    ],
    conflictLine:
      'Werte- und Verteilungskonflikt mit Besitzstandswahrern und dem abgehängten Prekariat über Klimapolitik und Umverteilung.',
  },
  {
    id: 'konservativ',
    name: 'Konservativ-Etablierte Besitzstandswahrer',
    shortName: 'Konservativ-Etablierte',
    badge2035: 'Vermögens-Anker',
    colorHex: '#3b82f6',
    emissiveHex: '#2563eb',
    share2035: 14,
    share2026: 15,
    pos2035: { x: -5.2, z: -4.3 },
    pos2026: { x: -3.4, z: -2.8 },
    elevation2035: 4.35,
    scale2035: 1.0,
    footprintRadius: 2.15,
    shapeVariant: 'block_rectangle',
    socialLayerLabel: 'Oberschicht · Traditionell & bewahrend',
    valueOrientationLabel: 'Tradition & Bewahrung (Sicherheit / Ordnung)',
    resilienceScore: 58,
    resilienceRatingLabel: 'Mittelhoch (58/100)',
    originFrom2026:
      'Hervorgegangen aus dem Konservativ-Gehobenen Milieu und wohlhabenden Teilen der Performer.',
    causalChainSummary:
      'Hohes Vermögen und Immobilienbesitz sichern den Lebensstandard ab. Allerdings führt die Skepsis gegenüber schnellen digitalen und ökologischen Transformationen zu starken kulturellen Konflikten mit der Avantgarde.',
    detailedProfile:
      'In diesem Milieu sammelt sich die klassische wirtschaftliche und bürgerliche Führungselite, die auf Ordnung, Verlässlichkeit, Eigentumsschutz und bewährte Institutionen setzt. Man lebt in gepflegten Einfamilienhaus-Vierteln oder wohlhabenden Vororten, pflegt klassische Bildungsideale und legt großen Wert auf gesellschaftlichen Status sowie Erhalt des Erarbeiteten über Generationen hinweg.',
    resilienceMechanism:
      'Obwohl erhebliches Privat- und Immobilienvermögen als starkes finanzielles Schutzschild wirkt, schwebt die Insel deutlich tiefer als die Avantgarde (58 statt 92): Ein großer Teil des Vermögens steckt in traditionellen Industrien oder unsanierten Bestandsimmobilien, und eine abwartende Haltung gegenüber KI- und Klimaanpassungen erzeugt laufende Sanierungs- und Transformationskosten.',
    everydayExamples:
      'Mittelständischer Maschinenbau-Unternehmer, Chefärztin im eigenen Hausbestand, leitender Verwaltungsjurist, Vermögensverwalter im traditionellen Familienbetrieb.',
    causalChain: [
      'Hohes Privatvermögen und etablierter Immobilienbesitz sichern den Lebensstandard gegen wirtschaftliche Schwankungen ab.',
      'Skepsis gegenüber schnellen digitalen und ökologischen Transformationen bremst eigene Anpassungsprozesse.',
      'Daraus entstehen ausgeprägte kulturelle Konflikte mit der Tech-Ökologischen Avantgarde.',
    ],
    keyDrivers: [
      'Immobilien- und Erbvermögen als Puffer',
      'Skepsis gegenüber rasantem Wandel',
      'Festhalten an Besitzstand & Ordnung',
    ],
    conflictLine:
      'Starke kulturelle Konfliktlinie mit der Avantgarde über Sanierungspflichten, Besteuerung und gesellschaftlichen Wandel.',
  },
  {
    id: 'digital_adaptiv',
    name: 'Digital-Adaptives Leistungs-Milieu',
    shortName: 'Digital-Adaptives Milieu',
    badge2035: 'Aufstiegsmilieu',
    colorHex: '#06b6d4',
    emissiveHex: '#0891b2',
    share2035: 15,
    share2026: 12,
    pos2035: { x: 5.3, z: 0.4 },
    pos2026: { x: 3.1, z: -0.2 },
    elevation2035: 6.0,
    scale2035: 1.0,
    footprintRadius: 1.95,
    shapeVariant: 'slender_pillar',
    socialLayerLabel: 'Mittlere bis gehobene Lage · Modernisierung & Pragmatismus',
    valueOrientationLabel: 'Modernisierung & Transformation (Leistung / Tech)',
    resilienceScore: 80,
    resilienceRatingLabel: 'Hoch (80/100)',
    originFrom2026:
      'Zusammenschluss aus dem Milieu der Performer und digitalen Aufsteigern der Adaptiv-Pragmatischen Mitte.',
    causalChainSummary:
      'Fachkräfte, die KI-Tools souverän beherrschen und in Zukunftsbranchen arbeiten, steigen aus der klassischen Mitte auf. Hohe Anpassungsfähigkeit macht sie krisenfest.',
    detailedProfile:
      'Das Digital-Adaptive Leistungs-Milieu verkörpert die pragmatischen Gewinner des beruflichen Strukturwandels. Ideologisch weniger festgelegt als die Avantgarde, stehen hier Leistungsbereitschaft, Karriereorientierung, Weiterbildung und technische Problemlösung im Mittelpunkt. Es handelt sich um den Teil der ehemaligen Mittelschicht, der den Sprung in die KI-gestützte Arbeitswelt aktiv gemeistert hat.',
    resilienceMechanism:
      'Mit einer Resilienz von 80/100 schwebt dieses Milieu fast so hoch wie die Oberschicht: Entscheidend ist nicht Erbe oder Besitz, sondern die hohe Nachfrage nach digitalen, hybriden und handwerklich-technischen Spezialkompetenzen (z. B. Robotik-Wartung, KI-Workflows, Energietechnik), die überdurchschnittliche Gehälter sichern.',
    everydayExamples:
      'Meisterin für Wärmepumpen- & Smart-Grid-Technik, Software-Entwickler im Remote-Team, spezialisierter Medizintechniker, KI-gestützter Projektmanager.',
    causalChain: [
      'Souveräne Beherrschung von KI-Tools und Arbeit in Zukunftsbranchen erhöhen Produktivität und Marktwert.',
      'Digitale Aufsteiger lösen sich aus der stagnierenden klassischen Mitte nach oben.',
      'Hohe berufliche Anpassungsfähigkeit macht dieses Milieu ausgesprochen krisenfest.',
    ],
    keyDrivers: [
      'Souveräne KI-Tool-Nutzung im Beruf',
      'Tätigkeit in digitalen Zukunftsbranchen',
      'Hohe berufliche Lern- & Anpassungsfähigkeit',
    ],
    conflictLine:
      'Wachsende soziale Distanz zur Erodierten Mitte durch unterschiedliche technologische Anpassungsgeschwindigkeit.',
  },
  {
    id: 'erodierte_mitte',
    name: 'Erodierte Mitte – Verunsicherte Arbeitnehmer',
    shortName: 'Erodierte Mitte',
    badge2035: 'Unter Abstiegsdruck',
    colorHex: '#f59e0b',
    emissiveHex: '#d97706',
    share2035: 15,
    share2026: 25,
    pos2035: { x: 0.1, z: 0.3 },
    pos2026: { x: 0.0, z: 0.1 },
    elevation2035: 2.4,
    scale2035: 1.0,
    footprintRadius: 2.25,
    shapeVariant: 'fractured_shards',
    socialLayerLabel: 'Mittlere Lage · Zwischen Bewahrung und Überforderung',
    valueOrientationLabel: 'Modernisierung & Individualisierung (Mitte)',
    resilienceScore: 32,
    resilienceRatingLabel: 'Niedrig (32/100)',
    originFrom2026:
      'Rest der ehemaligen Adaptiv-Pragmatischen Mitte und der Nostalgisch-Bürgerlichen.',
    causalChainSummary:
      'Durch KI-Automatisierung in klassischen Büro-, Verwaltungs- und Sachbearbeiterberufen sowie hohe Lebenshaltungskosten gerät die einstige gesellschaftliche Mitte unter massiven Abstiegsdruck (symbolisiert durch den Riss in der Insel).',
    detailedProfile:
      'Die einstige Stabilitätsachse der Bundesrepublik ist 2035 tief verunsichert und gespalten – im 3D-Modell sichtbar an der zweigeteilten, gerissenen Inselform. Viele Menschen hier haben solide Ausbildungen absolviert und stets Leistung gebracht, erleben jedoch, dass klassische Aufstiegsversprechen (Eigenheim, stabiler Bürojob, planbare Altersvorsorge) unter gleichzeitigem Kosten- und Technologiedruck brüchig geworden sind.',
    resilienceMechanism:
      'Die niedrige Flughöhe (32/100) spiegelt die doppelte Klemme wider: Routineaufgaben in Sachbearbeitung, Banken, Verwaltung und klassischer Fertigung werden durch generative KI und Automatisierung rationalisiert, während hohe Bestandsmieten, Energiepreise und Abgaben kaum Spielraum für Vermögensbildung lassen.',
    everydayExamples:
      'Sachbearbeiterin in einer Versicherung unter Rationalisierungsdruck, Industriekaufmann im Zulieferbetrieb, angestellte Familie in teurer Großstadtwohnung.',
    causalChain: [
      'KI-Automatisierung ersetzt zunehmend klassische Büro-, Verwaltungs- und Sachbearbeiterberufe.',
      'Hohe Lebenshaltungs-, Wohn- und Energiekosten zehren Reallöhne und Rücklagen auf.',
      'Die einstige gesellschaftliche Mitte gerät unter massiven Abstiegsdruck – sichtbar am Riss in der schwebenden Insel.',
    ],
    keyDrivers: [
      'KI-Automatisierung in Verwaltungsberufen',
      'Hohe Mieten & Lebenshaltungskosten',
      'Akute Abstiegsangst & Statusverlust',
    ],
    conflictLine:
      'Innerer Riss zwischen Aufstiegsanspruch und Abstiegssorge führt zu politischer Verunsicherung und Polarisierung.',
  },
  {
    id: 'senioren',
    name: 'Traditionelle Senioren-Mehrheit',
    shortName: 'Traditionelle Senioren',
    badge2035: 'Demografische Größe',
    colorHex: '#8b5cf6',
    emissiveHex: '#7c3aed',
    share2035: 24,
    share2026: 18,
    pos2035: { x: -5.2, z: 2.1 },
    pos2026: { x: -3.5, z: 1.5 },
    elevation2035: 1.65,
    scale2035: 1.0,
    footprintRadius: 2.85,
    shapeVariant: 'broad_plateau',
    socialLayerLabel: 'Untere bis mittlere Lage · Streng traditionell & sicherheitsorientiert',
    valueOrientationLabel: 'Tradition & Bewahrung (Sicherheit)',
    resilienceScore: 22,
    resilienceRatingLabel: 'Sehr niedrig (22/100)',
    originFrom2026:
      'Starkes Wachstum des Traditionellen Milieus durch die verrenteten Babyboomer-Jahrgänge.',
    causalChainSummary:
      'Demografisch die größte Wählergruppe mit hoher politischer Macht bei Renten- und Pflegethemen, aber geringerer digitaler Teilhabe und hoher Verwundbarkeit gegenüber Inflation und Pflegekosten.',
    detailedProfile:
      'Mit dem vollständigen Renteneintritt der geburtenstarken Babyboomer-Jahrgänge (1955–1969) wächst dieses Milieu bis 2035 auf fast ein Viertel der Gesamtbevölkerung (24 %). Geprägt von Bescheidenheit, Sicherheitsbedürfnis und gewohnter Alltagsnähe bildet es die wahlentscheidende Mehrheit in Kommunen und bei Bundestagswahlen.',
    resilienceMechanism:
      'Trotz hoher politischer Sichtbarkeit liegt die individuelle Krisenresilienz nur bei 22/100: Fixe Renteneinkommen können bei starker Dienstleistungs- und Pflegeinflation kaum ausgeweitet werden, und rasante Digitalisierung von Behörden, Medizin und Banking erschwert ohne familiäre Unterstützung zunehmend die alltägliche Teilhabe.',
    everydayExamples:
      'Ehemalige Facharbeiterin mit Durchschnittsrente, verrenteter Handwerksmeister im ländlichen Raum, alleinstehender Senior mit steigendem Pflegebedarf.',
    causalChain: [
      'Der Renteneintritt der Babyboomer-Jahrgänge macht dieses Milieu zur demografisch größten Wählergruppe (24 %).',
      'Hohes politisches Gewicht sichert Einfluss bei Renten- und Pflegethemen.',
      'Geringere digitale Teilhabe sowie hohe Verwundbarkeit durch Inflation und Pflegekosten drücken die Resilienz.',
    ],
    keyDrivers: [
      'Demografisches Gewicht der Babyboomer (24 %)',
      'Politische Veto-Macht bei Rente & Pflege',
      'Inflation & Pflegekosten bei geringer Digital-Teilhabe',
    ],
    conflictLine:
      'Generationenkonflikt mit jüngeren Erwerbstätigen über Rentenfinanzierung, Pflegebeiträge und Digitalisierung.',
  },
  {
    id: 'prekariat',
    name: 'Abgehängtes Digital- & Klima-Prekariat',
    shortName: 'Digital- & Klima-Prekariat',
    badge2035: 'Transformationsverlierer',
    colorHex: '#ef4444',
    emissiveHex: '#dc2626',
    share2035: 16,
    share2026: 17,
    pos2035: { x: -0.9, z: 4.9 },
    pos2026: { x: -0.7, z: 3.1 },
    elevation2035: 0.9,
    scale2035: 1.0,
    footprintRadius: 2.45,
    shapeVariant: 'flat_slab',
    socialLayerLabel: 'Untere Schicht · Überlebens- und gegenwartsorientiert',
    valueOrientationLabel: 'Tradition bis Modernisierung (Gegenwartsorientiert)',
    resilienceScore: 12,
    resilienceRatingLabel: 'Minimal (12/100)',
    originFrom2026:
      'Prekäres Milieu plus Absteiger aus der Mitte und Teilen der Konsum-Hedonisten.',
    causalChainSummary:
      'Beschäftigte in schlecht bezahlten, nicht-automatisierbaren Dienstleistungsjobs. Unsanierte Mietwohnungen, steigende CO₂-Preise und fehlende digitale Bildung führen zu sozialer Abkopplung.',
    detailedProfile:
      'Am unteren Ende des sozialen Raums konzentrieren sich Haushalte ohne nennenswerte finanzielle Rücklagen, häufig in strukturschwachen Randlagen oder verdichteten Großstadtquartieren. Der Alltag wird von kurzfristiger Existenzsicherung, Schichtarbeit oder prekären Plattform- und Servicejobs bestimmt, was langfristige Bildungs- oder Vorsorgeplanung kaum zulässt.',
    resilienceMechanism:
      'Mit nur 12/100 Resilienz ruht diese Scheibe beinahe direkt auf der Bodenplatte: Wer in unsanierten Mietwohnungen mit fossiler Heizung lebt, besitzt keine Investitionsmöglichkeiten für Wärmepumpen oder E-Mobilität und trägt steigende CO₂- sowie Lebensmittelpreise ungedämpft – während digitale Qualifikationshürden den Aufstieg blockieren.',
    everydayExamples:
      'Paket- und Lieferfahrer im Plattform-Einsatz, Reinigungskraft im Schichtdienst, Minijobberin in unsaniertem Bestandsbau ohne Heizkostendeckel.',
    causalChain: [
      'Schlecht bezahlte, nicht-automatisierbare Dienstleistungsjobs erlauben kaum Vermögensbildung oder Rücklagen.',
      'Unsanierte Mietwohnungen und steigende CO₂-Preise treffen diesen Teil der Bevölkerung mit voller Wucht.',
      'Fehlende digitale Bildung und räumliche Segregation verfestigen die soziale Abkopplung.',
    ],
    keyDrivers: [
      'Niedriglohnsektor & fehlende Rücklagen',
      'Unsanierte Mietwohnungen & CO₂-Preis-Last',
      'Digitale Bildungsbarrieren & Abkopplung',
    ],
    conflictLine:
      'Tiefe Entfremdung gegenüber politischen Institutionen und scharfer sozialer Graben zu den Transformationsgewinnern.',
  },
];

/** The 10 classic overlapping SINUS milieus (2026, 2D ground plane, sum = 100 %) */
export const CLASSIC_MILIEUS_2026: ClassicMilieu2026Spec[] = [
  {
    id: 'c2026_konservativ_gehoben',
    name: 'Konservativ-Gehobenes Milieu',
    shortName: 'Konservativ-Gehoben',
    share2026: 11,
    colorHex: '#2563eb',
    pos: { x: -5.2, z: -4.4 },
    radiusX: 2.6,
    radiusZ: 2.0,
    rotationY: 0.15,
    layerOffset: 0.03,
    socialLayer: 'Oberschicht / Obere Mitte',
    valueOrientation: 'Tradition & Bewahrung',
    description:
      'Die klassische strukturelle Verantwortungselite mit Exklusivitätsanspruch, hohem Bildungs- und Vermögensniveau sowie starkem Fokus auf Ordnung und Verlässlichkeit.',
    evolvesInto: 'Geht 2035 in den Konservativ-Etablierten Besitzstandswahrern auf.',
  },
  {
    id: 'c2026_postmateriell',
    name: 'Postmaterielles Milieu',
    shortName: 'Postmateriell',
    share2026: 12,
    colorHex: '#059669',
    pos: { x: 0.8, z: -4.3 },
    radiusX: 2.7,
    radiusZ: 2.05,
    rotationY: -0.1,
    layerOffset: 0.045,
    socialLayer: 'Oberschicht / Obere Mitte',
    valueOrientation: 'Modernisierung & Neuorientierung',
    description:
      'Engagiertes, gesellschaftskritisches Bildungsbürgertum mit ausgeprägtem Sinn für Nachhaltigkeit, Gemeinwohl, Kultur und selbstbestimmte Lebensführung.',
    evolvesInto: 'Verschmilzt 2035 maßgeblich zur Tech-Ökologischen Avantgarde.',
  },
  {
    id: 'c2026_performer',
    name: 'Milieu der Performer',
    shortName: 'Performer',
    share2026: 10,
    colorHex: '#0284c7',
    pos: { x: 2.8, z: -2.2 },
    radiusX: 2.55,
    radiusZ: 1.95,
    rotationY: 0.22,
    layerOffset: 0.06,
    socialLayer: 'Gehobene Mitte / Oberschicht',
    valueOrientation: 'Modernisierung & Leistung',
    description:
      'Multimodale, leistungsorientierte und global denkende Wirtschaftselite mit hoher IT-Affinität, Effizienzorientierung und unternehmerischem Ehrgeiz.',
    evolvesInto: 'Teilt sich 2035 auf in Besitzstandswahrer und Digital-Adaptives Leistungs-Milieu.',
  },
  {
    id: 'c2026_expeditiv',
    name: 'Expeditives Milieu',
    shortName: 'Expeditiv',
    share2026: 10,
    colorHex: '#06b6d4',
    pos: { x: 5.5, z: -3.2 },
    radiusX: 2.45,
    radiusZ: 1.9,
    rotationY: -0.25,
    layerOffset: 0.075,
    socialLayer: 'Gehobene Mitte / Oberschicht',
    valueOrientation: 'Neuorientierung & Transformation',
    description:
      'Die unkonventionelle kreative Avantgarde: ambitioniert, vernetzt, experimentierfreudig und ständig auf der Suche nach neuen Grenzen und digitalen Möglichkeiten.',
    evolvesInto: 'Geht 2035 in die Tech-Ökologische Avantgarde und das Digital-Adaptive Milieu ein.',
  },
  {
    id: 'c2026_traditionell',
    name: 'Traditionelles Milieu',
    shortName: 'Traditionell',
    share2026: 9,
    colorHex: '#7c3aed',
    pos: { x: -5.8, z: 2.1 },
    radiusX: 2.5,
    radiusZ: 2.05,
    rotationY: 0.08,
    layerOffset: 0.09,
    socialLayer: 'Untere bis mittlere Schicht',
    valueOrientation: 'Tradition & Bewahrung',
    description:
      'Die sicherheits- und ordnungsliebende Kriegs-/Nachkriegs- und frühe Nachfolgegeneration, verwurzelt in Bescheidenheit, Sparsamkeit und bewährten Strukturen.',
    evolvesInto: 'Wächst 2035 durch verrentete Babyboomer zur Traditionellen Senioren-Mehrheit.',
  },
  {
    id: 'c2026_nostalgisch_buergerlich',
    name: 'Nostalgisch-Bürgerliches Milieu',
    shortName: 'Nostalgisch-Bürgerlich',
    share2026: 11,
    colorHex: '#d97706',
    pos: { x: -2.9, z: 0.4 },
    radiusX: 2.65,
    radiusZ: 2.0,
    rotationY: -0.14,
    layerOffset: 0.105,
    socialLayer: 'Mittlere Schicht',
    valueOrientation: 'Tradition bis Modernisierung',
    description:
      'Die harmonieorientierte frühere Mitte mit Wunsch nach gesellschaftlichem Halt und geordneten Verhältnissen, zunehmend verunsichert durch rasanten Wandel.',
    evolvesInto: 'Bildet 2035 gemeinsam mit Teilen der Mitte die Erodierte Mitte.',
  },
  {
    id: 'c2026_adaptiv_pragmatisch',
    name: 'Adaptiv-Pragmatische Mitte',
    shortName: 'Adaptiv-Pragmatische Mitte',
    share2026: 12,
    colorHex: '#f59e0b',
    pos: { x: 0.5, z: 0.3 },
    radiusX: 2.85,
    radiusZ: 2.1,
    rotationY: 0.1,
    layerOffset: 0.12,
    socialLayer: 'Mittlere Schicht',
    valueOrientation: 'Modernisierung & Pragmatismus',
    description:
      'Der zielstrebige, anpassungsbereite Mainstream der Gesellschaft, der zwischen Sicherheitsbedürfnis und Flexibilitätsanforderungen balanciert.',
    evolvesInto: 'Spaltet sich 2035 in Digital-Adaptives Leistungs-Milieu (Aufsteiger) und Erodierte Mitte.',
  },
  {
    id: 'c2026_neo_oekologisch',
    name: 'Neo-Ökologisches Milieu',
    shortName: 'Neo-Ökologisch',
    share2026: 8,
    colorHex: '#10b981',
    pos: { x: 4.9, z: 0.6 },
    radiusX: 2.3,
    radiusZ: 1.85,
    rotationY: -0.18,
    layerOffset: 0.135,
    socialLayer: 'Mittlere bis gehobene Schicht',
    valueOrientation: 'Neuorientierung & Transformation',
    description:
      'Treiber globaler Klimaschutz- und Transformationsdebatten mit offenem Wertehorizont, hoher Technikakzeptanz für grüne Innovationen und ausgeprägtem Gestaltungsanspruch.',
    evolvesInto: 'Verschmilzt 2035 mit dem Postmateriellen Milieu zur Tech-Ökologischen Avantgarde.',
  },
  {
    id: 'c2026_prekaer',
    name: 'Prekäres Milieu',
    shortName: 'Prekär',
    share2026: 9,
    colorHex: '#ef4444',
    pos: { x: -3.2, z: 4.5 },
    radiusX: 2.55,
    radiusZ: 1.85,
    rotationY: 0.12,
    layerOffset: 0.15,
    socialLayer: 'Untere Schicht / Prekariat',
    valueOrientation: 'Tradition bis Modernisierung',
    description:
      'Die um Teilhabe und Orientierung bemühte Unterschicht mit geringen materiellen Ressourcen, hohen Zukunftsängsten und Gefühl sozialer Benachteiligung.',
    evolvesInto: 'Verfestigt sich 2035 zum Abgehängten Digital- & Klima-Prekariat.',
  },
  {
    id: 'c2026_konsum_hedonistisch',
    name: 'Konsum-Hedonistisches Milieu',
    shortName: 'Konsum-Hedonistisch',
    share2026: 8,
    colorHex: '#f97316',
    pos: { x: 2.4, z: 4.1 },
    radiusX: 2.45,
    radiusZ: 1.85,
    rotationY: -0.16,
    layerOffset: 0.165,
    socialLayer: 'Untere bis mittlere Schicht',
    valueOrientation: 'Modernisierung & Gegenwartsorientierung',
    description:
      'Die spaß-, erlebnis- und konsumorientierte moderne Unterschicht/untere Mitte, die im Hier und Jetzt lebt und Anpassungsdruck im Alltag abfedert.',
    evolvesInto: 'Rutscht 2035 teilweise ins Abgehängte Prekariat oder die Erodierte Mitte.',
  },
];

export const AXIS_LABELS: AxisLabelSpec[] = [
  {
    id: 'axis-x-left',
    axis: 'X',
    text: 'Tradition & Bewahrung',
    subtext: 'Sicherheit · Bestand',
    worldPos: { x: -6.4, y: 0.25, z: 7.9 },
    accentColor: '#cbd5e1',
  },
  {
    id: 'axis-x-center',
    axis: 'X',
    text: 'X-Achse: Grundorientierung / Werte',
    subtext: 'Modernisierung',
    worldPos: { x: 0.0, y: 0.25, z: 8.35 },
    accentColor: '#f8fafc',
  },
  {
    id: 'axis-x-right',
    axis: 'X',
    text: 'Neuorientierung & Transformation',
    subtext: 'Öko · Digital',
    worldPos: { x: 6.4, y: 0.25, z: 7.9 },
    accentColor: '#34d399',
  },
  {
    id: 'axis-y-front',
    axis: 'Y',
    text: 'Untere Schicht / Prekariat',
    subtext: 'Geringe Ressourcen',
    worldPos: { x: -10.4, y: 0.25, z: 4.5 },
    accentColor: '#f87171',
  },
  {
    id: 'axis-y-mid',
    axis: 'Y',
    text: 'Y-Achse: Soziale Lage',
    subtext: 'Mittlere Schicht',
    worldPos: { x: -10.7, y: 0.25, z: 0.0 },
    accentColor: '#f8fafc',
  },
  {
    id: 'axis-y-back',
    axis: 'Y',
    text: 'Oberschicht / Obere Mitte',
    subtext: 'Wohlstand · Bildung',
    worldPos: { x: -10.4, y: 0.25, z: -5.0 },
    accentColor: '#34d399',
  },
  {
    id: 'axis-z-top',
    axis: 'Z',
    text: 'Z-Achse: Resilienz 2035',
    subtext: 'Schutzhöhe vs. Verwundbarkeit',
    worldPos: { x: 9.2, y: 7.8, z: -5.8 },
    accentColor: '#34d399',
  },
];

/** Subtle crimson separation lines ("Soziale Gräben / Echokammern") on the 2035 floor plate */
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

export const TRANSFORMATION_ARGUMENTS: TransformationArgument[] = [
  {
    number: '01',
    title: 'Warum schrumpft die Zahl der Milieus von 10 auf 6?',
    body: 'Im SINUS-Modell von 2026 existieren 10 fein ausdifferenzierte Lebenswelten, weil Wohlstand und Stabilität Raum für vielfältige Lebensstile ließen. Bis 2035 überlagern drei Megatrends – KI-Automatisierung, Klimatransformation und demografischer Wandel – diese feinen Unterschiede. Entscheidend ist nicht mehr der individuelle Konsumstil, sondern die strukturelle Krisenresilienz. Benachbarte Milieus mit ähnlicher Anpassungsfähigkeit verschmelzen zu größeren Blöcken.',
  },
  {
    number: '02',
    title: 'Warum schweben die Milieus auf einer Z-Achse?',
    body: 'Eine zweidimensionale Darstellung (Geld/Bildung vs. Werte) reicht 2035 nicht mehr aus. Zwei Menschen mit gleichem mittleren Einkommen können völlig unterschiedliche Zukunftschancen haben – je nachdem, ob ihr Beruf durch KI ersetzt wird oder ob sie energetisch saniertes Eigentum besitzen. Die Z-Achse (Schwebhöhe) macht diese neue Ungleichheit der Zukunftsfähigkeit sichtbar.',
  },
  {
    number: '03',
    title: 'Warum gibt es Gräben statt Überlappungen?',
    body: 'Während sich die 10 Kreise 2026 stark überlappen (hohe soziale Durchlässigkeit und Begegnung im Alltag), führen algorithmische Echokammern in digitalen Medien sowie steigende Mieten (städtische Segregation) bis 2035 zu abgeschotteten Lebenswelten mit klaren sozialen Gräben.',
  },
];

export const COMPARISON_ROWS: ComparisonRow[] = [
  {
    criterion: 'Dimensionen im Raum',
    model2026: '2D-Ebene: Soziale Lage (Y) × Grundorientierung (X)',
    model2035: '3D-Raum: Lage (Y) × Werte (X) × Krisenresilienz (Z-Flughöhe)',
  },
  {
    criterion: 'Anzahl der Milieus',
    model2026: '10 fein ausdifferenzierte Lebenswelten',
    model2035: '6 verdichtete Strukturblöcke durch Megatrend-Druck',
  },
  {
    criterion: 'Grenzen & Durchlässigkeit',
    model2026: 'Starke Überlappungen, hohe soziale Begegnung im Alltag',
    model2035: 'Sichtbare rote Gräben durch Echokammern & Mietsegregation',
  },
  {
    criterion: 'Zentrales Differenzierungsmerkmal',
    model2026: 'Alltagsästhetik, Konsumstile und Lebensweise',
    model2035: 'KI-Kompetenz, Klimaresilienz und Vermögenspuffer',
  },
  {
    criterion: 'Gesellschaftliche Mitte',
    model2026: 'Breite, stabile Adaptiv-Pragmatische Mitte (12 % + 11 %)',
    model2035: 'Aufgespalten in Digital-Adaptive (15 %) und Erodierte Mitte (15 %)',
  },
];
