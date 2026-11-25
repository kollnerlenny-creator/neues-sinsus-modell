import {
  ChevronDown,
  ChevronUp,
  Download,
  GitCommitHorizontal,
  RotateCcw,
  RefreshCw,
} from 'lucide-react';
import { getDisplayYear } from '../utils/projection';

interface ControlDockProps {
  progress: number;
  onScrubProgress: (value: number) => void;
  onAnimateToProgress: (value: number) => void;
  showRiftsAndArrows: boolean;
  onToggleRiftsAndArrows: () => void;
  onResetCamera: () => void;
  autoRotate: boolean;
  onToggleAutoRotate: () => void;
  onExportStandaloneHtml: () => void;
  onOpenSelfTest: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export function ControlDock({
  progress,
  onScrubProgress,
  onAnimateToProgress,
  showRiftsAndArrows,
  onToggleRiftsAndArrows,
  onResetCamera,
  autoRotate,
  onToggleAutoRotate,
  onExportStandaloneHtml,
  onOpenSelfTest,
  collapsed,
  onToggleCollapsed,
}: ControlDockProps) {
  const displayYear = getDisplayYear(progress);
  const pct = Math.round(progress * 100);
  const riftsActive = progress > 0.15;

  return (
    <div
      className={`pointer-events-none fixed bottom-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center transition-transform duration-200 ${
        collapsed ? 'translate-y-[calc(100%-34px)]' : 'translate-y-0'
      }`}
    >
      {/* Top Dock Strip: Glowing Self-Test CTA + Collapse Tab */}
      <div className="pointer-events-auto mb-1.5 flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenSelfTest}
          data-testid="start-selftest-btn"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-500/30 via-teal-500/25 to-cyan-500/30 text-emerald-100 border border-emerald-400/60 shadow-[0_0_20px_rgba(16,185,129,0.34)] hover:shadow-[0_0_26px_rgba(16,185,129,0.55)] hover:border-emerald-300 transition-all whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-400"
        >
          <span>🎯 Milieu-Selbsttest 2035 starten</span>
        </button>

        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Steuerungsleiste einblenden' : 'Steuerungsleiste ausblenden'}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-panel text-[11px] font-medium text-slate-300 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-400"
        >
          {collapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              Steuerung einblenden
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              Steuerung ausblenden
            </>
          )}
        </button>
      </div>

      {/* Main horizontal control dock */}
      <nav
        aria-label="Steuerungsleiste"
        className="pointer-events-auto glass-panel rounded-2xl p-1.5 flex flex-wrap lg:flex-nowrap items-center justify-center gap-1.5 max-w-[94vw]"
      >
        {/* Continuous 2D <-> 3D Morph Slider with clickable endpoints */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-900/90 border border-slate-700/50 shrink-0 min-h-[40px]">
          <button
            type="button"
            onClick={() => onAnimateToProgress(0)}
            data-testid="btn-year-2020"
            className={`px-2 py-1 rounded-lg text-[11.5px] font-semibold transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-sky-400 ${
              progress < 0.15
                ? 'bg-amber-500/25 text-amber-200 border border-amber-400/40'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            2020 (2D)
          </button>

          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={1}
              step={0.005}
              value={progress}
              onChange={(e) => onScrubProgress(parseFloat(e.target.value))}
              aria-label="Transformationsregler zwischen 2020 (2D) und 2035 (3D)"
              data-testid="morph-slider"
              style={{
                background: `linear-gradient(to right, #f59e0b 0%, #10b981 ${pct}%, rgba(51,65,85,0.75) ${pct}%)`,
              }}
              className="morph-slider w-28 sm:w-36"
            />
            <span
              data-testid="morph-year-readout"
              className="font-mono-tabular text-[11.5px] font-semibold text-slate-200 w-9 text-center shrink-0"
            >
              {displayYear}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onAnimateToProgress(1)}
            data-testid="btn-year-2035"
            className={`px-2 py-1 rounded-lg text-[11.5px] font-semibold transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-sky-400 ${
              progress > 0.85
                ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/40'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            2035 (3D)
          </button>
        </div>

        {/* Rifts & Arrows Toggle */}
        <button
          type="button"
          onClick={onToggleRiftsAndArrows}
          disabled={!riftsActive}
          aria-pressed={riftsActive && showRiftsAndArrows}
          data-testid="toggle-rifts-btn"
          title={
            riftsActive
              ? 'Soziale Gräben und Mobilitätspfeile ein- oder ausblenden'
              : 'Bewege den Regler Richtung 2035 (3D), um Gräben und Pfeile einzublenden'
          }
          className={`min-h-[40px] px-3 py-2 rounded-xl text-xs font-medium inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-sky-400 ${
            !riftsActive
              ? 'bg-slate-900/40 text-slate-500 border border-slate-800/60 cursor-not-allowed'
              : showRiftsAndArrows
                ? 'bg-rose-500/18 text-rose-200 border border-rose-400/35 hover:bg-rose-500/28'
                : 'bg-slate-800/70 text-slate-300 border border-slate-700/50 hover:bg-slate-700/80'
          }`}
        >
          <GitCommitHorizontal className="w-3.5 h-3.5 shrink-0" />
          <span>Gräben &amp; Pfeile</span>
        </button>

        {/* Reset View & Focus */}
        <button
          type="button"
          onClick={onResetCamera}
          data-testid="reset-camera-btn"
          className="min-h-[40px] px-3 py-2 rounded-xl text-xs font-medium inline-flex items-center gap-2 bg-slate-800/70 text-slate-200 border border-slate-700/50 hover:bg-slate-700/80 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-sky-400"
        >
          <RotateCcw className="w-3.5 h-3.5 shrink-0" />
          <span>Übersicht</span>
        </button>

        {/* Auto-Rotation */}
        <button
          type="button"
          onClick={onToggleAutoRotate}
          aria-pressed={autoRotate}
          data-testid="toggle-autorotate-btn"
          className={`min-h-[40px] px-3 py-2 rounded-xl text-xs font-medium inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-sky-400 ${
            autoRotate
              ? 'bg-sky-500/20 text-sky-200 border border-sky-400/40 hover:bg-sky-500/30'
              : 'bg-slate-800/70 text-slate-300 border border-slate-700/50 hover:bg-slate-700/80'
          }`}
        >
          <RefreshCw className="w-3.5 h-3.5 shrink-0" />
          <span>Drehen</span>
        </button>

        {/* Export single-file HTML */}
        <button
          type="button"
          onClick={onExportStandaloneHtml}
          data-testid="export-html-btn"
          title="Eigenständige Einzel-HTML-Datei (Three.js via CDN) herunterladen"
          className="min-h-[40px] px-3 py-2 rounded-xl text-xs font-medium inline-flex items-center gap-1.5 bg-slate-800/70 text-slate-200 border border-slate-700/50 hover:bg-slate-700/80 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-sky-400"
        >
          <Download className="w-3.5 h-3.5 shrink-0" />
          <span>.HTML</span>
        </button>
      </nav>
    </div>
  );
}
