import {
  ArrowUpRight,
  Briefcase,
  ChevronDown,
  GitBranch,
  ShieldCheck,
  Swords,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { MILIEUS, type MilieuId } from '../data/milieus';
import { getMilieuIcon } from '../utils/milieuIcons';

interface MilieusGridSectionProps {
  onFocusIn3D: (id: MilieuId) => void;
}

type MilieuFilter = 'all' | 'high' | 'pressure';

export function MilieusGridSection({ onFocusIn3D }: MilieusGridSectionProps) {
  const [filter, setFilter] = useState<MilieuFilter>('all');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const visibleMilieus = MILIEUS.filter((m) => {
    if (filter === 'high') return m.resilienceScore >= 50;
    if (filter === 'pressure') return m.resilienceScore < 50;
    return true;
  });

  const allExpanded = visibleMilieus.every((m) => Boolean(expandedIds[m.id]));

  const toggleCard = (id: MilieuId) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAll = () => {
    if (allExpanded) {
      setExpandedIds({});
    } else {
      const next: Record<string, boolean> = {};
      for (const m of visibleMilieus) next[m.id] = true;
      setExpandedIds(next);
    }
  };

  return (
    <section
      id="milieus-detail"
      className="section-anchor border-t border-white/[0.07] py-20 sm:py-28"
    >
      <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.12 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"
        >
          <div className="max-w-3xl">
            <p className="text-xs sm:text-sm font-medium tracking-wide text-[#9ea4b0]">
              02 · Strukturprofil 2035 · Sechs verdichtete Lebenswelten
            </p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl lg:text-[42px] font-semibold tracking-tight text-[#f7f8f8] text-balance leading-[1.12]">
              Die 6 Milieus im Detail
            </h2>
            <p className="mt-3.5 text-base sm:text-[17px] leading-relaxed text-[#b4bac4]">
              Kompakte Übersicht aller sechs Zukunfts-Blöcke nach Bevölkerungsanteil
              und Krisenresilienz – vertiefende Profile lassen sich gezielt einblenden.
            </p>
          </div>

          <button
            type="button"
            onClick={toggleAll}
            data-testid="toggle-all-milieus-btn"
            className="self-start lg:self-auto rounded-full border border-white/[0.12] bg-white/[0.04] px-4 py-2 text-[13px] font-medium text-[#e2e8f0] hover:bg-white/[0.09] hover:text-white transition-colors cursor-pointer whitespace-nowrap"
          >
            {allExpanded ? 'Kompaktansicht' : 'Alle Vertiefungen öffnen'}
          </button>
        </motion.div>

        {/* Clean Resilience Filter Bar */}
        <div
          role="group"
          aria-label="Milieus nach Resilienz filtern"
          className="mt-7 inline-flex flex-wrap items-center gap-1.5 rounded-full border border-white/[0.09] bg-[#0b0d11] p-1"
        >
          {[
            { id: 'all', label: 'Alle (6)' },
            { id: 'high', label: 'Hohe Resilienz (Z ≥ 50)' },
            { id: 'pressure', label: 'Unter Druck (Z < 50)' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id as MilieuFilter)}
              className={`rounded-full px-3.5 py-1.5 text-xs sm:text-[13px] font-medium transition-colors cursor-pointer ${
                filter === tab.id
                  ? 'bg-[#f7f8f8] text-[#08090a] font-semibold'
                  : 'text-[#9ea4b0] hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {visibleMilieus.map((m, idx) => {
            const isExpanded = Boolean(expandedIds[m.id]);
            const Icon = getMilieuIcon(m.id);

            return (
              <motion.article
                key={m.id}
                data-testid={`detail-card-${m.id}`}
                initial={{ opacity: 0, y: 28, scale: 0.98 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.08 }}
                transition={{
                  duration: 0.58,
                  delay: (idx % 2) * 0.09,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="linear-fade-window linear-surface-interactive flex flex-col justify-between overflow-hidden rounded-3xl p-7 sm:p-8"
              >
                <div>
                  {/* Linear Header with Signature Icon & Clean Tabular Metrics */}
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div
                        className="linear-icon-box flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                        style={{ borderColor: `${m.colorHex}45` }}
                      >
                        <Icon
                          className="h-5 w-5"
                          style={{ color: m.colorHex }}
                          aria-hidden="true"
                        />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-[13px] font-medium text-[#9ea4b0]">
                          <span style={{ color: m.colorHex }}>{m.badge2035}</span>
                          <span aria-hidden="true">·</span>
                          <span>{m.socialLayerLabel}</span>
                        </div>
                        <h3 className="mt-1 font-display text-xl sm:text-2xl font-semibold tracking-tight text-[#f7f8f8]">
                          {m.name}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-sm font-mono-tabular shrink-0">
                      <span className="text-[#9ea4b0]">
                        Z{' '}
                        <strong className="text-[#f7f8f8]">
                          {m.resilienceScore}/100
                        </strong>
                      </span>
                      <span className="text-white/20" aria-hidden="true">
                        |
                      </span>
                      <span
                        className="text-base font-semibold"
                        style={{ color: m.colorHex }}
                      >
                        {m.share2035} %
                      </span>
                    </div>
                  </div>

                  {/* Subtle Linear Resilience Meter */}
                  <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                    <motion.div
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{
                        duration: 0.65,
                        delay: 0.1 + (idx % 2) * 0.06,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      style={{
                        width: `${m.resilienceScore}%`,
                        backgroundColor: m.colorHex,
                        transformOrigin: 'left center',
                      }}
                      className="h-full rounded-full"
                    />
                  </div>

                  <p className="mt-5 text-[15px] sm:text-base leading-relaxed text-[#e2e8f0]">
                    {m.causalChainSummary}
                  </p>

                  {/* Clean Origin Note */}
                  <div className="mt-4 flex items-start gap-2.5 text-sm leading-relaxed text-[#9ea4b0]">
                    <GitBranch
                      className="mt-0.5 h-4 w-4 shrink-0 text-[#62666d]"
                      aria-hidden="true"
                    />
                    <p>
                      <span className="font-semibold text-[#e2e8f0]">
                        Herkunft 2026:
                      </span>{' '}
                      {m.originFrom2026}
                    </p>
                  </div>

                  {/* Smooth on-demand deep-dive */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="mt-5 space-y-4 border-t border-white/[0.08] pt-5">
                          <p className="text-sm sm:text-[15px] leading-relaxed text-[#cbd5e1]">
                            {m.detailedProfile}
                          </p>

                          <div>
                            <div className="flex items-center gap-2 text-sm font-semibold text-[#f7f8f8]">
                              <ShieldCheck
                                className="h-4 w-4"
                                style={{ color: m.colorHex }}
                                aria-hidden="true"
                              />
                              <span>
                                Resilienz-Mechanismus 2035 ({m.resilienceRatingLabel})
                              </span>
                            </div>
                            <p className="mt-1.5 text-sm sm:text-[15px] leading-relaxed text-[#b4bac4]">
                              {m.resilienceMechanism}
                            </p>
                          </div>

                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 border-t border-white/[0.07] pt-4">
                            <div>
                              <div className="flex items-center gap-2 text-sm font-semibold text-[#f7f8f8]">
                                <Briefcase
                                  className="h-4 w-4 text-[#8a8f98]"
                                  aria-hidden="true"
                                />
                                <span>Typische Lebensrealität</span>
                              </div>
                              <p className="mt-1.5 text-sm leading-relaxed text-[#9ea4b0]">
                                {m.everydayExamples}
                              </p>
                            </div>
                            <div>
                              <div className="flex items-center gap-2 text-sm font-semibold text-[#f7f8f8]">
                                <Swords
                                  className="h-4 w-4 text-[#8a8f98]"
                                  aria-hidden="true"
                                />
                                <span>Gesellschaftliche Konfliktlinie</span>
                              </div>
                              <p className="mt-1.5 text-sm leading-relaxed text-[#9ea4b0]">
                                {m.conflictLine}
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] pt-5">
                  <button
                    type="button"
                    onClick={() => toggleCard(m.id)}
                    aria-expanded={isExpanded}
                    data-testid={`expand-card-${m.id}`}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-[#9ea4b0] hover:text-[#f7f8f8] cursor-pointer transition-colors"
                  >
                    <span>
                      {isExpanded
                        ? 'Vertiefung einklappen'
                        : 'Resilienz & Alltag einblenden'}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() => onFocusIn3D(m.id)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.04] px-3.5 py-1.5 text-[13px] font-semibold text-[#f7f8f8] hover:bg-white/[0.1] hover:text-white cursor-pointer transition-colors"
                  >
                    <span>Im 3D-Modell fokussieren</span>
                    <ArrowUpRight
                      className="h-4 w-4 text-[#9ea4b0]"
                      aria-hidden="true"
                    />
                  </button>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
