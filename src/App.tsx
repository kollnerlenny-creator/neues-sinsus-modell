import { ArrowLeft } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AXIS_LABELS, MILIEUS, type MilieuId, type SimulationYear } from './data/milieus';
import {
  SinusSceneManager,
  type ProjectedLabelPosition,
} from './three/SinusSceneManager';
import { AxisLegend } from './components/AxisLegend';
import { ControlDock } from './components/ControlDock';
import { MilieuSidebar } from './components/MilieuSidebar';
import { SelfTestModal } from './components/SelfTestModal';
import { downloadStandaloneHtml } from './utils/exportHtml';
import { getDisplayYear, interpolateMilieuFrame } from './utils/projection';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<SinusSceneManager | null>(null);

  const milieuLabelRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const axisLabelRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Continuous morph progress: 0.0 = 2020 (2D), 1.0 = 2035 (3D)
  const [transformProgress, setTransformProgress] = useState<number>(1.0);
  const [isScrubbing, setIsScrubbing] = useState<boolean>(false);
  const [showRiftsAndArrows, setShowRiftsAndArrows] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  const [selectedId, setSelectedId] = useState<MilieuId | null>(null);
  const [hoveredId, setHoveredId] = useState<MilieuId | null>(null);
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [legendOpen, setLegendOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true,
  );
  const [selfTestOpen, setSelfTestOpen] = useState(false);
  const [contextLost, setContextLost] = useState(false);

  const displayYear = getDisplayYear(transformProgress);
  const sidebarYear: SimulationYear = transformProgress < 0.5 ? '2020' : '2035';

  const selectedMilieu = useMemo(
    () => MILIEUS.find((m) => m.id === selectedId) ?? null,
    [selectedId],
  );

  // Update floating HTML label positions imperatively without React re-renders
  const handleLabelsFrame = useCallback(
    (
      milieuPositions: Record<string, ProjectedLabelPosition>,
      axisPositions: Record<string, ProjectedLabelPosition>,
    ) => {
      for (const id of Object.keys(milieuPositions)) {
        const pos = milieuPositions[id];
        const el = milieuLabelRefs.current[id];
        if (!el) continue;
        if (!pos.visible) {
          el.style.opacity = '0';
          el.style.pointerEvents = 'none';
        } else {
          el.style.opacity = '1';
          el.style.pointerEvents = 'auto';
          el.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`;
        }
      }

      for (const id of Object.keys(axisPositions)) {
        const pos = axisPositions[id];
        const el = axisLabelRefs.current[id];
        if (!el) continue;
        if (!pos.visible) {
          el.style.opacity = '0';
        } else {
          el.style.opacity = '1';
          el.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`;
        }
      }
    },
    [],
  );

  // Mount Three.js scene once
  useEffect(() => {
    const mountEl = canvasMountRef.current;
    if (!mountEl) return;

    const manager = new SinusSceneManager(mountEl, {
      onSelectMilieu: (id) => setSelectedId(id),
      onHoverMilieu: (id) => setHoveredId(id),
      onLabelsFrame: handleLabelsFrame,
      onContextLost: (lost) => setContextLost(lost),
    });
    sceneRef.current = manager;

    return () => {
      manager.dispose();
      sceneRef.current = null;
    };
  }, [handleLabelsFrame]);

  // Sync React controls to Three.js scene
  useEffect(() => {
    sceneRef.current?.setTransformProgress(transformProgress, isScrubbing);
  }, [transformProgress, isScrubbing]);

  useEffect(() => {
    sceneRef.current?.setShowRiftsAndArrows(showRiftsAndArrows);
  }, [showRiftsAndArrows]);

  useEffect(() => {
    sceneRef.current?.setAutoRotate(autoRotate);
  }, [autoRotate]);

  const handleScrubProgress = useCallback((value: number) => {
    setIsScrubbing(true);
    setTransformProgress(value);
  }, []);

  const handleAnimateToProgress = useCallback((value: number) => {
    setIsScrubbing(false);
    setTransformProgress(value);
  }, []);

  const handleSelectMilieu = useCallback((id: MilieuId | null) => {
    setSelectedId(id);
    sceneRef.current?.selectMilieu(id, id !== null);
    if (id === null) {
      sceneRef.current?.resetCamera();
    }
  }, []);

  const handleResetOverview = useCallback(() => {
    setSelectedId(null);
    sceneRef.current?.selectMilieu(null, false);
    sceneRef.current?.resetCamera();
  }, []);

  const handleLegendHover = useCallback((id: MilieuId | null) => {
    setHoveredId(id);
    sceneRef.current?.setHoveredMilieu(id);
  }, []);

  const handleViewSelfTestResultIn3D = useCallback((milieuId: MilieuId) => {
    setSelfTestOpen(false);
    setIsScrubbing(false);
    setTransformProgress(1.0);
    setSelectedId(milieuId);
    sceneRef.current?.setTransformProgress(1.0, false);
    sceneRef.current?.selectMilieu(milieuId, true);
  }, []);

  const handleToggleRifts = useCallback(() => {
    setShowRiftsAndArrows((prev) => !prev);
  }, []);

  const handleToggleAutoRotate = useCallback(() => {
    setAutoRotate((prev) => !prev);
  }, []);

  const handleStepMilieu = useCallback(
    (direction: -1 | 1) => {
      const idx = selectedId ? MILIEUS.findIndex((m) => m.id === selectedId) : -1;
      const nextIdx =
        idx === -1
          ? 0
          : (idx + direction + MILIEUS.length) % MILIEUS.length;
      handleSelectMilieu(MILIEUS[nextIdx].id);
    },
    [selectedId, handleSelectMilieu],
  );

  // Keyboard shortcuts for classroom presentation (1-6, Escape, R)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'Escape' || e.key === 'r' || e.key === 'R') {
        handleResetOverview();
      } else if (e.key >= '1' && e.key <= '6') {
        const idx = Number(e.key) - 1;
        if (MILIEUS[idx]) {
          handleSelectMilieu(MILIEUS[idx].id);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleSelectMilieu, handleResetOverview]);

  return (
    <main
      className="relative w-screen h-screen overflow-hidden bg-[#0b0f19]"
      data-year={displayYear}
      data-progress={transformProgress.toFixed(2)}
      data-rifts={showRiftsAndArrows ? 'visible' : 'hidden'}
      data-selected={selectedId ?? 'none'}
    >
      {/* Isolated WebGL Canvas Container */}
      <div
        ref={canvasMountRef}
        data-testid="three-canvas-host"
        className="absolute inset-0 w-full h-full z-0"
      />

      {/* WebGL Context Lost Fallback */}
      {contextLost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b0f19]/95 p-6 text-center">
          <div className="glass-panel max-w-md rounded-2xl p-6">
            <h2 className="font-display text-lg font-semibold text-slate-100">
              3D-Grafikkontext unterbrochen
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Die WebGL-Darstellung wird automatisch wiederhergestellt oder kann über einen Seiten-Reload neu gestartet werden.
            </p>
          </div>
        </div>
      )}

      {/* Projected 3D Axis & Milieu Labels Layer */}
      <div
        aria-hidden={false}
        className="pointer-events-none fixed inset-0 z-10 overflow-hidden"
      >
        {/* Clean typographic axis labels (automatically hidden when a milieu is focused) */}
        {AXIS_LABELS.map((ax) => (
          <div
            key={ax.id}
            ref={(el) => {
              axisLabelRefs.current[ax.id] = el;
            }}
            data-testid={`axis-label-${ax.id}`}
            style={{ opacity: 0 }}
            className="absolute top-0 left-0 px-2 py-0.5 rounded bg-[#0b0f19]/65 text-center transition-opacity duration-200"
          >
            <div
              className="text-[11px] font-semibold tracking-wide whitespace-nowrap"
              style={{ color: ax.accentColor }}
            >
              {ax.text}
            </div>
            {ax.subtext && (
              <div className="text-[10px] text-slate-400/90 whitespace-nowrap">
                {ax.subtext}
              </div>
            )}
          </div>
        ))}

        {/* Interactive Milieu Labels (unfocused labels fade away on focus) */}
        {MILIEUS.map((m) => {
          const frame = interpolateMilieuFrame(m, transformProgress);
          const isSelected = selectedId === m.id;
          const isHovered = hoveredId === m.id;

          return (
            <button
              key={m.id}
              type="button"
              ref={(el) => {
                milieuLabelRefs.current[m.id] = el;
              }}
              onClick={() => handleSelectMilieu(m.id)}
              aria-label={`${m.name}, Anteil ${frame.share} Prozent, Details öffnen`}
              data-testid={`milieu-label-${m.id}`}
              style={{
                opacity: 0,
                borderColor: isSelected
                  ? m.colorHex
                  : isHovered
                    ? 'rgba(248, 250, 252, 0.55)'
                    : 'rgba(148, 163, 184, 0.24)',
              }}
              className="pointer-events-auto absolute top-0 left-0 glass-label rounded-xl px-2.5 py-1.5 text-left cursor-pointer transition-all duration-150 focus-visible:outline-2 focus-visible:outline-sky-400"
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="inline-block w-2 h-2 rounded-xs shrink-0"
                  style={{ backgroundColor: m.colorHex }}
                  aria-hidden="true"
                />
                <span className="text-[11.5px] font-semibold text-slate-100 whitespace-nowrap">
                  {m.shortName}
                </span>
              </div>
              <div className="mt-0.5 flex items-center gap-1.5 pl-3.5 text-[10.5px] font-mono-tabular text-slate-300 whitespace-nowrap">
                <span>{frame.share} %</span>
                <span className="text-slate-500" aria-hidden="true">·</span>
                <span className="text-slate-400">
                  {transformProgress < 0.2
                    ? '2020 (2D)'
                    : transformProgress > 0.85
                      ? `Resilienz ${m.resilienceScore}`
                      : `Jahr ${displayYear}`}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Top-Left Presentation Header + Focus Return Action */}
      <header className="pointer-events-none fixed top-4 left-4 z-20 flex flex-col items-start gap-2 max-w-[min(460px,calc(100vw-2rem))]">
        <div className="glass-panel rounded-2xl px-4 py-3">
          <h1 className="font-display text-base sm:text-lg font-bold tracking-wide text-slate-50 text-balance">
            SOZIALSTRUKTUR DEUTSCHLAND 2035
          </h1>
          <p className="mt-0.5 text-xs text-slate-400">
            3D-SINUS-Transformationsmodell (GK GRW 12) ·{' '}
            <span className="font-mono-tabular text-slate-300">
              {transformProgress < 0.15
                ? 'Referenz 2020 (2D)'
                : transformProgress > 0.85
                  ? 'Prognose 2035 (3D)'
                  : `Transformation ${displayYear}`}
            </span>
          </p>
        </div>

        {selectedMilieu && (
          <button
            type="button"
            onClick={handleResetOverview}
            data-testid="back-to-overview-btn"
            className="pointer-events-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl glass-panel text-xs font-medium text-slate-200 hover:text-white hover:border-slate-500/50 transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-sky-400"
          >
            <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
            <span>Zurück zur Übersicht</span>
          </button>
        )}
      </header>

      {/* Bottom-Left Legend: Milieus + Axes + Arrows & Connections */}
      <AxisLegend
        hidden={selectedId !== null}
        isOpen={legendOpen}
        onToggleOpen={() => setLegendOpen((prev) => !prev)}
        progress={transformProgress}
        hoveredId={hoveredId}
        onSelectMilieu={handleSelectMilieu}
        onHoverMilieu={handleLegendHover}
      />

      {/* Right Glassmorphism Detail Sidebar */}
      <MilieuSidebar
        milieu={selectedMilieu}
        year={sidebarYear}
        onClose={handleResetOverview}
        onStep={handleStepMilieu}
      />

      {/* Bottom Presentation Control Dock */}
      <ControlDock
        progress={transformProgress}
        onScrubProgress={handleScrubProgress}
        onAnimateToProgress={handleAnimateToProgress}
        showRiftsAndArrows={showRiftsAndArrows}
        onToggleRiftsAndArrows={handleToggleRifts}
        onResetCamera={handleResetOverview}
        autoRotate={autoRotate}
        onToggleAutoRotate={handleToggleAutoRotate}
        onExportStandaloneHtml={downloadStandaloneHtml}
        onOpenSelfTest={() => setSelfTestOpen(true)}
        collapsed={dockCollapsed}
        onToggleCollapsed={() => setDockCollapsed((prev) => !prev)}
      />

      {/* Interactive Milieu Self-Test 2035 Modal */}
      <SelfTestModal
        open={selfTestOpen}
        onClose={() => setSelfTestOpen(false)}
        onViewIn3D={handleViewSelfTestResultIn3D}
      />
    </main>
  );
}
