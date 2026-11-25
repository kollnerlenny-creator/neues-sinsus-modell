import { ArrowUpRight, ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { MILIEUS, type MilieuId } from '../data/milieus';

interface MilieusGridSectionProps {
  onFocusIn3D: (id: MilieuId) => void;
}

export function MilieusGridSection({ onFocusIn3D }: MilieusGridSectionProps) {
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const allExpanded = MILIEUS.every((m) => Boolean(expandedIds[m.id]));

  const toggleCard = (id: MilieuId) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAll = () => {
    if (allExpanded) {
      setExpandedIds({});
    } else {
      const next: Record<string, boolean> = {};
      for (const m of MILIEUS) next[m.id] = true;
      setExpandedIds(next);
    }
  };

  return (
    <section
      id="milieus-detail"
      className="section-anchor border-t border-white/[0.06] py-20 sm:py-28"
    >
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.12 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"
        >
          <div className="max-w-3xl">
            <p className="text-xs font-medium tracking-wide text-[#8a8f98]">
              Strukturprofil 2035 · Sechs verdichtete Lebenswelten
            </p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[#f7f8f8] text-balance">
              Die 6 Milieus im Detail
            </h2>
            <p className="mt-3 text-base leading-relaxed text-[#9ea4b0]">
              Jede Lebenswelt entspricht einer schwebenden 3D-Insel im Raummodell. Die
              Flughöhe (Z-Achse) zeigt, wie stark ein Milieu durch Bildung, Eigentum
              und KI-Kompetenz gegenüber Strukturkrisen geschützt ist.
            </p>
          </div>

          <button
            type="button"
            onClick={toggleAll}
            data-testid="toggle-all-milieus-btn"
            className="self-start sm:self-auto rounded-full border border-white/[0.1] bg-white/[0.03] px-4 py-2 text-xs font-medium text-[#cbd5e1] hover:bg-white/[0.07] hover:text-white transition-colors cursor-pointer whitespace-nowrap"
          >
            {allExpanded ? 'Kompaktansicht' : 'Alle Vertiefungen öffnen'}
          </button>
        </motion.div>

        <div className="mt-12 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {MILIEUS.map((m, idx) => {
            const isExpanded = Boolean(expandedIds[m.id]);

            return (
              <motion.article
                key={m.id}
                data-testid={`detail-card-${m.id}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.08 }}
                transition={{
                  duration: 0.5,
                  delay: (idx % 2) * 0.06,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="linear-surface linear-surface-interactive flex flex-col justify-between rounded-3xl p-7 sm:p-8"
              >
                <div>
                  {/* Quiet unboxed metadata header */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-[#8a8f98]">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-[3px] shrink-0"
                        style={{ backgroundColor: m.colorHex }}
                        aria-hidden="true"
                      />
                      <span className="text-[#cbd5e1]">{m.badge2035}</span>
                      <span aria-hidden="true">·</span>
                      <span>{m.socialLayerLabel}</span>
                    </div>

                    <div className="flex items-center gap-2.5 text-xs font-mono-tabular">
                      <span className="text-[#8a8f98]">
                        Resilienz{' '}
                        <strong className="text-[#f7f8f8]">
                          {m.resilienceScore}/100
                        </strong>
                      </span>
                      <span className="text-white/20" aria-hidden="true">
                        |
                      </span>
                      <span
                        className="font-semibold"
                        style={{ color: m.colorHex }}
                      >
                        {m.share2035} %
                      </span>
                    </div>
                  </div>

                  <h3 className="mt-4 font-display text-xl sm:text-2xl font-semibold tracking-tight text-[#f7f8f8]">
                    {m.name}
                  </h3>

                  <p className="mt-3 text-[15px] leading-relaxed text-[#b4bac4]">
                    {m.detailedProfile}
                  </p>

                  {/* Clean single-line origin note instead of dense sub-boxes */}
                  <p className="mt-4 text-xs leading-relaxed text-[#8a8f98]">
                    <span className="font-medium text-[#cbd5e1]">
                      Herkunft 2026:
                    </span>{' '}
                    {m.originFrom2026}
                  </p>

                  {/* Smooth on-demand deep-dive */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="mt-5 space-y-4 border-t border-white/[0.07] pt-5 text-sm leading-relaxed">
                          <div>
                            <div className="text-xs font-medium text-[#f7f8f8]">
                              Resilienz-Mechanismus 2035 ({m.resilienceRatingLabel})
                            </div>
                            <p className="mt-1 text-xs leading-relaxed text-[#9ea4b0]">
                              {m.resilienceMechanism}
                            </p>
                          </div>

                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 border-t border-white/[0.06] pt-4">
                            <div>
                              <div className="text-xs font-medium text-[#f7f8f8]">
                                Typische Lebensrealität
                              </div>
                              <p className="mt-1 text-xs leading-relaxed text-[#8a8f98]">
                                {m.everydayExamples}
                              </p>
                            </div>
                            <div>
                              <div className="text-xs font-medium text-[#f7f8f8]">
                                Gesellschaftliche Konfliktlinie
                              </div>
                              <p className="mt-1 text-xs leading-relaxed text-[#8a8f98]">
                                {m.conflictLine}
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-5">
                  <button
                    type="button"
                    onClick={() => toggleCard(m.id)}
                    aria-expanded={isExpanded}
                    data-testid={`expand-card-${m.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#9ea4b0] hover:text-[#f7f8f8] cursor-pointer transition-colors"
                  >
                    <span>
                      {isExpanded
                        ? 'Vertiefung einklappen'
                        : 'Resilienz & Alltag einblenden'}
                    </span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform duration-200 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() => onFocusIn3D(m.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#f7f8f8] hover:text-white cursor-pointer transition-colors"
                  >
                    <span>Im 3D-Modell fokussieren</span>
                    <ArrowUpRight
                      className="h-3.5 w-3.5 text-[#8a8f98]"
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
