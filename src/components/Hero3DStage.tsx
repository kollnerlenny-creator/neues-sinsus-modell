import {
  ChevronLeft,
  ChevronRight,
  Compass,
  GitBranch,
  Layers,
  Maximize2,
  Minimize2,
  RotateCcw,
  Share2,
  Swords,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { AnimatePresence, motion, useScroll, useSpring, useTransform } from 'motion/react';
import { type RefObject, useCallback, useEffect, useRef, useState } from 'react';
import {
  CLASSIC_MILIEUS_2026,
  MILIEUS,
  type ClassicMilieu2026Spec,
  type MilieuSpec,
  type ModelMode,
} from '../data/milieus';
import type { SelectionPayload } from '../three/SinusSceneManager';
import { getMilieuIcon } from '../utils/milieuIcons';

interface Hero3DStageProps {
  mode: ModelMode;
  onChangeMode: (mode: ModelMode) => void;
  canvasMountRef: RefObject<HTMLDivElement | null>;
  userMarkerLabelRef: RefObject<HTMLDivElement | null>;
  selection: SelectionPayload | null;
  onStep2035: (dir: -1 | 1) => void;
  onResetOverview: () => void;
  onStageResize: () => void;
  onOpenShare: () => void;
  contextLost: boolean;
  userResultCoords: { uX: number; uY: number; uZ: number } | null;
  onSelectMilieu: (sel: SelectionPayload) => void;
  onZoomStep: (dir: 'in' | 'out') => void;
  onFullscreenChange: (fullscreen: boolean) => void;
}

export function Hero3DStage({
  mode,
  onChangeMode,
  canvasMountRef,
  userMarkerLabelRef,
  selection,
  onStep2035,
  onResetOverview,
  onStageResize,
  onOpenShare,
  contextLost,
  userResultCoords,
  onSelectMilieu,
  onZoomStep,
  onFullscreenChange,
}: Hero3DStageProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const stageBoxRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start 96%', 'start 32%'],
  });
  const rawScale = useTransform(scrollYProgress, [0, 1], [0.95, 1]);
  const rawY = useTransform(scrollYProgress, [0, 1], [30, 0]);
  const rawOpacity = useTransform(scrollYProgress, [0, 1], [0.55, 1]);
  const stageScale = useSpring(rawScale, { stiffness: 180, damping: 28 });
  const stageY = useSpring(rawY, { stiffness: 180, damping: 28 });

  const selected2035: MilieuSpec | null =
    selection?.kind === '2035'
      ? (MILIEUS.find((m) => m.id === selection.id) ?? null)
      : null;

  const selected2026: ClassicMilieu2026Spec | null =
    selection?.kind === '2026'
      ? (CLASSIC_MILIEUS_2026.find((m) => m.id === selection.id) ?? null)
      : null;

  const SelectedIcon = selected2035 ? getMilieuIcon(selected2035.id) : Layers;

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
    onFullscreenChange(isFullscreen);
    const t = window.setTimeout(() => onStageResize(), 60);
    return () => window.clearTimeout(t);
  }, [isFullscreen, onFullscreenChange, onStageResize]);

  return (
    <section
      ref={sectionRef}
      id="modell-3d"
      className="section-anchor relative border-t border-white/[0.06] pb-16 pt-10 sm:pb-22 sm:pt-14"
    >
      <div className="mx-auto max-w-[1360px] px-3.5 sm:px-6 lg:px-8">
        {/* Linear-style Asymmetric Split Editorial Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-end"
        >
          <div className="lg:col-span-7">
            <p className="text-xs sm:text-sm font-medium tracking-wide text-[#9ea4b0]">
              Interaktives Raummodell · 2026 vs. 2035
            </p>
            <h2 className="mt-2 font-display text-3xl sm:text-5xl lg:text-[48px] font-semibold tracking-tight text-[#f7f8f8] leading-[1.08] text-balance">
              Das schwebende 3D-SINUS-Modell
            </h2>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-4 lg:items-end">
            <p className="text-base sm:text-[17px] leading-relaxed text-[#b4bac4] lg:text-right max-w-lg text-balance">
              Drehe den sozialen Raum frei um alle Achsen und vergleiche die 10
              klassischen Lebenswelten 2026 mit 6 Zukunfts-Blöcken 2035.
            </p>

            {/* Animated Segmented Mode Toggle */}
            <div
              role="group"
              aria-label="Modelljahr umschalten"
              className="grid grid-cols-2 w-full sm:w-auto sm:inline-flex items-center gap-1 rounded-full border border-white/[0.1] bg-[#0b0d11] p-1 shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset]"
            >
              <button
                type="button"
                onClick={() => onChangeMode('2026')}
                data-testid="toggle-mode-2026"
                aria-pressed={mode === '2026'}
                className={`relative rounded-full px-3.5 sm:px-4 py-2 text-[13px] font-medium transition-colors cursor-pointer whitespace-nowrap text-center ${
                  mode === '2026'
                    ? 'text-[#040406] font-semibold'
                    : 'text-[#9ea4b0] hover:text-[#f7f8f8]'
                }`}
              >
                {mode === '2026' && (
                  <motion.span
                    layoutId="hero-mode-pill"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    className="absolute inset-0 rounded-full bg-[#f7f8f8] shadow-sm"
                  />
                )}
                <span className="relative z-10 sm:hidden">2026 · 2D (10)</span>
                <span className="relative z-10 hidden sm:inline">
                  2026: Klassisch (10 Milieus)
                </span>
              </button>
              <button
                type="button"
                onClick={() => onChangeMode('2035')}
                data-testid="toggle-mode-2035"
                aria-pressed={mode === '2035'}
                className={`relative rounded-full px-3.5 sm:px-4 py-2 text-[13px] font-medium transition-colors cursor-pointer whitespace-nowrap text-center ${
                  mode === '2035'
                    ? 'text-[#040406] font-semibold'
                    : 'text-[#9ea4b0] hover:text-[#f7f8f8]'
                }`}
              >
                {mode === '2035' && (
                  <motion.span
                    layoutId="hero-mode-pill"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    className="absolute inset-0 rounded-full bg-[#f7f8f8] shadow-sm"
                  />
                )}
                <span className="relative z-10 sm:hidden">2035 · 3D (6)</span>
                <span className="relative z-10 hidden sm:inline">
                  2035: Schwebend 3D (6 Milieus)
                </span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Scroll-Driven Linear Architectural 3D Stage Window Fading into Black */}
        <motion.div
          ref={stageBoxRef}
          style={
            isFullscreen
              ? undefined
              : {
                  scale: stageScale,
                  y: stageY,
                  opacity: rawOpacity,
                }
          }
          data-testid="three-stage-box"
          data-fullscreen={isFullscreen ? 'true' : 'false'}
          data-mode={mode}
          data-selected={selection ? `${selection.kind}:${selection.id}` : 'none'}
          className={
            isFullscreen
              ? 'fixed inset-0 z-50 flex h-screen w-screen flex-col overflow-hidden bg-[#040406]'
              : 'linear-fade-window relative mt-6 sm:mt-7 flex h-[70vh] min-h-[520px] sm:h-[74vh] sm:min-h-[600px] lg:h-[76vh] max-h-[820px] w-full flex-col overflow-hidden rounded-2xl sm:rounded-3xl'
          }
        >
          {/* Dedicated Linear Window Chrome (never overlaps the 3D scene or right drawer) */}
          <div className="shrink-0 border-b border-white/[0.08] bg-[#0b0d11]/95">
            {/* Row 1: Action controls & interaction hint */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 sm:px-5 sm:py-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={onResetOverview}
                  data-testid="reset-camera-btn"
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.12] bg-white/[0.04] px-3.5 py-1.5 text-xs sm:text-[13px] font-medium text-[#e2e8f0] hover:bg-white/[0.1] hover:text-white cursor-pointer transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Übersicht</span>
                </button>

                <div
                  role="group"
                  aria-label="3D-Ansicht zoomen"
                  className="inline-flex items-center rounded-full border border-white/[0.12] bg-white/[0.04] p-0.5"
                >
                  <button
                    type="button"
                    onClick={() => onZoomStep('out')}
                    data-testid="zoom-out-btn"
                    aria-label="Herauszoomen"
                    title="Herauszoomen"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[#e2e8f0] hover:bg-white/[0.1] hover:text-white cursor-pointer transition-colors"
                  >
                    <ZoomOut className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onZoomStep('in')}
                    data-testid="zoom-in-btn"
                    aria-label="Heranzoomen"
                    title="Heranzoomen"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[#e2e8f0] hover:bg-white/[0.1] hover:text-white cursor-pointer transition-colors"
                  >
                    <ZoomIn className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={toggleFullscreen}
                  data-testid="fullscreen-toggle-btn"
                  aria-label={
                    isFullscreen ? 'Vollbild verlassen' : 'Im Vollbild vergrößern'
                  }
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.12] bg-white/[0.04] px-3.5 py-1.5 text-xs sm:text-[13px] font-medium text-[#e2e8f0] hover:bg-white/[0.1] hover:text-white cursor-pointer transition-colors"
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
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.12] bg-white/[0.04] px-3.5 py-1.5 text-xs sm:text-[13px] font-medium text-[#e2e8f0] hover:bg-white/[0.1] hover:text-white cursor-pointer transition-colors"
                >
                  <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Teilen</span>
                </button>
              </div>

              <div className="flex items-center gap-2.5">
                <span className="hidden lg:inline-block text-xs sm:text-[13px] text-[#8a8f98]">
                  {isFullscreen
                    ? 'Ziehen zum Drehen · Scrollen zum Zoomen · Insel anklicken'
                    : 'Ziehen zum Drehen · Strg + Scrollen oder +/− zum Zoomen · Insel anklicken'}
                </span>

                {isFullscreen && (
                  <div className="inline-flex items-center gap-1 rounded-full border border-white/[0.12] bg-[#14161b] p-1">
                    <button
                      type="button"
                      onClick={() => onChangeMode('2026')}
                      className={`rounded-full px-3 py-1 text-xs font-medium cursor-pointer transition-colors ${
                        mode === '2026'
                          ? 'bg-[#f7f8f8] text-[#08090a] font-semibold'
                          : 'text-[#9ea4b0] hover:text-white'
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
                          : 'text-[#9ea4b0] hover:text-white'
                      }`}
                    >
                      2035 (3D)
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Row 2: Milieu Direct-Selection & Legend Strip */}
            <div
              aria-label="Milieu-Legende & Direktwahl"
              className="sidebar-scroll flex flex-nowrap overflow-x-auto sm:flex-wrap sm:overflow-visible items-center gap-1.5 border-t border-white/[0.06] bg-[#0a0c0f]/80 px-3.5 py-2 sm:px-5"
            >
              <span className="shrink-0 text-xs font-medium text-[#8a8f98] mr-0.5 whitespace-nowrap">
                {mode === '2035' ? 'Milieus:' : 'Milieus 2026:'}
              </span>
              {mode === '2035'
                ? MILIEUS.map((m) => {
                    const isSelected =
                      selection?.kind === '2035' && selection.id === m.id;
                    const Icon = getMilieuIcon(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => onSelectMilieu({ kind: '2035', id: m.id })}
                        data-testid={`legend-btn-${m.id}`}
                        className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                          isSelected
                            ? 'bg-[#f7f8f8] text-[#08090a] font-semibold shadow-sm'
                            : 'border border-white/[0.08] bg-white/[0.03] text-[#d1d5db] hover:border-white/[0.18] hover:bg-white/[0.08] hover:text-white'
                        }`}
                      >
                        <Icon
                          className="h-3.5 w-3.5 shrink-0"
                          style={{
                            color: isSelected ? '#08090a' : m.colorHex,
                          }}
                          aria-hidden="true"
                        />
                        <span>{m.shortName}</span>
                        <span
                          className={`font-mono-tabular text-[11px] ${
                            isSelected ? 'text-[#475569]' : 'text-[#8a8f98]'
                          }`}
                        >
                          {m.share2035}%
                        </span>
                      </button>
                    );
                  })
                : CLASSIC_MILIEUS_2026.map((c) => {
                    const isSelected =
                      selection?.kind === '2026' && selection.id === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => onSelectMilieu({ kind: '2026', id: c.id })}
                        className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                          isSelected
                            ? 'bg-[#f7f8f8] text-[#08090a] font-semibold shadow-sm'
                            : 'border border-white/[0.08] bg-white/[0.03] text-[#cbd5e1] hover:border-white/[0.18] hover:bg-white/[0.08] hover:text-white'
                        }`}
                      >
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: c.colorHex }}
                        />
                        <span>{c.shortName}</span>
                      </button>
                    );
                  })}
            </div>
          </div>

          {/* Interactive 3D Viewport Canvas Area */}
          <div className="relative flex-1 min-h-0 w-full overflow-hidden bg-[#040406]">
            {/* Isolated WebGL Canvas Mount */}
            <div
              ref={canvasMountRef}
              data-testid="three-canvas-host"
              className="absolute inset-0 h-full w-full z-0"
            />

            {/* Soft Linear bottom dissolve into pure black */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#040406] via-[#040406]/60 to-transparent z-[1]"
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

            {/* User Self-Test 3D Marker Badge */}
            <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
              <div
                ref={userMarkerLabelRef}
                data-testid="user-marker-label"
                style={{ opacity: 0 }}
                className="absolute top-0 left-0 rounded-xl border border-emerald-400/50 bg-[#f7f8f8] px-3 py-1.5 text-[#08090a] shadow-lg"
              >
                <div className="text-xs font-semibold whitespace-nowrap">
                  Dein Standort 2035
                </div>
                {userResultCoords && (
                  <div className="font-mono-tabular text-[11px] text-[#475569] whitespace-nowrap">
                    X {Math.round(userResultCoords.uX)} · Y{' '}
                    {Math.round(userResultCoords.uY)} · Z{' '}
                    {Math.round(userResultCoords.uZ)}
                  </div>
                )}
              </div>
            </div>

            {/* Fixed, Non-Intrusive Bottom-Left Axis Reference Key */}
            <div
              aria-label="Achsenorientierung"
              className="pointer-events-none absolute bottom-3.5 left-3.5 z-10 hidden sm:flex flex-col gap-1.5 rounded-xl border border-white/[0.1] bg-[#0c0e12]/90 px-3.5 py-2.5 shadow-lg"
            >
              <div className="flex items-center gap-2 text-xs text-[#cbd5e1]">
                <span className="font-mono-tabular font-semibold text-white">X</span>
                <span>Tradition ↔ Neuorientierung (Öko/Tech)</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#cbd5e1]">
                <span className="font-mono-tabular font-semibold text-white">Y</span>
                <span>Untere Schicht ↔ Oberschicht</span>
              </div>
              {mode === '2035' && (
                <div className="flex items-center gap-2 text-xs text-emerald-400">
                  <span className="font-mono-tabular font-semibold">Z</span>
                  <span>Resilienz &amp; Schutzhöhe (0–100)</span>
                </div>
              )}
            </div>

            {/* Mobile subtle touch hint when no panel is open */}
            {!selected2035 && !selected2026 && (
              <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 z-10 lg:hidden">
                <span className="rounded-full border border-white/[0.1] bg-[#101216]/90 px-3.5 py-1.5 text-xs text-[#cbd5e1] whitespace-nowrap">
                  Insel tippen für Steckbrief · Wischen zum Drehen
                </span>
              </div>
            )}

            {/* Right-Side Steckbrief Panel: High-Contrast At-a-Glance Inspector */}
            <AnimatePresence>
              {(selected2035 || selected2026) && (
                <motion.aside
                  key={selected2035 ? selected2035.id : selected2026?.id}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 24 }}
                  transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                  aria-label="Milieu-Steckbrief"
                  data-testid="milieu-steckbrief"
                  className="absolute inset-x-3 bottom-3 max-h-[66%] sm:inset-auto sm:top-3 sm:right-3 sm:bottom-3 sm:max-h-none z-20 flex sm:w-[420px] lg:w-[456px] flex-col overflow-hidden rounded-2xl border border-white/[0.14] bg-[#0e1014]/96 shadow-[0_24px_64px_rgba(0,0,0,0.85)]"
                >
                  {/* Top colored Linear accent bar */}
                  <div
                    className="h-1 w-full shrink-0"
                    style={{
                      backgroundColor: selected2035
                        ? selected2035.colorHex
                        : selected2026?.colorHex,
                    }}
                  />

                  {selected2035 && (
                    <>
                      {/* At-a-Glance Hero Header */}
                      <div className="flex items-start justify-between gap-3 border-b border-white/[0.09] px-5 py-4 sm:px-6 sm:py-5">
                        <div className="flex items-start gap-3.5 min-w-0">
                          <div
                            className="linear-icon-box flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                            style={{
                              borderColor: `${selected2035.colorHex}55`,
                            }}
                          >
                            <SelectedIcon
                              className="h-5 w-5"
                              style={{ color: selected2035.colorHex }}
                              aria-hidden="true"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-[13px] font-medium text-[#9ea4b0]">
                              <span style={{ color: selected2035.colorHex }}>
                                {selected2035.badge2035}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span>SINUS 2035</span>
                            </div>
                            <h3 className="mt-1 font-display text-xl sm:text-[22px] font-semibold leading-snug text-white">
                              {selected2035.name}
                            </h3>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={onResetOverview}
                          aria-label="Steckbrief schließen"
                          data-testid="close-steckbrief-btn"
                          className="rounded-full border border-white/[0.12] bg-white/[0.04] p-2 text-[#9ea4b0] hover:bg-white/[0.1] hover:text-white cursor-pointer shrink-0 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="sidebar-scroll flex-1 overflow-y-auto px-5 py-4 sm:px-6 sm:py-5 space-y-5">
                        {/* Key Metrics at a Glance */}
                        <div className="grid grid-cols-2 gap-3 rounded-xl border border-white/[0.09] bg-white/[0.025] p-4">
                          <div>
                            <div className="text-xs sm:text-[13px] font-medium text-[#9ea4b0]">
                              Bevölkerungsanteil
                            </div>
                            <div
                              className="mt-1 font-mono-tabular text-2xl sm:text-[26px] font-semibold leading-none"
                              style={{ color: selected2035.colorHex }}
                            >
                              {selected2035.share2035} %
                            </div>
                          </div>
                          <div>
                            <div className="text-xs sm:text-[13px] font-medium text-[#9ea4b0]">
                              Resilienz (Z-Achse)
                            </div>
                            <div className="mt-1 font-mono-tabular text-2xl sm:text-[26px] font-semibold leading-none text-white">
                              {selected2035.resilienceScore}
                              <span className="text-sm font-normal text-[#8a8f98]">
                                {' '}
                                / 100
                              </span>
                            </div>
                            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
                              <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                  width: `${selected2035.resilienceScore}%`,
                                  backgroundColor: selected2035.colorHex,
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Quick Summary Callout ("Auf einen Blick") */}
                        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
                          <div
                            className="text-[13px] font-semibold"
                            style={{ color: selected2035.colorHex }}
                          >
                            Auf einen Blick
                          </div>
                          <p className="mt-1.5 text-[15px] leading-relaxed text-[#f1f5f9]">
                            {selected2035.causalChainSummary}
                          </p>
                        </div>

                        <div className="space-y-4 border-t border-white/[0.08] pt-4">
                          <div>
                            <div className="flex items-center gap-2 text-[13px] font-semibold text-white">
                              <Compass
                                className="h-4 w-4 text-[#9ea4b0]"
                                aria-hidden="true"
                              />
                              <span>Lage &amp; Werteorientierung</span>
                            </div>
                            <p className="mt-1.5 text-sm sm:text-[15px] leading-relaxed text-[#cbd5e1]">
                              {selected2035.socialLayerLabel}
                            </p>
                          </div>

                          <div>
                            <div className="flex items-center gap-2 text-[13px] font-semibold text-white">
                              <Layers
                                className="h-4 w-4 text-[#9ea4b0]"
                                aria-hidden="true"
                              />
                              <span>Soziologisches Profil</span>
                            </div>
                            <p className="mt-1.5 text-sm sm:text-[15px] leading-relaxed text-[#cbd5e1]">
                              {selected2035.detailedProfile}
                            </p>
                          </div>

                          <div>
                            <div className="flex items-center gap-2 text-[13px] font-semibold text-white">
                              <GitBranch
                                className="h-4 w-4 text-[#9ea4b0]"
                                aria-hidden="true"
                              />
                              <span>Entstehung aus 2026</span>
                            </div>
                            <p className="mt-1.5 text-sm sm:text-[15px] leading-relaxed text-[#cbd5e1]">
                              {selected2035.originFrom2026}
                            </p>
                          </div>

                          <div>
                            <div className="text-[13px] font-semibold text-white">
                              Kausalkette 2035
                            </div>
                            <ol className="mt-2 space-y-2.5 text-sm sm:text-[15px] leading-relaxed text-[#cbd5e1]">
                              {selected2035.causalChain.map((step, i) => (
                                <li key={i} className="flex gap-2.5">
                                  <span
                                    className="font-mono-tabular font-semibold shrink-0"
                                    style={{ color: selected2035.colorHex }}
                                  >
                                    0{i + 1}
                                  </span>
                                  <span>{step}</span>
                                </li>
                              ))}
                            </ol>
                          </div>

                          <div>
                            <div className="flex items-center gap-2 text-[13px] font-semibold text-white">
                              <Swords
                                className="h-4 w-4 text-[#9ea4b0]"
                                aria-hidden="true"
                              />
                              <span>Gesellschaftliche Konfliktlinie</span>
                            </div>
                            <p className="mt-1.5 text-sm sm:text-[15px] leading-relaxed text-[#cbd5e1]">
                              {selected2035.conflictLine}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-white/[0.08] bg-[#0b0c0f] px-5 py-3 sm:px-6">
                        <button
                          type="button"
                          onClick={() => onStep2035(-1)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.03] px-3.5 py-1.5 text-xs sm:text-[13px] font-medium text-[#cbd5e1] hover:bg-white/[0.08] hover:text-white cursor-pointer transition-colors"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          <span>Vorheriges</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onStep2035(1)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.03] px-3.5 py-1.5 text-xs sm:text-[13px] font-medium text-[#cbd5e1] hover:bg-white/[0.08] hover:text-white cursor-pointer transition-colors"
                        >
                          <span>Nächstes</span>
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </>
                  )}

                  {selected2026 && (
                    <>
                      <div className="flex items-start justify-between gap-3 border-b border-white/[0.09] px-5 py-4 sm:px-6 sm:py-5">
                        <div className="flex items-start gap-3.5 min-w-0">
                          <div
                            className="linear-icon-box flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                            style={{
                              borderColor: `${selected2026.colorHex}55`,
                            }}
                          >
                            <Layers
                              className="h-5 w-5"
                              style={{ color: selected2026.colorHex }}
                              aria-hidden="true"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs sm:text-[13px] font-medium text-[#9ea4b0]">
                              Klassisches SINUS-Modell 2026 (2D)
                            </div>
                            <h3 className="mt-1 font-display text-xl sm:text-[22px] font-semibold leading-snug text-white">
                              {selected2026.name}
                            </h3>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={onResetOverview}
                          aria-label="Steckbrief schließen"
                          data-testid="close-steckbrief-btn"
                          className="rounded-full border border-white/[0.12] bg-white/[0.04] p-2 text-[#9ea4b0] hover:bg-white/[0.1] hover:text-white cursor-pointer shrink-0 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="sidebar-scroll flex-1 overflow-y-auto px-5 py-4 sm:px-6 sm:py-5 space-y-5">
                        <div className="rounded-xl border border-white/[0.09] bg-white/[0.025] p-4">
                          <div className="text-xs sm:text-[13px] font-medium text-[#9ea4b0]">
                            Bevölkerungsanteil 2026
                          </div>
                          <div
                            className="mt-1 font-mono-tabular text-2xl sm:text-[26px] font-semibold leading-none"
                            style={{ color: selected2026.colorHex }}
                          >
                            {selected2026.share2026} %
                          </div>
                        </div>

                        <div>
                          <div className="text-[13px] font-semibold text-white">
                            Verortung im 2D-Raum
                          </div>
                          <p className="mt-1.5 text-sm sm:text-[15px] leading-relaxed text-[#cbd5e1]">
                            {selected2026.socialLayer} ·{' '}
                            {selected2026.valueOrientation}
                          </p>
                        </div>

                        <div>
                          <div className="text-[13px] font-semibold text-white">
                            Charakteristik 2026
                          </div>
                          <p className="mt-1.5 text-sm sm:text-[15px] leading-relaxed text-[#cbd5e1]">
                            {selected2026.description}
                          </p>
                        </div>

                        <div className="border-t border-white/[0.08] pt-4">
                          <div className="text-[13px] font-semibold text-white">
                            Entwicklung bis 2035
                          </div>
                          <p className="mt-1.5 text-sm sm:text-[15px] leading-relaxed text-[#f1f5f9]">
                            {selected2026.evolvesInto}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </motion.aside>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
