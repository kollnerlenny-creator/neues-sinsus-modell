import {
  ArrowDownRight,
  Box,
  Compass,
  Cpu,
  Flame,
  GitCompareArrows,
  GitFork,
  Hash,
  Layers,
  MoveVertical,
  Scale,
  TrendingUp,
  Users,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { useSiteContent } from '../context/ContentContext';
import { getMilieuIcon } from '../utils/milieuIcons';

type MatrixFocus = 'both' | '2026' | '2035';
type DetailTab = 'calculation' | 'comparison';

const ARGUMENT_ICONS = [Layers, MoveVertical, GitCompareArrows];
const CALC_STEP_ICONS = [Users, Cpu, Flame, TrendingUp];
const DIMENSION_ICONS = [Box, Hash, GitFork, Compass, Scale];

export function TransformationSection() {
  const { content } = useSiteContent();
  const { transformation } = content;
  const milieus = content.milieus_2035.milieus;
  const [focus, setFocus] = useState<MatrixFocus>('both');
  const [activeTab, setActiveTab] = useState<DetailTab>('calculation');

  const shareSegments = useMemo(
    () => [...milieus].sort((a, b) => b.share2035 - a.share2035),
    [milieus],
  );
  const totalShare2035 = useMemo(
    () => Math.round(milieus.reduce((s, m) => s + m.share2035, 0) * 10) / 10,
    [milieus],
  );

  return (
    <section
      id="transformation"
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
              {transformation.eyebrow}
            </p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl lg:text-[42px] font-semibold tracking-tight text-[#f7f8f8] text-balance leading-[1.12]">
              {transformation.headline}
            </h2>
          </div>
          <p className="lg:col-span-5 text-base sm:text-[17px] leading-relaxed text-[#b4bac4]">
            {transformation.description}
          </p>
        </motion.div>

        {/* Unified Linear 3-column architectural grid fading into black */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="linear-fade-window mt-12 grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.08] overflow-hidden rounded-3xl"
        >
          {transformation.arguments.map((arg, idx) => {
            const ArgIcon = ARGUMENT_ICONS[idx % ARGUMENT_ICONS.length];
            return (
              <motion.div
                key={arg.number}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.12 }}
                transition={{
                  duration: 0.5,
                  delay: 0.08 + idx * 0.08,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="p-7 sm:p-9 flex flex-col justify-between transition-colors hover:bg-white/[0.015]"
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="linear-icon-box flex h-10 w-10 items-center justify-center rounded-xl text-[#e2e8f0]">
                      <ArgIcon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <span className="font-mono-tabular text-xs font-semibold text-[#62666d]">
                      {arg.number}
                    </span>
                  </div>
                  <h3 className="mt-5 font-display text-xl font-semibold leading-snug text-[#f7f8f8]">
                    {arg.title}
                  </h3>
                  <p className="mt-3 text-[15px] sm:text-base leading-relaxed text-[#b4bac4]">
                    {arg.body}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Clean Tabbed Deep-Dive Selector for Calculation vs Comparison */}
        <div className="mt-10 flex justify-center sm:justify-start">
          <div
            role="tablist"
            aria-label="Analyse-Ansicht wählen"
            className="inline-flex items-center gap-1 rounded-full border border-white/[0.1] bg-[#0b0d11] p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'calculation'}
              onClick={() => setActiveTab('calculation')}
              className={`rounded-full px-4 py-2 text-xs sm:text-[13px] font-medium transition-colors cursor-pointer ${
                activeTab === 'calculation'
                  ? 'bg-[#f7f8f8] text-[#08090a] font-semibold'
                  : 'text-[#9ea4b0] hover:text-white'
              }`}
            >
              Rechenweg 2035 (100 %)
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'comparison'}
              onClick={() => setActiveTab('comparison')}
              className={`rounded-full px-4 py-2 text-xs sm:text-[13px] font-medium transition-colors cursor-pointer ${
                activeTab === 'comparison'
                  ? 'bg-[#f7f8f8] text-[#08090a] font-semibold'
                  : 'text-[#9ea4b0] hover:text-white'
              }`}
            >
              Systemvergleich 2026 vs. 2035
            </button>
          </div>
        </div>

        {/* Infobox directly underneath when Calculation tab is active */}
        {activeTab === 'calculation' && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            data-testid="calculation-infobox"
            className="linear-fade-window mt-5 overflow-hidden rounded-3xl p-7 sm:p-9"
          >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-[#9ea4b0]">
                {transformation.calcEyebrow}
              </p>
              <h3 className="mt-1 font-display text-xl sm:text-2xl font-semibold text-[#f7f8f8]">
                {transformation.calcHeadline}
              </h3>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-mono-tabular text-sm font-semibold text-emerald-400">
                Gesamtsumme = {totalShare2035} %
              </span>
              <a
                href="#verteilung"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[#e2e8f0] hover:text-white transition-colors"
              >
                <span>Kausalketten im Detail</span>
                <ArrowDownRight className="h-4 w-4 text-[#9ea4b0]" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Animated Visual 100% stacked population distribution bar */}
          <div className="mt-7">
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformOrigin: 'left center' }}
              className="flex h-5 w-full overflow-hidden rounded-full border border-white/[0.1] bg-white/[0.04] p-0.5 gap-0.5"
              aria-label="Prozentverteilung der 6 Zukunfts-Milieus 2035 (Summe 100 %)"
            >
              {shareSegments.map((m) => (
                <div
                  key={m.id}
                  title={`${m.shortName}: ${m.share2035} %`}
                  className="h-full first:rounded-l-full last:rounded-r-full transition-opacity hover:opacity-85"
                  style={{
                    width: `${totalShare2035 > 0 ? (m.share2035 / totalShare2035) * 100 : 16.6}%`,
                    backgroundColor: m.colorHex,
                  }}
                />
              ))}
            </motion.div>

            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
              {shareSegments.map((m) => {
                const MIcon = getMilieuIcon(m.id);
                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <MIcon
                        className="h-4 w-4 shrink-0"
                        style={{ color: m.colorHex }}
                        aria-hidden="true"
                      />
                      <span className="truncate text-xs sm:text-[13px] font-medium text-[#cbd5e1]">
                        {m.shortName}
                      </span>
                    </div>
                    <span
                      className="font-mono-tabular text-sm font-semibold shrink-0"
                      style={{ color: m.colorHex }}
                    >
                      {m.share2035}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4 concise calculation items with domain icons */}
          <div className="mt-7 grid grid-cols-1 gap-x-8 gap-y-6 border-t border-white/[0.08] pt-7 md:grid-cols-2">
            {transformation.calcSteps.map((item, idx) => {
              const StepIcon = CALC_STEP_ICONS[idx % CALC_STEP_ICONS.length];
              return (
                <motion.div
                  key={item.number}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.12 }}
                  transition={{
                    duration: 0.45,
                    delay: idx * 0.07,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="flex items-start gap-4"
                >
                  <div
                    className="linear-icon-box flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ borderColor: `${item.color}40` }}
                  >
                    <StepIcon
                      className="h-4 w-4"
                      style={{ color: item.color }}
                      aria-hidden="true"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-2.5">
                      <span className="font-mono-tabular text-xs font-semibold text-[#62666d]">
                        {item.number}
                      </span>
                      <span className="text-base font-semibold text-[#f7f8f8]">
                        {item.title}
                      </span>
                      <span
                        className="font-mono-tabular text-sm font-semibold"
                        style={{ color: item.color }}
                      >
                        {item.delta}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm sm:text-[15px] leading-relaxed text-[#b4bac4]">
                      {item.summary}
                    </p>
                  </div>
                </motion.div>
              );
            })}
            </div>
          </motion.div>
        )}

        {/* Integrated Linear-style interactive comparison matrix */}
        {activeTab === 'comparison' && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="linear-fade-window mt-5 overflow-hidden rounded-3xl"
          >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.08] px-6 py-6 sm:px-8">
            <div>
              <h3 className="font-display text-xl font-semibold text-[#f7f8f8]">
                {transformation.compHeadline}
              </h3>
              <p className="mt-1 text-sm text-[#9ea4b0]">
                {transformation.compDescription}
              </p>
            </div>

            <div
              role="group"
              aria-label="Vergleichsspalte hervorheben"
              className="inline-flex items-center gap-1 rounded-full border border-white/[0.1] bg-[#08090a] p-1 self-start sm:self-auto"
            >
              {[
                { id: 'both', label: 'Direktvergleich' },
                { id: '2026', label: '2026 Fokus' },
                { id: '2035', label: '2035 Fokus' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFocus(tab.id as MatrixFocus)}
                  className={`relative rounded-full px-3.5 py-1.5 text-xs sm:text-[13px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    focus === tab.id
                      ? 'text-[#f7f8f8]'
                      : 'text-[#8a8f98] hover:text-[#f7f8f8]'
                  }`}
                >
                  {focus === tab.id && (
                    <motion.span
                      layoutId="matrix-focus-pill"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      className="absolute inset-0 rounded-full bg-white/[0.14]"
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mobile stacked comparison cards */}
          <div className="divide-y divide-white/[0.06] md:hidden">
            {transformation.comparisonRows.map((row, idx) => {
              const DimIcon = DIMENSION_ICONS[idx % DIMENSION_ICONS.length];
              return (
                <div key={`${row.criterion}-${idx}`} className="p-5 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <DimIcon className="h-4 w-4 text-[#8a8f98]" aria-hidden="true" />
                    <span className="text-base font-semibold text-[#f7f8f8]">
                      {row.criterion}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-3 text-sm">
                    <div
                      className={`rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5 transition-opacity ${
                        focus === '2035' ? 'opacity-35' : 'opacity-100'
                      }`}
                    >
                      <div className="text-xs font-medium text-[#9ea4b0]">
                        2026 · 2D-Modell (10 Milieus)
                      </div>
                      <p className="mt-1 leading-relaxed text-[#cbd5e1]">
                        {row.model2026}
                      </p>
                    </div>
                    <div
                      className={`rounded-xl border border-white/[0.1] bg-white/[0.035] p-3.5 transition-opacity ${
                        focus === '2026' ? 'opacity-35' : 'opacity-100'
                      }`}
                    >
                      <div className="text-xs font-medium text-emerald-400">
                        2035 · Schwebendes 3D-Modell (6 Milieus)
                      </div>
                      <p className="mt-1 leading-relaxed text-[#f7f8f8]">
                        {row.model2035}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop 3-column architectural comparison table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-[15px]">
              <thead>
                <tr className="border-b border-white/[0.08] text-[13px] font-semibold text-[#9ea4b0]">
                  <th className="py-4 pl-6 sm:pl-8 pr-4 w-[26%]">Dimension</th>
                  <th
                    className={`py-4 px-5 w-[37%] transition-opacity duration-200 ${
                      focus === '2035' ? 'opacity-40' : 'opacity-100'
                    }`}
                  >
                    2026 · Klassisches 2D-Modell (10 Milieus)
                  </th>
                  <th
                    className={`py-4 pl-5 pr-6 sm:pr-8 w-[37%] bg-white/[0.025] text-[#f7f8f8] transition-opacity duration-200 ${
                      focus === '2026' ? 'opacity-40' : 'opacity-100'
                    }`}
                  >
                    2035 · Schwebendes 3D-Modell (6 Milieus)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {transformation.comparisonRows.map((row, idx) => {
                  const DimIcon = DIMENSION_ICONS[idx % DIMENSION_ICONS.length];
                  return (
                    <tr
                      key={`${row.criterion}-${idx}`}
                      className="align-top transition-colors hover:bg-white/[0.025]"
                    >
                      <td className="py-5 pl-6 sm:pl-8 pr-4">
                        <div className="flex items-center gap-3">
                          <DimIcon
                            className="h-4 w-4 shrink-0 text-[#8a8f98]"
                            aria-hidden="true"
                          />
                          <span className="font-semibold text-[#f7f8f8]">
                            {row.criterion}
                          </span>
                        </div>
                      </td>
                      <td
                        className={`py-5 px-5 leading-relaxed text-[#b4bac4] transition-opacity duration-200 ${
                          focus === '2035' ? 'opacity-35' : 'opacity-100'
                        }`}
                      >
                        {row.model2026}
                      </td>
                      <td
                        className={`py-5 pl-5 pr-6 sm:pr-8 leading-relaxed bg-white/[0.025] text-[#f7f8f8] transition-opacity duration-200 ${
                          focus === '2026' ? 'opacity-35' : 'opacity-100'
                        }`}
                      >
                        {row.model2035}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
        )}
      </div>
    </section>
  );
}
