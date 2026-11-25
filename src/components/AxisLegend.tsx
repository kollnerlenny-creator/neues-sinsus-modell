import { ChevronDown, ChevronUp } from 'lucide-react';
import { MILIEUS, type MilieuId } from '../data/milieus';
import { interpolateMilieuFrame } from '../utils/projection';

interface AxisLegendProps {
  hidden?: boolean;
  isOpen: boolean;
  onToggleOpen: () => void;
  progress: number;
  hoveredId: MilieuId | null;
  onSelectMilieu: (id: MilieuId) => void;
  onHoverMilieu: (id: MilieuId | null) => void;
}

export function AxisLegend({
  hidden = false,
  isOpen,
  onToggleOpen,
  progress,
  hoveredId,
  onSelectMilieu,
  onHoverMilieu,
}: AxisLegendProps) {
  if (hidden) return null;

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={onToggleOpen}
        aria-expanded={false}
        data-testid="toggle-legend-btn"
        className="pointer-events-auto fixed bottom-24 left-4 min-[1400px]:bottom-5 min-[1400px]:left-5 z-20 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl glass-panel text-xs font-medium text-slate-200 hover:text-white hover:border-slate-500/50 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-400"
      >
        <ChevronUp className="w-3.5 h-3.5 shrink-0 text-slate-400" />
        <span>Legende einblenden</span>
      </button>
    );
  }

  return (
    <aside
      aria-label="Legende: Milieus, Achsen, Pfeile und Verbindungen"
      data-testid="legend-panel"
      className="pointer-events-auto fixed bottom-24 left-4 min-[1400px]:bottom-5 min-[1400px]:left-5 z-20 w-72 max-h-[calc(100vh-195px)] min-[1400px]:max-h-[calc(100vh-115px)] overflow-y-auto rounded-2xl glass-panel px-3.5 py-2.5 text-xs"
    >
      {/* Interactive Milieu Legend + Collapse Toggle */}
      <div className="flex items-center justify-between gap-2 mb-1">
        <h2 className="font-display text-[10.5px] font-semibold tracking-wider text-slate-400 uppercase">
          Milieus · Klicken für Details
        </h2>
        <button
          type="button"
          onClick={onToggleOpen}
          aria-expanded={true}
          aria-label="Legende ausblenden"
          data-testid="toggle-legend-btn"
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-400 shrink-0"
        >
          <span>Ausblenden</span>
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>
      <ul className="space-y-0" role="list">
        {MILIEUS.map((m) => {
          const frame = interpolateMilieuFrame(m, progress);
          const isHovered = hoveredId === m.id;
          return (
            <li key={m.id}>
              <button
                type="button"
                data-testid={`legend-milieu-${m.id}`}
                onClick={() => onSelectMilieu(m.id)}
                onMouseEnter={() => onHoverMilieu(m.id)}
                onMouseLeave={() => onHoverMilieu(null)}
                className={`w-full flex items-center justify-between gap-2 px-2 py-[3px] rounded-lg text-left transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-400 ${
                  isHovered
                    ? 'bg-slate-800/85 text-white'
                    : 'text-slate-200 hover:bg-slate-800/65 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-xs shrink-0"
                    style={{
                      backgroundColor: m.colorHex,
                      boxShadow: `0 0 8px ${m.colorHex}66`,
                    }}
                    aria-hidden="true"
                  />
                  <span className="text-[11px] font-medium truncate">
                    {m.shortName}
                  </span>
                </span>
                <span className="font-mono-tabular text-[10.5px] text-slate-400 shrink-0">
                  {frame.share} %
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* 3D Axes */}
      <div className="mt-2 pt-2 border-t border-slate-700/45">
        <h2 className="font-display text-[10.5px] font-semibold tracking-wider text-slate-400 uppercase mb-1">
          Achsenmodell
        </h2>
        <dl className="space-y-0.5 text-[11px]">
          <div className="flex items-baseline gap-2">
            <dt className="font-mono-tabular font-semibold text-sky-400 shrink-0 w-3">X</dt>
            <dd className="text-slate-300 leading-snug">Grundorientierung &amp; Werte</dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="font-mono-tabular font-semibold text-violet-400 shrink-0 w-3">Y</dt>
            <dd className="text-slate-300 leading-snug">Soziale Lage (Niedrig → Hoch)</dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="font-mono-tabular font-semibold text-emerald-400 shrink-0 w-3">Z</dt>
            <dd className="text-slate-300 leading-snug">Transformationsresilienz 2035</dd>
          </div>
        </dl>
      </div>

      {/* Arrows & Connections */}
      <div className="mt-2 pt-2 border-t border-slate-700/45">
        <h2 className="font-display text-[10.5px] font-semibold tracking-wider text-slate-400 uppercase mb-1">
          Pfeile &amp; Verbindungen
        </h2>
        <ul className="space-y-1.5 text-[11px] text-slate-300">
          <li className="flex items-start gap-2">
            <svg width="18" height="12" viewBox="0 0 20 14" className="shrink-0 mt-0.5" aria-hidden="true">
              <path d="M2 11 Q9 9 16 3" fill="none" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" />
              <polygon points="18,1.5 12.5,2.5 16.5,6.5" fill="#10b981" />
            </svg>
            <div className="leading-snug">
              <span className="font-medium text-emerald-300">Aufstieg:</span>{' '}
              KI-Anpassung (Mitte → Avantgarde)
            </div>
          </li>
          <li className="flex items-start gap-2">
            <svg width="18" height="12" viewBox="0 0 20 14" className="shrink-0 mt-0.5" aria-hidden="true">
              <path d="M2 3 Q9 5 16 11" fill="none" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" />
              <polygon points="18,12.5 16.5,7.5 12.5,11.5" fill="#ef4444" />
            </svg>
            <div className="leading-snug">
              <span className="font-medium text-rose-300">Abstieg:</span>{' '}
              Abstiegsdruck (Mitte → Prekariat)
            </div>
          </li>
          <li className="flex items-start gap-2">
            <svg width="18" height="12" viewBox="0 0 20 14" className="shrink-0 mt-0.5" aria-hidden="true">
              <line x1="10" y1="1" x2="10" y2="9" stroke="#f59e0b" strokeWidth="2" strokeDasharray="2.5 2" />
              <polygon points="10,13 6.5,8.5 13.5,8.5" fill="#f59e0b" />
            </svg>
            <div className="leading-snug">
              <span className="font-medium text-amber-300">Gestrichelt (↓):</span>{' '}
              Statusverlust der Mitte
            </div>
          </li>
          <li className="flex items-start gap-2">
            <svg width="18" height="12" viewBox="0 0 20 14" className="shrink-0 mt-0.5" aria-hidden="true">
              <line x1="2" y1="7" x2="18" y2="7" stroke="#e11d48" strokeWidth="5" strokeOpacity="0.28" strokeLinecap="round" />
              <line x1="2" y1="7" x2="18" y2="7" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <div className="leading-snug">
              <span className="font-medium text-rose-200">Rote Gräben:</span>{' '}
              Fragmentierung &amp; Distanz
            </div>
          </li>
        </ul>
      </div>
    </aside>
  );
}
