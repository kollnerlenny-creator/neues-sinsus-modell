import { motion } from 'motion/react';

interface CausalShiftItem {
  number: string;
  tag: string;
  question: string;
  transition: string;
  delta: string;
  deltaPositive: boolean | null;
  accentColor: string;
  baseline2026?: string;
  development2035?: string;
  developmentLabel?: string;
  subGroups?: {
    name: string;
    share: string;
    color: string;
    text: string;
  }[];
}

const CAUSAL_SHIFTS: CausalShiftItem[] = [
  {
    number: '01',
    tag: 'Demografischer Faktor',
    question: 'Warum wächst die „Traditionelle Senioren-Mehrheit“ auf 24 %?',
    transition: '16 % → 24 %',
    delta: '+8 %',
    deltaPositive: true,
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
    deltaPositive: false,
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
    deltaPositive: false,
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
    deltaPositive: null,
    accentColor: '#10b981',
    subGroups: [
      {
        name: 'Tech-Ökologische Avantgarde',
        share: '16 %',
        color: '#10b981',
        text: 'Entsteht aus der Verschmelzung des Postmateriellen (12 %), Neo-Ökologischen (8 %) und Teilen des Expeditiven Milieus (10 %). Da ein Teil dieser Gruppen durch hohe Lebenshaltungskosten oder traditionellere Orientierung im Alter in andere Segmente wandert, bündelt sich die hochgebildete, klimaresiliente Elite bei 16 %.',
      },
      {
        name: 'Digital-Adaptives Leistungs-Milieu',
        share: '15 %',
        color: '#06b6d4',
        text: 'Setzt sich aus dem Milieu der Performer (10 %) und rund 5 % digitalen Aufsteigern aus der ehemaligen Mitte zusammen.',
      },
      {
        name: 'Konservativ-Etablierte Besitzstandswahrer',
        share: '14 %',
        color: '#3b82f6',
        text: 'Bildet sich aus dem Konservativ-Gehobenen Milieu (11 %) sowie wohlhabenden, aber veränderungsskeptischen Teilen der Performer (3 %).',
      },
    ],
  },
];

export function DistributionSection() {
  return (
    <section
      id="verteilung"
      className="section-anchor border-t border-white/[0.06] py-20 sm:py-28"
    >
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.12 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl"
        >
          <p className="text-xs font-medium tracking-wide text-[#8a8f98]">
            Mathematische & Soziologische Logik · Kausalketten 2026 → 2035
          </p>
          <h2 className="mt-2 font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[#f7f8f8] text-balance">
            Wie kommt die Prozentverteilung 2035 zustande?
          </h2>
          <p className="mt-3 text-base leading-relaxed text-[#9ea4b0]">
            Im aktuellen SINUS-Modell (2026) verteilen sich die 10 Milieus noch
            relativ gleichmäßig auf jeweils 8 % bis 12 % der Bevölkerung – mit einer
            breiten, stabilen Mitte. Bis zum Jahr 2035 verschieben sich diese
            Anteile durch drei nachweisbare gesellschaftliche Entwicklungen
            (Kausalketten) zu unseren 6 Zukunfts-Milieus:
          </p>
        </motion.div>

        {/* Clean single architectural ledger without dense box-in-box clutter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.08 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          data-testid="distribution-ledger"
          className="linear-surface mt-12 divide-y divide-white/[0.08] overflow-hidden rounded-3xl"
        >
          {CAUSAL_SHIFTS.map((item) => (
            <div
              key={item.number}
              className="grid grid-cols-1 gap-6 p-7 sm:p-9 lg:grid-cols-12 lg:gap-10"
            >
              {/* Left architectural index & metric */}
              <div className="lg:col-span-5 flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5 text-xs font-medium text-[#8a8f98]">
                    <span className="font-mono-tabular text-[#62666d]">
                      {item.number}
                    </span>
                    <span
                      className="inline-block h-2 w-2 rounded-[2px]"
                      style={{ backgroundColor: item.accentColor }}
                      aria-hidden="true"
                    />
                    <span>{item.tag}</span>
                  </div>

                  <h3 className="mt-2.5 font-display text-xl font-semibold leading-snug text-[#f7f8f8]">
                    {item.question}
                  </h3>
                </div>

                <div className="flex items-baseline gap-3">
                  <span className="font-mono-tabular text-sm font-medium text-[#cbd5e1]">
                    {item.transition}
                  </span>
                  <span
                    className="font-mono-tabular text-xs font-semibold"
                    style={{ color: item.accentColor }}
                  >
                    {item.delta}
                  </span>
                </div>
              </div>

              {/* Right clean sociological & mathematical derivation */}
              <div className="lg:col-span-7">
                {item.subGroups ? (
                  <div className="space-y-5">
                    {item.subGroups.map((sg) => (
                      <div
                        key={sg.name}
                        className="border-l border-white/[0.1] pl-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span
                              className="inline-block h-2 w-2 rounded-[2px]"
                              style={{ backgroundColor: sg.color }}
                              aria-hidden="true"
                            />
                            <span className="text-sm font-semibold text-[#f7f8f8]">
                              {sg.name}
                            </span>
                          </div>
                          <span
                            className="font-mono-tabular text-sm font-semibold"
                            style={{ color: sg.color }}
                          >
                            {sg.share}
                          </span>
                        </div>
                        <p className="mt-1.5 text-sm leading-relaxed text-[#9ea4b0]">
                          {sg.text}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs font-semibold text-[#cbd5e1]">
                        Ausgangslage 2026
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-[#9ea4b0]">
                        {item.baseline2026}
                      </p>
                    </div>

                    <div className="border-t border-white/[0.06] pt-4">
                      <div className="text-xs font-semibold text-[#f7f8f8]">
                        {item.developmentLabel}
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-[#9ea4b0]">
                        {item.development2035}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Clean bottom sum verification footer inside the ledger */}
          <div className="flex flex-col gap-3 bg-white/[0.02] px-7 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-9">
            <span className="text-xs text-[#8a8f98]">
              Struktur-Bilanz der 6 Zukunfts-Milieus 2035
            </span>
            <div className="font-mono-tabular text-xs font-medium text-[#cbd5e1]">
              24 % + 16 % + 16 % + 15 % + 15 % + 14 % ={' '}
              <strong className="text-emerald-400">100 %</strong>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
