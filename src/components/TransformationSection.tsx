import { ArrowDownRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import {
  COMPARISON_ROWS,
  MILIEUS,
  TRANSFORMATION_ARGUMENTS,
} from '../data/milieus';

type MatrixFocus = 'both' | '2026' | '2035';

const CALCULATION_STEPS = [
  {
    number: '1.',
    title: 'Demografischer Faktor',
    delta: '16 % → 24 %',
    summary:
      'Senioren-Mehrheit wächst von 16 % auf 24 % durch Babyboomer-Rente.',
  },
  {
    number: '2.',
    title: 'Polarisierung',
    delta: '20 % → 15 %',
    summary:
      'Erodierte Mitte schrumpft von 20 % auf 15 % durch KI-Automatisierung.',
  },
  {
    number: '3.',
    title: 'Transformationskosten',
    delta: '13 % → 16 %',
    summary: 'Prekariat wächst von 13 % auf 16 %.',
  },
  {
    number: '4.',
    title: 'Bündelung der Eliten & Aufsteiger',
    delta: '16 % · 15 % · 14 %',
    summary:
      'Tech-Öko Avantgarde 16 %, Digital-Adaptives Milieu 15 %, Konservativ-Etablierte 14 % – Gesamtsumme = 100 %.',
  },
];

const SHARE_SEGMENTS = [...MILIEUS].sort((a, b) => b.share2035 - a.share2035);

export function TransformationSection() {
  const [focus, setFocus] = useState<MatrixFocus>('both');

  return (
    <section
      id="transformation"
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
            Soziologische Analyse · Strukturwandel 2026 → 2035
          </p>
          <h2 className="mt-2 font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[#f7f8f8] text-balance">
            Vom 2D-Überlappungsmodell zur schwebenden 3D-Polarisierung
          </h2>
        </motion.div>

        {/* Unified Linear 3-column architectural grid for the 3 core arguments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="linear-surface mt-12 grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.08] overflow-hidden rounded-3xl"
        >
          {TRANSFORMATION_ARGUMENTS.map((arg) => (
            <div
              key={arg.number}
              className="p-7 sm:p-8 flex flex-col justify-between"
            >
              <div>
                <div className="font-mono-tabular text-xs font-medium text-[#62666d]">
                  {arg.number}.
                </div>
                <h3 className="mt-3 font-display text-lg font-semibold leading-snug text-[#f7f8f8]">
                  {arg.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[#9ea4b0]">
                  {arg.body}
                </p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Infobox directly underneath the 3 core arguments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.55, delay: 0.04, ease: [0.16, 1, 0.3, 1] }}
          data-testid="calculation-infobox"
          className="linear-surface mt-8 overflow-hidden rounded-3xl p-6 sm:p-8"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-medium text-[#8a8f98]">
                Infobox · Quantitative Herleitung
              </p>
              <h3 className="mt-1 font-display text-lg sm:text-xl font-semibold text-[#f7f8f8]">
                Rechenweg & Begründung: Wie entstehen die Prozentwerte 2035?
              </h3>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-mono-tabular text-xs font-semibold text-emerald-400">
                Gesamtsumme = 100 %
              </span>
              <a
                href="#verteilung"
                className="inline-flex items-center gap-1 text-xs font-medium text-[#cbd5e1] hover:text-white transition-colors"
              >
                <span>Kausalketten im Detail</span>
                <ArrowDownRight className="h-3.5 w-3.5 text-[#8a8f98]" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Visual 100% stacked population distribution bar */}
          <div className="mt-6">
            <div
              className="flex h-3.5 w-full overflow-hidden rounded-full border border-white/[0.08] bg-white/[0.04] p-0.5 gap-0.5"
              aria-label="Prozentverteilung der 6 Zukunfts-Milieus 2035 (Summe 100 %)"
            >
              {SHARE_SEGMENTS.map((m) => (
                <div
                  key={m.id}
                  title={`${m.shortName}: ${m.share2035} %`}
                  className="h-full first:rounded-l-full last:rounded-r-full transition-all"
                  style={{
                    width: `${m.share2035}%`,
                    backgroundColor: m.colorHex,
                  }}
                />
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#9ea4b0]">
              {SHARE_SEGMENTS.map((m) => (
                <div key={m.id} className="inline-flex items-center gap-1.5">
                  <span
                    className="inline-block h-2 w-2 rounded-[2px]"
                    style={{ backgroundColor: m.colorHex }}
                    aria-hidden="true"
                  />
                  <span>{m.shortName}</span>
                  <span className="font-mono-tabular font-semibold text-[#f7f8f8]">
                    {m.share2035} %
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 4 concise calculation items */}
          <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-5 border-t border-white/[0.08] pt-6 md:grid-cols-2">
            {CALCULATION_STEPS.map((item) => (
              <div key={item.number} className="flex items-start gap-3.5">
                <span className="font-mono-tabular text-xs font-semibold text-[#62666d] pt-0.5">
                  {item.number}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-sm font-semibold text-[#f7f8f8]">
                      {item.title}
                    </span>
                    <span className="font-mono-tabular text-xs font-medium text-[#8a8f98]">
                      {item.delta}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-[#9ea4b0]">
                    {item.summary}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Integrated Linear-style interactive comparison matrix */}
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.55, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
          className="linear-surface mt-8 overflow-hidden rounded-3xl"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.08] px-6 py-5 sm:px-8">
            <div>
              <h3 className="font-display text-lg font-semibold text-[#f7f8f8]">
                Systemvergleich: SINUS 2026 vs. Transformation 2035
              </h3>
              <p className="mt-0.5 text-xs text-[#8a8f98]">
                Wie sich Raumdimensionen, Milieuzahl und soziale Durchlässigkeit
                in neun Jahren verschieben
              </p>
            </div>

            <div
              role="group"
              aria-label="Vergleichsspalte hervorheben"
              className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-[#08090a] p-1 self-start sm:self-auto"
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
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    focus === tab.id
                      ? 'bg-white/[0.12] text-[#f7f8f8]'
                      : 'text-[#8a8f98] hover:text-[#f7f8f8]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile stacked comparison cards (no horizontal scroll needed on phones) */}
          <div className="divide-y divide-white/[0.06] md:hidden">
            {COMPARISON_ROWS.map((row, idx) => (
              <div key={row.criterion} className="p-5 space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="font-mono-tabular text-[11px] text-[#62666d]">
                    0{idx + 1}
                  </span>
                  <span className="text-sm font-semibold text-[#f7f8f8]">
                    {row.criterion}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2.5 text-xs">
                  <div
                    className={`rounded-xl border border-white/[0.06] bg-white/[0.015] p-3 transition-opacity ${
                      focus === '2035' ? 'opacity-35' : 'opacity-100'
                    }`}
                  >
                    <div className="text-[10.5px] font-medium text-[#8a8f98]">
                      2026 · 2D-Modell (10 Milieus)
                    </div>
                    <p className="mt-1 leading-relaxed text-[#b4bac4]">
                      {row.model2026}
                    </p>
                  </div>
                  <div
                    className={`rounded-xl border border-white/[0.1] bg-white/[0.03] p-3 transition-opacity ${
                      focus === '2026' ? 'opacity-35' : 'opacity-100'
                    }`}
                  >
                    <div className="text-[10.5px] font-medium text-emerald-400">
                      2035 · Schwebendes 3D-Modell (6 Milieus)
                    </div>
                    <p className="mt-1 leading-relaxed text-[#f7f8f8]">
                      {row.model2035}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop 3-column architectural comparison table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/[0.08] text-xs font-medium text-[#8a8f98]">
                  <th className="py-4 pl-6 sm:pl-8 pr-4 w-[24%]">Dimension</th>
                  <th
                    className={`py-4 px-5 w-[38%] transition-opacity duration-200 ${
                      focus === '2035' ? 'opacity-40' : 'opacity-100'
                    }`}
                  >
                    2026 · Klassisches 2D-Modell (10 Milieus)
                  </th>
                  <th
                    className={`py-4 pl-5 pr-6 sm:pr-8 w-[38%] bg-white/[0.02] text-[#f7f8f8] transition-opacity duration-200 ${
                      focus === '2026' ? 'opacity-40' : 'opacity-100'
                    }`}
                  >
                    2035 · Schwebendes 3D-Modell (6 Milieus)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {COMPARISON_ROWS.map((row, idx) => (
                  <tr
                    key={row.criterion}
                    className="align-top transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="py-5 pl-6 sm:pl-8 pr-4">
                      <div className="flex items-baseline gap-2.5">
                        <span className="font-mono-tabular text-[11px] text-[#62666d]">
                          0{idx + 1}
                        </span>
                        <span className="font-medium text-[#f7f8f8]">
                          {row.criterion}
                        </span>
                      </div>
                    </td>
                    <td
                      className={`py-5 px-5 leading-relaxed text-[#9ea4b0] transition-opacity duration-200 ${
                        focus === '2035' ? 'opacity-35' : 'opacity-100'
                      }`}
                    >
                      {row.model2026}
                    </td>
                    <td
                      className={`py-5 pl-5 pr-6 sm:pr-8 leading-relaxed bg-white/[0.02] text-[#f7f8f8] transition-opacity duration-200 ${
                        focus === '2026' ? 'opacity-35' : 'opacity-100'
                      }`}
                    >
                      {row.model2035}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
