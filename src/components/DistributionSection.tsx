import {
  ArrowRight,
  ChevronDown,
  Cpu,
  Flame,
  GitMerge,
  Layers,
  TrendingDown,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { AnimatePresence, motion, useScroll, useSpring } from 'motion/react';
import { useRef, useState } from 'react';
import { MILIEUS } from '../data/milieus';
import { getMilieuIcon } from '../utils/milieuIcons';

interface CausalShiftItem {
  number: string;
  icon: LucideIcon;
  tag: string;
  question: string;
  transition: string;
  delta: string;
  trend: 'up' | 'down' | 'merge';
  accentColor: string;
  baseline2026?: string;
  development2035?: string;
  developmentLabel?: string;
  subGroups?: {
    milieuId: 'avantgarde' | 'digital_adaptiv' | 'konservativ';
    name: string;
    share: string;
    color: string;
    text: string;
  }[];
}

const CAUSAL_SHIFTS: CausalShiftItem[] = [
  {
    number: '01',
    icon: Users,
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
    icon: Cpu,
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
    icon: Flame,
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
    icon: Layers,
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
];

const SORTED_2035 = [...MILIEUS].sort((a, b) => b.share2035 - a.share2035);

export function DistributionSection() {
  const [expandedShifts, setExpandedShifts] = useState<Record<string, boolean>>({
    '01': true,
  });
  const ledgerRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress: ledgerProgress } = useScroll({
    target: ledgerRef,
    offset: ['start 82%', 'end 68%'],
  });
  const smoothLedgerProgress = useSpring(ledgerProgress, {
    stiffness: 180,
    damping: 28,
  });

  const toggleShift = (num: string) => {
    setExpandedShifts((prev) => ({ ...prev, [num]: !prev[num] }));
  };

  return (
    <section
      id="verteilung"
      className="section-anchor border-t border-white/[0.07] py-20 sm:py-28"
    >
      <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.12 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-end"
        >
          <div className="lg:col-span-7">
            <p className="text-xs sm:text-sm font-medium tracking-wide text-[#9ea4b0]">
              04 · Mathematische &amp; Soziologische Logik · Kausalketten 2026 → 2035
            </p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl lg:text-[42px] font-semibold tracking-tight text-[#f7f8f8] text-balance leading-[1.12]">
              Wie kommt die Prozentverteilung 2035 zustande?
            </h2>
          </div>
          <p className="lg:col-span-5 text-base sm:text-[17px] leading-relaxed text-[#b4bac4]">
            Im SINUS-Modell 2026 verteilen sich 10 Milieus relativ gleichmäßig (8–12 %).
            Bis 2035 verschieben Demografie, KI-Automatisierung und Klimakosten die
            Gewichte zu sechs klar abgegrenzten Blöcken.
          </p>
        </motion.div>

        {/* Visual Linear Percentage Overview Grid with Signature Icons */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {SORTED_2035.map((m, idx) => {
            const Icon = getMilieuIcon(m.id);
            const diff = m.share2035 - m.share2026;
            const diffLabel = diff > 0 ? `+${diff} %` : diff < 0 ? `${diff} %` : '±0 %';
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 18, scale: 0.98 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{
                  duration: 0.5,
                  delay: idx * 0.06,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="linear-fade-window rounded-2xl p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="linear-icon-box flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={{ borderColor: `${m.colorHex}45` }}
                    >
                      <Icon
                        className="h-5 w-5"
                        style={{ color: m.colorHex }}
                        aria-hidden="true"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-[15px] font-semibold text-[#f7f8f8]">
                        {m.shortName}
                      </div>
                      <div className="font-mono-tabular text-xs text-[#8a8f98]">
                        2026: {m.share2026} % ({diffLabel})
                      </div>
                    </div>
                  </div>
                  <div
                    className="font-mono-tabular text-2xl font-semibold shrink-0"
                    style={{ color: m.colorHex }}
                  >
                    {m.share2035} %
                  </div>
                </div>

                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{
                      duration: 0.7,
                      delay: 0.1 + idx * 0.05,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    style={{
                      width: `${Math.min(100, (m.share2035 / 26) * 100)}%`,
                      backgroundColor: m.colorHex,
                      transformOrigin: 'left center',
                    }}
                    className="h-full rounded-full"
                  />
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Linear Architectural Causal Ledger with Scroll-Driven Vertical Rail */}
        <motion.div
          ref={ledgerRef}
          initial={{ opacity: 0, y: 24, scale: 0.985 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.08 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          data-testid="distribution-ledger"
          className="linear-fade-window relative mt-8 divide-y divide-white/[0.08] overflow-hidden rounded-3xl"
        >
          {/* Scroll-driven left spine highlighting progression through the 4 causal shifts */}
          <div
            aria-hidden="true"
            className="pointer-events-none hidden lg:block absolute left-0 top-0 bottom-0 w-[2px] bg-white/[0.04]"
          >
            <motion.div
              style={{ scaleY: smoothLedgerProgress, transformOrigin: 'top center' }}
              className="h-full w-full bg-gradient-to-b from-violet-400 via-amber-400 to-emerald-400 opacity-85"
            />
          </div>

          {CAUSAL_SHIFTS.map((item, idx) => {
            const ShiftIcon = item.icon;
            const TrendIcon =
              item.trend === 'up'
                ? TrendingUp
                : item.trend === 'down'
                  ? TrendingDown
                  : GitMerge;

            return (
              <motion.div
                key={item.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{
                  duration: 0.5,
                  delay: idx * 0.05,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="grid grid-cols-1 gap-6 p-7 sm:p-10 lg:grid-cols-12 lg:gap-12 transition-colors hover:bg-white/[0.015]"
              >
                {/* Left architectural index, icon & metric */}
                <div className="lg:col-span-5 flex flex-col justify-between gap-5">
                  <div>
                    <div className="flex items-center gap-3">
                      <div
                        className="linear-icon-box flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                        style={{ borderColor: `${item.accentColor}45` }}
                      >
                        <ShiftIcon
                          className="h-5 w-5"
                          style={{ color: item.accentColor }}
                          aria-hidden="true"
                        />
                      </div>
                      <div className="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-[#9ea4b0]">
                        <span className="font-mono-tabular text-[#62666d]">
                          {item.number}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="text-[#cbd5e1]">{item.tag}</span>
                      </div>
                    </div>

                    <h3 className="mt-4 font-display text-xl sm:text-2xl font-semibold leading-snug text-[#f7f8f8]">
                      {item.question}
                    </h3>
                  </div>

                  <div className="inline-flex flex-wrap items-center gap-3 self-start rounded-xl border border-white/[0.09] bg-white/[0.025] px-4 py-2.5">
                    <span className="font-mono-tabular text-base font-semibold text-[#f7f8f8]">
                      {item.transition}
                    </span>
                    <span className="text-white/20" aria-hidden="true">
                      |
                    </span>
                    <span
                      className="inline-flex items-center gap-1.5 font-mono-tabular text-sm font-semibold"
                      style={{ color: item.accentColor }}
                    >
                      <TrendIcon className="h-4 w-4" aria-hidden="true" />
                      <span>{item.delta}</span>
                    </span>
                  </div>
                </div>

                {/* Right clean sociological & mathematical derivation (collapsible for clarity) */}
                <div className="lg:col-span-7 flex flex-col justify-center">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-[#8a8f98]">
                      {item.subGroups
                        ? '3 Gruppen-Verschmelzungen im Detail'
                        : 'Ausgangslage 2026 & Kausalkette 2035'}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleShift(item.number)}
                      aria-expanded={Boolean(expandedShifts[item.number])}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.03] px-3 py-1 text-xs font-medium text-[#cbd5e1] hover:bg-white/[0.08] hover:text-white cursor-pointer transition-colors"
                    >
                      <span>
                        {expandedShifts[item.number] ? 'Einklappen' : 'Begründung zeigen'}
                      </span>
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition-transform duration-200 ${
                          expandedShifts[item.number] ? 'rotate-180' : ''
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                  </div>

                  <AnimatePresence initial={false}>
                    {expandedShifts[item.number] && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="pt-4">
                          {item.subGroups ? (
                            <div className="space-y-4">
                              {item.subGroups.map((sg) => {
                                const SgIcon = getMilieuIcon(sg.milieuId);
                                return (
                                  <div
                                    key={sg.name}
                                    className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 sm:p-5"
                                  >
                                    <div className="flex items-center justify-between gap-3">
                                      <div className="flex items-center gap-2.5">
                                        <SgIcon
                                          className="h-4 w-4 shrink-0"
                                          style={{ color: sg.color }}
                                          aria-hidden="true"
                                        />
                                        <span className="text-base font-semibold text-[#f7f8f8]">
                                          {sg.name}
                                        </span>
                                      </div>
                                      <span
                                        className="font-mono-tabular text-base font-semibold"
                                        style={{ color: sg.color }}
                                      >
                                        {sg.share}
                                      </span>
                                    </div>
                                    <p className="mt-2 text-[15px] leading-relaxed text-[#cbd5e1]">
                                      {sg.text}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div>
                                <div className="flex items-center gap-2 text-sm font-semibold text-[#e2e8f0]">
                                  <ArrowRight
                                    className="h-4 w-4 text-[#8a8f98]"
                                    aria-hidden="true"
                                  />
                                  <span>Ausgangslage 2026</span>
                                </div>
                                <p className="mt-1.5 text-[15px] sm:text-base leading-relaxed text-[#b4bac4]">
                                  {item.baseline2026}
                                </p>
                              </div>

                              <div className="border-t border-white/[0.08] pt-4">
                                <div
                                  className="text-sm font-semibold"
                                  style={{ color: item.accentColor }}
                                >
                                  {item.developmentLabel}
                                </div>
                                <p className="mt-1.5 text-[15px] sm:text-base leading-relaxed text-[#d1d5db]">
                                  {item.development2035}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}

          {/* Clean bottom sum verification footer inside the ledger */}
          <div className="flex flex-col gap-3 bg-white/[0.025] px-7 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-10">
            <span className="text-sm font-medium text-[#9ea4b0]">
              Struktur-Bilanz der 6 Zukunfts-Milieus 2035
            </span>
            <div className="font-mono-tabular text-sm sm:text-base font-medium text-[#e2e8f0]">
              24 % + 16 % + 16 % + 15 % + 15 % + 14 % ={' '}
              <strong className="text-emerald-400">100 %</strong>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
