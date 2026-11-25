import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { MilieuSpec, SimulationYear } from '../data/milieus';

interface MilieuSidebarProps {
  milieu: MilieuSpec | null;
  year: SimulationYear;
  onClose: () => void;
  onStep: (direction: -1 | 1) => void;
}

export function MilieuSidebar({
  milieu,
  year,
  onClose,
  onStep,
}: MilieuSidebarProps) {
  if (!milieu) return null;

  const activeShare = year === '2020' ? milieu.share2020 : milieu.share2035;
  const delta = milieu.share2035 - milieu.share2020;
  const deltaText =
    delta > 0 ? `+${delta} % vs. 2020` : delta < 0 ? `${delta} % vs. 2020` : '±0 % vs. 2020';

  return (
    <aside
      aria-label={`Detailansicht ${milieu.name}`}
      data-testid="milieu-sidebar"
      className="pointer-events-auto fixed top-4 right-4 bottom-24 z-30 w-[min(390px,calc(100vw-2rem))] rounded-2xl glass-panel flex flex-col overflow-hidden transition-transform duration-200"
    >
      {/* Top color hairline */}
      <div
        className="h-1 w-full shrink-0"
        style={{ backgroundColor: milieu.colorHex }}
        aria-hidden="true"
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 border-b border-slate-700/40">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span
              className="inline-block w-2.5 h-2.5 rounded-sm shrink-0"
              style={{ backgroundColor: milieu.colorHex }}
              aria-hidden="true"
            />
            <span>{milieu.badge2035}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular text-slate-300">
              {year === '2035' ? 'Prognose 2035' : 'Referenz 2020'}
            </span>
          </div>
          <h2 className="mt-1 font-display text-lg font-semibold leading-snug text-slate-50">
            {milieu.name}
          </h2>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Detailansicht schließen"
          className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 transition-colors focus-visible:outline-2 focus-visible:outline-sky-400"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto sidebar-scroll px-5 py-4 space-y-5 text-sm">
        {/* Population Share & Comparison */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-slate-900/70 border border-slate-700/40 p-3">
            <div className="text-xs text-slate-400">Bevölkerungsanteil {year}</div>
            <div className="mt-1 font-mono-tabular text-2xl font-semibold text-slate-50">
              {activeShare} %
            </div>
            <div className="mt-0.5 font-mono-tabular text-xs text-slate-400">
              {year === '2035' ? deltaText : `2035: ${milieu.share2035} %`}
            </div>
          </div>

          <div className="rounded-xl bg-slate-900/70 border border-slate-700/40 p-3">
            <div className="text-xs text-slate-400">Resilienz-Index (Z)</div>
            <div className="mt-1 font-mono-tabular text-2xl font-semibold text-slate-50">
              {milieu.resilienceScore}
              <span className="text-sm font-normal text-slate-400">/100</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${milieu.resilienceScore}%`,
                  backgroundColor: milieu.colorHex,
                }}
              />
            </div>
          </div>
        </div>

        {/* 3D Coordinate Classification */}
        <div className="space-y-2.5 border-t border-slate-700/40 pt-4">
          <h3 className="text-xs font-semibold tracking-wide text-slate-400">
            Verortung im 3D-Raum
          </h3>
          <dl className="space-y-2 text-[13px]">
            <div className="flex flex-col gap-0.5">
              <dt className="text-xs text-slate-400">Y-Achse · Soziale Lage</dt>
              <dd className="text-slate-100 font-medium">{milieu.socialLayerLabel}</dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-xs text-slate-400">X-Achse · Grundorientierung / Werte</dt>
              <dd className="text-slate-100 font-medium">{milieu.valueOrientationLabel}</dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-xs text-slate-400">Z-Achse · Krisen- &amp; Transformationsresilienz</dt>
              <dd className="text-slate-100 font-medium">{milieu.resilienceRatingLabel}</dd>
            </div>
          </dl>
        </div>

        {/* Scientific Causal Chain */}
        <div className="space-y-2.5 border-t border-slate-700/40 pt-4">
          <h3 className="text-xs font-semibold tracking-wide text-slate-400">
            Wissenschaftliche Kausalkette 2035
          </h3>
          <p className="text-[13px] leading-relaxed text-slate-200">
            {milieu.summary2035}
          </p>
          <ol className="space-y-2 pt-1">
            {milieu.causalChain.map((step, idx) => (
              <li key={idx} className="flex gap-2.5 text-[13px] leading-relaxed text-slate-300">
                <span
                  className="font-mono-tabular text-xs font-semibold mt-0.5 shrink-0"
                  style={{ color: milieu.colorHex }}
                >
                  0{idx + 1}.
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Key Drivers */}
        <div className="space-y-2 border-t border-slate-700/40 pt-4">
          <h3 className="text-xs font-semibold tracking-wide text-slate-400">
            Zentrale Treiber &amp; Konfliktlinie
          </h3>
          <ul className="space-y-1.5 text-[13px] text-slate-300">
            {milieu.keyDrivers.map((driver, idx) => (
              <li key={idx} className="flex items-baseline gap-2">
                <span className="text-slate-500" aria-hidden="true">–</span>
                <span>{driver}</span>
              </li>
            ))}
          </ul>
          <p className="pt-2 text-[12.5px] leading-relaxed text-slate-400">
            <strong className="text-slate-300 font-medium">Konfliktlinie:</strong>{' '}
            {milieu.conflictLine}
          </p>
        </div>
      </div>

      {/* Footer Step Controls */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-slate-700/40 bg-slate-950/50">
        <button
          type="button"
          onClick={() => onStep(-1)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-200 bg-slate-800/70 hover:bg-slate-700/80 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-sky-400"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Vorheriges Milieu
        </button>
        <button
          type="button"
          onClick={() => onStep(1)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-200 bg-slate-800/70 hover:bg-slate-700/80 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-sky-400"
        >
          Nächstes Milieu
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
}
