import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  RotateCcw,
  Share2,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { type RefObject, useCallback, useEffect, useRef, useState } from 'react';
import {
  AXIS_LABELS,
  CLASSIC_MILIEUS_2026,
  MILIEUS,
  type ClassicMilieu2026Spec,
  type MilieuSpec,
  type ModelMode,
} from '../data/milieus';
import type { SelectionPayload } from '../three/SinusSceneManager';

interface Hero3DStageProps {
  mode: ModelMode;
  onChangeMode: (mode: ModelMode) => void;
  canvasMountRef: RefObject<HTMLDivElement | null>;
  axisLabelRefs: RefObject<Record<string, HTMLDivElement | null>>;
  userMarkerLabelRef: RefObject<HTMLDivElement | null>;
  selection: SelectionPayload | null;
  onStep2035: (dir: -1 | 1) => void;
  onResetOverview: () => void;
  onStageResize: () => void;
  onOpenShare: () => void;
  contextLost: boolean;
  userResultCoords: { uX: number; uY: number; uZ: number } | null;
  onSelectMilieu: (sel: SelectionPayload) => void;
}

export function Hero3DStage({
  mode,
  onChangeMode,
  canvasMountRef,
  axisLabelRefs,
  userMarkerLabelRef,
  selection,
  onStep2035,
  onResetOverview,
  onStageResize,
  onOpenShare,
  contextLost,
  userResultCoords,
  onSelectMilieu,
}: Hero3DStageProps) {
  const stageBoxRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const selected2035: MilieuSpec | null =
    selection?.kind === '2035'
      ? (MILIEUS.find((m) => m.id === selection.id) ?? null)
      : null;

  const selected2026: ClassicMilieu2026Spec | null =
    selection?.kind === '2026'
      ? (CLASSIC_MILIEUS_2026.find((m) => m.id === selection.id) ?? null)
      : null;

  const toggleFullscreen = useCallback(async () => {
    const el = stageBoxRef.current;
    if (!isFullscreen) {
      setIsFullscreen(true);
      if (el && typeof el.requestFullscreen === 'function') {
        try {
          await el.requestFullscreen();
        } catch {
          // Graceful fallback: fixed-inset fullscreen mode remains active even inside sandboxed iframes
        }
      }
    } else {
      setIsFullscreen(false);
      if (
        document.fullscreenElement &&
        typeof document.exitFullscreen === 'function'
      ) {
        try {
          await document.exitFullscreen();
        } catch {
          // Ignore exit error
        }
      }
    }
    window.requestAnimationFrame(() => onStageResize());
  }, [isFullscreen, onStageResize]);

  useEffect(() => {
    const handleFsChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
        window.requestAnimationFrame(() => onStageResize());
      } else {
        window.requestAnimationFrame(() => onStageResize());
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
        window.requestAnimationFrame(() => onStageResize());
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen, onStageResize]);

  useEffect(() => {
    const t = window.setTimeout(() => onStageResize(), 60);
    return () => window.clearTimeout(t);
  }, [isFullscreen, onStageResize]);

  return (
    <section
      id="modell-3d"
      className="section-anchor relative pb-14 pt-6 sm:pb-16 sm:pt-12"
    >
      <div className="mx-auto max-w-[1320px] px-3.5 sm:px-6 lg:px-8">
        {/* Linear-style Editorial Header */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"
        >
          <div>
            <p className="text-[11px] sm:text-xs font-medium tracking-wide text-[#8a8f98]">
              Sozialstruktur Deutschland 2035 · Das schwebende 3D-SINUS-Modell
            </p>
            <h1 className="mt-2 font-display text-[28px] sm:text-5xl font-semibold tracking-tight text-[#f7f8f8] leading-[1.1] text-balance">
              Gesellschaft im Wandel: Deutschland 2035
            </h1>
            <p className="mt-2.5 text-sm sm:text-base text-[#9ea4b0]">
              Interaktives 3D-Sozialstrukturmodell auf Basis der SINUS-Milieus (2026)
            </p>
          </div>

          {/* Responsive pill mode switch (compact on mobile, full on sm+) */}
          <div
            role="group"
            aria-label="Modelljahr umschalten"
            className="grid grid-cols-2 w-full sm:w-auto sm:inline-flex items-center gap-1 rounded-full border border-white/[0.09] bg-[#111214] p-1"
          >
            <button
              type="button"
              onClick={() => onChangeMode('2026')}
              data-testid="toggle-mode-2026"
              aria-pressed={mode === '2026'}
              className={`rounded-full px-3 sm:px-3.5 py-2 text-xs font-medium transition-all cursor-pointer whitespace-nowrap text-center ${
                mode === '2026'
                  ? 'bg-[#f7f8f8] text-[#08090a] font-semibold shadow-sm'
                  : 'text-[#8a8f98] hover:text-[#f7f8f8]'
              }`}
            >
              <span className="sm:hidden">2026 · 2D (10)</span>
              <span className="hidden sm:inline">
                2026: Klassisches SINUS (10 Milieus, 2D)
              </span>
            </button>
            <button
              type="button"
              onClick={() => onChangeMode('2035')}
              data-testid="toggle-mode-2035"
              aria-pressed={mode === '2035'}
              className={`rounded-full px-3 sm:px-3.5 py-2 text-xs font-medium transition-all cursor-pointer whitespace-nowrap text-center ${
                mode === '2035'
                  ? 'bg-[#f7f8f8] text-[#08090a] font-semibold shadow-sm'
                  : 'text-[#8a8f98] hover:text-[#f7f8f8]'
              }`}
            >
              <span className="sm:hidden">2035 · 3D (6)</span>
              <span className="hidden sm:inline">
                2035: Schwebendes 3D-Modell (6 Milieus)
              </span>
            </button>
          </div>
        </motion.div>

        {/* Top Legend Bar with color dots and click-to-focus name selection */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          aria-label="Milieu-Legende & Direktwahl"
          className="mt-4 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2.5 rounded-2xl border border-white/[0.09] bg-[#111214]/90 px-3.5 py-2.5 backdrop-blur-md shadow-lg"
        >
          <span className="text-[11px] font-medium text-[#8a8f98] mr-1">
            {mode === '2035' ? 'Legende 2035 (Klick zum Fokus):' : 'Legende 2026:'}
          </span>
          {mode === '2035'
            ? MILIEUS.map((m) => {
                const isSelected = selection?.kind === '2035' && selection.id === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onSelectMilieu({ kind: '2035', id: m.id })}
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white text-[#08090a] font-semibold shadow-sm'
                        : 'bg-white/[0.04] text-[#e2e8f0] hover:bg-white/[0.1] hover:text-white'
                    }`}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: m.colorHex }}
                    />
                    <span>{m.shortName}</span>
                  </button>
                );
              })
            : CLASSIC_MILIEUS_2026.map((c) => {
                const isSelected = selection?.kind === '2026' && selection.id === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onSelectMilieu({ kind: '2026', id: c.id })}
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white text-[#08090a] font-semibold shadow-sm'
                        : 'bg-white/[0.04] text-[#e2e8f0] hover:bg-white/[0.1] hover:text-white'
                    }`}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: c.colorHex }}
                    />
                    <span>{c.shortName}</span>
                  </button>
                );
              })}
        </motion.div>

        {/* 3D Interactive Stage (on-bubble surface labels + seamless mobile/desktop sizing) */}
        <motion.div
          ref={stageBoxRef}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          data-testid="three-stage-box"
          data-fullscreen={isFullscreen ? 'true' : 'false'}
          data-mode={mode}
          data-selected={selection ? `${selection.kind}:${selection.id}` : 'none'}
          className={
            isFullscreen
              ? 'fixed inset-0 z-50 h-screen w-screen overflow-hidden bg-[#0b0c0e]'
              : 'relative mt-6 sm:mt-7 h-[58vh] min-h-[390px] sm:h-[68vh] sm:min-h-[520px] max-h-[780px] w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-white/[0.09] bg-[#0b0c0e] shadow-[0_24px_80px_rgba(0,0,0,0.65)]'
          }
        >
          {/* Isolated WebGL Canvas Mount */}
          <div
            ref={canvasMountRef}
            data-testid="three-canvas-host"
            className="absolute inset-0 h-full w-full z-0"
          />

          {/* WebGL Context Lost Fallback */}
          {contextLost && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#0b0c0e]/95 p-6 text-center">
              <div className="linear-surface max-w-md rounded-2xl p-6">
                <h2 className="font-display text-lg font-semibold text-[#f7f8f8]">
                  3D-Grafikkontext unterbrochen
                </h2>
                <p className="mt-2 text-sm text-[#9ea4b0]">
                  Die WebGL-Szene wird automatisch neu initialisiert.
                </p>
              </div>
            </div>
          )}

          {/* Projected Axis Labels + Optional Self-Test Beacon Tag (milieu labels live directly ON the 3D bubbles) */}
          <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
            {AXIS_LABELS.map((ax) => {
              const mobileText =
                ax.id === 'axis-x-left'
                  ? '← Tradition'
                  : ax.id === 'axis-x-right'
                    ? 'Öko · Tech →'
                    : ax.id === 'axis-y-back'
                      ? 'Oberschicht'
                      : ax.id === 'axis-y-front'
                        ? 'Prekariat / Unten'
                        : ax.id === 'axis-z-top'
                          ? 'Z: Resilienz'
                          : ax.text;
              return (
                <div
                  key={ax.id}
                  ref={(el) => {
                    if (axisLabelRefs.current) axisLabelRefs.current[ax.id] = el;
                  }}
                  data-testid={`axis-label-${ax.id}`}
                  style={{ opacity: 0 }}
                  className="absolute top-0 left-0 rounded-lg sm:rounded-xl bg-[#101216]/92 px-2 py-0.5 sm:px-2.5 sm:py-1 border border-white/[0.1] text-center transition-opacity duration-200"
                >
                  <div
                    className="text-[9.5px] sm:text-[11px] font-semibold tracking-tight whitespace-nowrap"
                    style={{ color: ax.accentColor }}
                  >
                    <span className="sm:hidden">{mobileText}</span>
                    <span className="hidden sm:inline">{ax.text}</span>
                  </div>
                  {ax.subtext && (
                    <div className="hidden sm:block text-[9.5px] text-[#8a8f98] whitespace-nowrap">
                      {ax.subtext}
                    </div>
                  )}
                </div>
              );
            })}

            {/* User Self-Test 3D Marker Badge */}
            <div
              ref={userMarkerLabelRef}
              data-testid="user-marker-label"
              style={{ opacity: 0 }}
              className="absolute top-0 left-0 rounded-xl border border-emerald-400/50 bg-[#f7f8f8] px-2.5 py-1 sm:px-3 sm:py-1.5 text-[#08090a] shadow-lg"
            >
              <div className="text-[10.5px] sm:text-[11px] font-semibold whitespace-nowrap">
                Dein Standort 2035
              </div>
              {userResultCoords && (
                <div className="font-mono-tabular text-[9px] sm:text-[9.5px] text-[#475569] whitespace-nowrap">
                  X {Math.round(userResultCoords.uX)} · Y{' '}
                  {Math.round(userResultCoords.uY)} · Z{' '}
                  {Math.round(userResultCoords.uZ)}
                </div>
              )}
            </div>
          </div>

          {/* Top toolbar: reset, fullscreen, share & hint */}
          <div className="pointer-events-none absolute top-3 left-3 right-3 sm:top-3.5 sm:left-3.5 sm:right-3.5 z-20 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={onResetOverview}
                data-testid="reset-camera-btn"
                className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-white/[0.12] bg-[#141519]/92 px-3 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-medium text-[#e2e8f0] hover:bg-[#1c1e24] hover:text-white cursor-pointer transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Übersicht</span>
              </button>

              <button
                type="button"
                onClick={toggleFullscreen}
                data-testid="fullscreen-toggle-btn"
                aria-label={
                  isFullscreen ? 'Vollbild verlassen' : 'Im Vollbild vergrößern'
                }
                className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-white/[0.12] bg-[#141519]/92 px-3 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-medium text-[#e2e8f0] hover:bg-[#1c1e24] hover:text-white cursor-pointer transition-colors"
              >
                {isFullscreen ? (
                  <>
                    <Minimize2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Verkleinern</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Vollbild</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onOpenShare}
                data-testid="open-share-btn"
                aria-label="Vorschau-Link teilen"
                className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-white/[0.12] bg-[#141519]/92 px-3 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-medium text-[#e2e8f0] hover:bg-[#1c1e24] hover:text-white cursor-pointer transition-colors"
              >
                <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Teilen</span>
              </button>

              <span className="hidden xl:inline-block rounded-full border border-white/[0.08] bg-[#101216]/85 px-3 py-1.5 text-[11px] text-[#8a8f98]">
                Ziehen zum Drehen · Scrollen zum Zoomen · Bubble anklicken für
                Steckbrief
              </span>
            </div>

            {/* Inside Fullscreen, keep mode switcher reachable directly in top-right */}
            {isFullscreen && !selected2035 && !selected2026 && (
              <div className="pointer-events-auto inline-flex items-center gap-1 rounded-full border border-white/[0.12] bg-[#111214]/92 p-1">
                <button
                  type="button"
                  onClick={() => onChangeMode('2026')}
                  className={`rounded-full px-3 py-1 text-xs font-medium cursor-pointer transition-colors ${
                    mode === '2026'
                      ? 'bg-[#f7f8f8] text-[#08090a] font-semibold'
                      : 'text-[#8a8f98] hover:text-white'
                  }`}
                >
                  2026 (2D)
                </button>
                <button
                  type="button"
                  onClick={() => onChangeMode('2035')}
                  className={`rounded-full px-3 py-1 text-xs font-medium cursor-pointer transition-colors ${
                    mode === '2035'
                      ? 'bg-[#f7f8f8] text-[#08090a] font-semibold'
                      : 'text-[#8a8f98] hover:text-white'
                  }`}
                >
                  2035 (3D)
                </button>
              </div>
            )}
          </div>

          {/* Mobile subtle touch hint when no panel is open */}
          {!selected2035 && !selected2026 && (
            <div className="pointer-events-none absolute bottom-2.5 left-1/2 -translate-x-1/2 z-10 lg:hidden">
              <span className="rounded-full border border-white/[0.08] bg-[#101216]/88 px-3 py-1 text-[10px] text-[#8a8f98] whitespace-nowrap">
                Tippen für Steckbrief · Wischen zum Drehen
              </span>
            </div>
          )}

          {/* Steckbrief Panel: sleek bottom sheet on mobile, right drawer on sm+ */}
          {(selected2035 || selected2026) && (
            <aside
              aria-label="Milieu-Steckbrief"
              data-testid="milieu-steckbrief"
              className="absolute inset-x-3 bottom-3 max-h-[60%] sm:inset-auto sm:top-4 sm:right-4 sm:bottom-4 sm:max-h-none z-20 flex sm:w-[370px] flex-col overflow-hidden rounded-2xl border border-white/[0.12] bg-[#101216]/96 shadow-2xl"
            >
              {selected2035 && (
                <>
                  <div className="flex items-start justify-between gap-3 border-b border-white/[0.08] px-4 py-3.5 sm:px-5 sm:pt-5 sm:pb-4">
                    <div>
                      <div className="flex items-center gap-2 text-[11px] font-medium text-[#8a8f98]">
                        <span
                          className="inline-block h-2 w-2 rounded-[2px]"
                          style={{ backgroundColor: selected2035.colorHex }}
                          aria-hidden="true"
                        />
                        <span>
                          Steckbrief 2035 · {selected2035.badge2035}
                        </span>
                      </div>
                      <h3 className="mt-1 font-display text-base sm:text-lg font-semibold leading-snug text-[#f7f8f8]">
                        {selected2035.name}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={onResetOverview}
                      aria-label="Steckbrief schließen"
                      data-testid="close-steckbrief-btn"
                      className="rounded-full border border-white/[0.1] p-1.5 text-[#8a8f98] hover:bg-white/[0.06] hover:text-white cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="sidebar-scroll flex-1 overflow-y-auto px-4 py-3.5 sm:px-5 sm:py-4 space-y-3.5 sm:space-y-4 text-sm">
                    <div className="grid grid-cols-2 gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 sm:p-3.5">
                      <div>
                        <div className="text-[11px] text-[#8a8f98]">
                          Bevölkerungsanteil
                        </div>
                        <div
                          className="mt-0.5 font-mono-tabular text-base sm:text-lg font-semibold"
                          style={{ color: selected2035.colorHex }}
                        >
                          {selected2035.share2035} %
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] text-[#8a8f98]">
                          Flughöhe (Z-Achse)
                        </div>
                        <div className="mt-0.5 font-mono-tabular text-base sm:text-lg font-semibold text-[#f7f8f8]">
                          {selected2035.resilienceScore} / 100
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-medium text-[#f7f8f8]">
                        Lage &amp; Werte
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-[#9ea4b0]">
                        {selected2035.socialLayerLabel}
                      </p>
                    </div>

                    <div>
                      <div className="text-xs font-medium text-[#f7f8f8]">
                        Soziologisches Profil
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-[#9ea4b0]">
                        {selected2035.detailedProfile}
                      </p>
                    </div>

                    <div>
                      <div className="text-xs font-medium text-[#f7f8f8]">
                        Entstehung aus 2026
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-[#9ea4b0]">
                        {selected2035.originFrom2026}
                      </p>
                    </div>

                    <div>
                      <div className="text-xs font-medium text-[#f7f8f8]">
                        Kausalkette 2035
                      </div>
                      <ol className="mt-1.5 space-y-2 text-xs leading-relaxed text-[#9ea4b0]">
                        {selected2035.causalChain.map((step, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="font-mono-tabular font-semibold text-[#62666d]">
                              {i + 1}.
                            </span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    <div>
                      <div className="text-xs font-medium text-[#f7f8f8]">
                        Konfliktlinie
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-[#9ea4b0]">
                        {selected2035.conflictLine}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/[0.08] px-4 py-2.5 sm:px-5 sm:py-3">
                    <button
                      type="button"
                      onClick={() => onStep2035(-1)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#9ea4b0] hover:text-white cursor-pointer"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                      <span>Vorheriges</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onStep2035(1)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#9ea4b0] hover:text-white cursor-pointer"
                    >
                      <span>Nächstes</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </>
              )}

              {selected2026 && (
                <>
                  <div className="flex items-start justify-between gap-3 border-b border-white/[0.08] px-4 py-3.5 sm:px-5 sm:pt-5 sm:pb-4">
                    <div>
                      <div className="flex items-center gap-2 text-[11px] font-medium text-[#8a8f98]">
                        <span
                          className="inline-block h-2 w-2 rounded-[2px]"
                          style={{ backgroundColor: selected2026.colorHex }}
                          aria-hidden="true"
                        />
                        <span>Klassisches SINUS-Modell 2026 (2D)</span>
                      </div>
                      <h3 className="mt-1 font-display text-base sm:text-lg font-semibold leading-snug text-[#f7f8f8]">
                        {selected2026.name}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={onResetOverview}
                      aria-label="Steckbrief schließen"
                      data-testid="close-steckbrief-btn"
                      className="rounded-full border border-white/[0.1] p-1.5 text-[#8a8f98] hover:bg-white/[0.06] hover:text-white cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="sidebar-scroll flex-1 overflow-y-auto px-4 py-3.5 sm:px-5 sm:py-4 space-y-3.5 sm:space-y-4 text-sm">
                    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 sm:p-3.5">
                      <div className="text-[11px] text-[#8a8f98]">
                        Bevölkerungsanteil 2026
                      </div>
                      <div
                        className="mt-0.5 font-mono-tabular text-base sm:text-lg font-semibold"
                        style={{ color: selected2026.colorHex }}
                      >
                        {selected2026.share2026} %
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-medium text-[#f7f8f8]">
                        Verortung im 2D-Raum
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-[#9ea4b0]">
                        {selected2026.socialLayer} ·{' '}
                        {selected2026.valueOrientation}
                      </p>
                    </div>

                    <div>
                      <div className="text-xs font-medium text-[#f7f8f8]">
                        Charakteristik 2026
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-[#9ea4b0]">
                        {selected2026.description}
                      </p>
                    </div>

                    <div className="border-t border-white/[0.08] pt-3.5">
                      <div className="text-xs font-medium text-[#f7f8f8]">
                        Entwicklung bis 2035
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-[#cbd5e1]">
                        {selected2026.evolvesInto}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </aside>
          )}
        </motion.div>
      </div>
    </section>
  );
}
