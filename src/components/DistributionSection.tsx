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
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { useSiteContent } from '../context/ContentContext';
import { getMilieuIcon } from '../utils/milieuIcons';
import { EditableNumber, EditableText } from './EditableText';

const SHIFT_ICONS = [Users, Cpu, Flame, Layers];

export function DistributionSection() {
  const { content, updateSectionDraft } = useSiteContent();
  const { distribution } = content;
  const milieus = content.milieus_2035.milieus;
  const [expandedShifts, setExpandedShifts] = useState<Record<string, boolean>>({
    '01': true,
  });

  const sorted2035 = useMemo(
    () => [...milieus].sort((a, b) => b.share2035 - a.share2035),
    [milieus],
  );
  const totalShare2035 = useMemo(
    () => Math.round(milieus.reduce((s, m) => s + m.share2035, 0) * 10) / 10,
    [milieus],
  );

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
              <EditableText
                value={distribution.eyebrow}
                onCommit={(val) =>
                  updateSectionDraft('distribution', (p) => ({
                    ...p,
                    eyebrow: val,
                  }))
                }
              />
            </p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl lg:text-[42px] font-semibold tracking-tight text-[#f7f8f8] text-balance leading-[1.12]">
              <EditableText
                value={distribution.headline}
                multiline
                onCommit={(val) =>
                  updateSectionDraft('distribution', (p) => ({
                    ...p,
                    headline: val,
                  }))
                }
              />
            </h2>
          </div>
          <p className="lg:col-span-5 text-base sm:text-[17px] leading-relaxed text-[#b4bac4]">
            <EditableText
              value={distribution.description}
              multiline
              onCommit={(val) =>
                updateSectionDraft('distribution', (p) => ({
                  ...p,
                  description: val,
                }))
              }
            />
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
          {sorted2035.map((m, idx) => {
            const Icon = getMilieuIcon(m.id);
            const diff = Math.round((m.share2035 - m.share2026) * 10) / 10;
            const diffLabel = diff > 0 ? `+${diff} %` : diff < 0 ? `${diff} %` : '±0 %';
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{
                  duration: 0.4,
                  delay: idx * 0.04,
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
                        <EditableText
                          value={m.shortName}
                          onCommit={(val) =>
                            updateSectionDraft('milieus_2035', (p) => ({
                              ...p,
                              milieus: p.milieus.map((item) =>
                                item.id === m.id
                                  ? { ...item, shortName: val }
                                  : item,
                              ),
                            }))
                          }
                        />
                      </div>
                      <div className="font-mono-tabular text-xs text-[#8a8f98]">
                        2026:{' '}
                        <EditableNumber
                          value={m.share2026}
                          min={0}
                          max={100}
                          step={0.5}
                          suffix=" %"
                          onCommit={(val) =>
                            updateSectionDraft('milieus_2035', (p) => ({
                              ...p,
                              milieus: p.milieus.map((item) =>
                                item.id === m.id
                                  ? { ...item, share2026: val }
                                  : item,
                              ),
                            }))
                          }
                        />{' '}
                        ({diffLabel})
                      </div>
                    </div>
                  </div>
                  <div
                    className="font-mono-tabular text-2xl font-semibold shrink-0"
                    style={{ color: m.colorHex }}
                  >
                    <EditableNumber
                      value={m.share2035}
                      min={0}
                      max={100}
                      step={0.5}
                      suffix=" %"
                      onCommit={(val) =>
                        updateSectionDraft('milieus_2035', (p) => ({
                          ...p,
                          milieus: p.milieus.map((item) =>
                            item.id === m.id
                              ? { ...item, share2035: val }
                              : item,
                          ),
                        }))
                      }
                    />
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

        {/* Linear Architectural Causal Ledger */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.08 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          data-testid="distribution-ledger"
          className="linear-fade-window relative mt-8 divide-y divide-white/[0.08] overflow-hidden rounded-3xl"
        >
          {/* Left gradient accent spine */}
          <div
            aria-hidden="true"
            className="pointer-events-none hidden lg:block absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-violet-400 via-amber-400 to-emerald-400 opacity-75"
          />

          {distribution.causalShifts.map((item, idx) => {
            const ShiftIcon = SHIFT_ICONS[idx % SHIFT_ICONS.length];
            const TrendIcon =
              item.trend === 'up'
                ? TrendingUp
                : item.trend === 'down'
                  ? TrendingDown
                  : GitMerge;

            return (
              <motion.div
                key={`shift-${idx}`}
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
                          <EditableText
                            value={item.number}
                            onCommit={(val) =>
                              updateSectionDraft('distribution', (p) => ({
                                ...p,
                                causalShifts: p.causalShifts.map((c, i) =>
                                  i === idx ? { ...c, number: val } : c,
                                ),
                              }))
                            }
                          />
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="text-[#cbd5e1]">
                          <EditableText
                            value={item.tag}
                            onCommit={(val) =>
                              updateSectionDraft('distribution', (p) => ({
                                ...p,
                                causalShifts: p.causalShifts.map((c, i) =>
                                  i === idx ? { ...c, tag: val } : c,
                                ),
                              }))
                            }
                          />
                        </span>
                      </div>
                    </div>

                    <h3 className="mt-4 font-display text-xl sm:text-2xl font-semibold leading-snug text-[#f7f8f8]">
                      <EditableText
                        value={item.question}
                        multiline
                        onCommit={(val) =>
                          updateSectionDraft('distribution', (p) => ({
                            ...p,
                            causalShifts: p.causalShifts.map((c, i) =>
                              i === idx ? { ...c, question: val } : c,
                            ),
                          }))
                        }
                      />
                    </h3>
                  </div>

                  <div className="inline-flex flex-wrap items-center gap-3 self-start rounded-xl border border-white/[0.09] bg-white/[0.025] px-4 py-2.5">
                    <span className="font-mono-tabular text-base font-semibold text-[#f7f8f8]">
                      <EditableText
                        value={item.transition}
                        onCommit={(val) =>
                          updateSectionDraft('distribution', (p) => ({
                            ...p,
                            causalShifts: p.causalShifts.map((c, i) =>
                              i === idx ? { ...c, transition: val } : c,
                            ),
                          }))
                        }
                      />
                    </span>
                    <span className="text-white/20" aria-hidden="true">
                      |
                    </span>
                    <span
                      className="inline-flex items-center gap-1.5 font-mono-tabular text-sm font-semibold"
                      style={{ color: item.accentColor }}
                    >
                      <TrendIcon className="h-4 w-4" aria-hidden="true" />
                      <EditableText
                        value={item.delta}
                        onCommit={(val) =>
                          updateSectionDraft('distribution', (p) => ({
                            ...p,
                            causalShifts: p.causalShifts.map((c, i) =>
                              i === idx ? { ...c, delta: val } : c,
                            ),
                          }))
                        }
                      />
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
                              {item.subGroups.map((sg, sgIdx) => {
                                const SgIcon = getMilieuIcon(sg.milieuId);
                                return (
                                  <div
                                    key={`sg-${sgIdx}`}
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
                                          <EditableText
                                            value={sg.name}
                                            onCommit={(val) =>
                                              updateSectionDraft('distribution', (p) => ({
                                                ...p,
                                                causalShifts: p.causalShifts.map((c, i) =>
                                                  i === idx && c.subGroups
                                                    ? {
                                                        ...c,
                                                        subGroups: c.subGroups.map(
                                                          (sub, sI) =>
                                                            sI === sgIdx
                                                              ? { ...sub, name: val }
                                                              : sub,
                                                        ),
                                                      }
                                                    : c,
                                                ),
                                              }))
                                            }
                                          />
                                        </span>
                                      </div>
                                      <span
                                        className="font-mono-tabular text-base font-semibold"
                                        style={{ color: sg.color }}
                                      >
                                        <EditableText
                                          value={sg.share}
                                          onCommit={(val) =>
                                            updateSectionDraft('distribution', (p) => ({
                                              ...p,
                                              causalShifts: p.causalShifts.map((c, i) =>
                                                i === idx && c.subGroups
                                                  ? {
                                                      ...c,
                                                      subGroups: c.subGroups.map(
                                                        (sub, sI) =>
                                                          sI === sgIdx
                                                            ? { ...sub, share: val }
                                                            : sub,
                                                      ),
                                                    }
                                                  : c,
                                              ),
                                            }))
                                          }
                                        />
                                      </span>
                                    </div>
                                    <p className="mt-2 text-[15px] leading-relaxed text-[#cbd5e1]">
                                      <EditableText
                                        value={sg.text}
                                        multiline
                                        onCommit={(val) =>
                                          updateSectionDraft('distribution', (p) => ({
                                            ...p,
                                            causalShifts: p.causalShifts.map((c, i) =>
                                              i === idx && c.subGroups
                                                ? {
                                                    ...c,
                                                    subGroups: c.subGroups.map(
                                                      (sub, sI) =>
                                                        sI === sgIdx
                                                          ? { ...sub, text: val }
                                                          : sub,
                                                    ),
                                                  }
                                                : c,
                                            ),
                                          }))
                                        }
                                      />
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
                                  <EditableText
                                    value={item.baseline2026 ?? ''}
                                    multiline
                                    onCommit={(val) =>
                                      updateSectionDraft('distribution', (p) => ({
                                        ...p,
                                        causalShifts: p.causalShifts.map((c, i) =>
                                          i === idx ? { ...c, baseline2026: val } : c,
                                        ),
                                      }))
                                    }
                                  />
                                </p>
                              </div>

                              <div className="border-t border-white/[0.08] pt-4">
                                <div
                                  className="text-sm font-semibold"
                                  style={{ color: item.accentColor }}
                                >
                                  <EditableText
                                    value={item.developmentLabel ?? ''}
                                    onCommit={(val) =>
                                      updateSectionDraft('distribution', (p) => ({
                                        ...p,
                                        causalShifts: p.causalShifts.map((c, i) =>
                                          i === idx
                                            ? { ...c, developmentLabel: val }
                                            : c,
                                        ),
                                      }))
                                    }
                                  />
                                </div>
                                <p className="mt-1.5 text-[15px] sm:text-base leading-relaxed text-[#d1d5db]">
                                  <EditableText
                                    value={item.development2035 ?? ''}
                                    multiline
                                    onCommit={(val) =>
                                      updateSectionDraft('distribution', (p) => ({
                                        ...p,
                                        causalShifts: p.causalShifts.map((c, i) =>
                                          i === idx
                                            ? { ...c, development2035: val }
                                            : c,
                                        ),
                                      }))
                                    }
                                  />
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
              <EditableText
                value={distribution.ledgerFooterLabel}
                onCommit={(val) =>
                  updateSectionDraft('distribution', (p) => ({
                    ...p,
                    ledgerFooterLabel: val,
                  }))
                }
              />
            </span>
            <div className="font-mono-tabular text-sm sm:text-base font-medium text-[#e2e8f0]">
              {sorted2035.map((m) => `${m.share2035} %`).join(' + ')} ={' '}
              <strong
                className={
                  Math.abs(totalShare2035 - 100) < 0.05
                    ? 'text-emerald-400'
                    : 'text-amber-400'
                }
              >
                {totalShare2035} %
              </strong>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
