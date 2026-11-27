import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
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
import { AnimatePresence, motion } from 'motion/react';
import { type RefObject, useCallback, useEffect, useRef, useState } from 'react';
import type {
  ClassicMilieu2026Spec,
  MilieuSpec,
  ModelMode,
} from '../data/milieus';
import { useSiteContent } from '../context/ContentContext';
import type { SelectionPayload } from '../three/SinusSceneManager';
import { getMilieuIcon } from '../utils/milieuIcons';
import { EditableNumber, EditableText } from './EditableText';

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

function useIsMobileViewport(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(max-width: 639px)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(max-width: 639px)');
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return isMobile;
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
  const stageBoxRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mobileDetailsOpen, setMobileDetailsOpen] = useState(false);
  const isMobile = useIsMobileViewport();
  const { content, updateSectionDraft, canInlineEdit } = useSiteContent();
  const { meta } = content;
  const milieus2035 = content.milieus_2035.milieus;
  const milieus2026 = content.milieus_2026.classicMilieus;

  const updateMilieu2035 = (id: MilieuSpec['id'], patch: Partial<MilieuSpec>) => {
    updateSectionDraft('milieus_2035', (p) => ({
      ...p,
      milieus: p.milieus.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    }));
  };

  const updateMilieu2035ChainStep = (
    id: MilieuSpec['id'],
    stepIdx: number,
    nextStep: string,
  ) => {
    updateSectionDraft('milieus_2035', (p) => ({
      ...p,
      milieus: p.milieus.map((m) =>
        m.id === id
          ? {
              ...m,
              causalChain: m.causalChain.map((s, idx) =>
                idx === stepIdx ? nextStep : s,
              ),
            }
          : m,
      ),
    }));
  };

  const updateMilieu2026 = (
    id: string,
    patch: Partial<ClassicMilieu2026Spec>,
  ) => {
    updateSectionDraft('milieus_2026', (p) => ({
      ...p,
      classicMilieus: p.classicMilieus.map((m) =>
        m.id === id ? { ...m, ...patch } : m,
      ),
    }));
  };

  const selected2035: MilieuSpec | null =
    selection?.kind === '2035'
      ? (milieus2035.find((m) => m.id === selection.id) ?? null)
      : null;

  const selected2026: ClassicMilieu2026Spec | null =
    selection?.kind === '2026'
      ? (milieus2026.find((m) => m.id === selection.id) ?? null)
      : null;

  const SelectedIcon = selected2035 ? getMilieuIcon(selected2035.id) : Layers;

  // Collapse extra mobile detail drawer when closing selection
  useEffect(() => {
    if (!selection) {
      setMobileDetailsOpen(false);
    }
  }, [selection]);

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

  const renderInspectorCard = (placement: 'desktop-overlay' | 'mobile-docked' | 'mobile-fullscreen') => {
    if (!selected2035 && !selected2026) return null;

    const isMobileCompact =
      placement === 'mobile-docked' || placement === 'mobile-fullscreen';
    const showFullSections = !isMobileCompact || mobileDetailsOpen;

    const wrapperClass =
      placement === 'desktop-overlay'
        ? 'absolute inset-auto top-3 right-3 bottom-3 z-20 flex w-[420px] lg:w-[456px] flex-col overflow-hidden rounded-2xl border border-white/[0.14] bg-[#0e1014]/96 shadow-[0_24px_64px_rgba(0,0,0,0.85)]'
        : placement === 'mobile-fullscreen'
          ? `absolute inset-x-3 bottom-3 z-20 flex flex-col overflow-hidden rounded-3xl border border-white/[0.16] bg-[#0e1014]/96 shadow-[0_24px_64px_rgba(0,0,0,0.9)] ${
              mobileDetailsOpen ? 'max-h-[58dvh]' : ''
            }`
          : 'relative mt-3.5 flex w-full flex-col overflow-hidden rounded-3xl border border-white/[0.14] bg-[#0e1014]/96 shadow-[0_20px_52px_rgba(0,0,0,0.75)]';

    return (
      <motion.aside
        key={`${placement}-${selected2035 ? selected2035.id : selected2026?.id}`}
        initial={{
          opacity: 0,
          ...(placement === 'desktop-overlay' ? { x: 24 } : { y: 14 }),
        }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        exit={{
          opacity: 0,
          ...(placement === 'desktop-overlay' ? { x: 24 } : { y: 12 }),
        }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        aria-label="Milieu-Steckbrief"
        data-testid="milieu-steckbrief"
        className={wrapperClass}
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
            <div className="flex items-start justify-between gap-2.5 border-b border-white/[0.09] px-4 py-2.5 sm:px-6 sm:py-5">
              <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">
                <div
                  className="linear-icon-box flex h-8 w-8 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    borderColor: `${selected2035.colorHex}55`,
                  }}
                >
                  <SelectedIcon
                    className="h-4 w-4 sm:h-5 sm:w-5"
                    style={{ color: selected2035.colorHex }}
                    aria-hidden="true"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] sm:text-[13px] font-medium text-[#9ea4b0]">
                    <span style={{ color: selected2035.colorHex }}>
                      <EditableText
                        value={selected2035.badge2035}
                        onCommit={(val) =>
                          updateMilieu2035(selected2035.id, { badge2035: val })
                        }
                      />
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>SINUS 2035</span>
                  </div>
                  <h3 className="mt-0.5 font-display text-base sm:text-[22px] font-semibold leading-snug text-white">
                    <EditableText
                      value={selected2035.name}
                      onCommit={(val) =>
                        updateMilieu2035(selected2035.id, { name: val })
                      }
                    />
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={onResetOverview}
                aria-label="Steckbrief schließen"
                data-testid="close-steckbrief-btn"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.04] text-[#9ea4b0] hover:bg-white/[0.1] hover:text-white cursor-pointer shrink-0 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="sidebar-scroll flex-1 overflow-y-auto px-4 py-2.5 sm:px-6 sm:py-5 space-y-2.5 sm:space-y-5">
              {/* Key Metrics at a Glance */}
              <div className="grid grid-cols-2 gap-3 rounded-2xl border border-white/[0.09] bg-white/[0.025] p-2.5 sm:p-4">
                <div>
                  <div className="text-[11px] sm:text-[13px] font-medium text-[#9ea4b0]">
                    Bevölkerungsanteil
                  </div>
                  <div
                    className="mt-1 font-mono-tabular text-lg sm:text-[26px] font-semibold leading-none"
                    style={{ color: selected2035.colorHex }}
                  >
                    <EditableNumber
                      value={selected2035.share2035}
                      min={0}
                      max={100}
                      step={0.5}
                      suffix=" %"
                      onCommit={(val) =>
                        updateMilieu2035(selected2035.id, { share2035: val })
                      }
                    />
                  </div>
                </div>
                <div>
                  <div className="text-[11px] sm:text-[13px] font-medium text-[#9ea4b0]">
                    Resilienz (Z-Achse)
                  </div>
                  <div className="mt-1 font-mono-tabular text-lg sm:text-[26px] font-semibold leading-none text-white">
                    <EditableNumber
                      value={selected2035.resilienceScore}
                      min={0}
                      max={100}
                      step={1}
                      onCommit={(val) =>
                        updateMilieu2035(selected2035.id, {
                          resilienceScore: val,
                        })
                      }
                    />
                    <span className="text-xs sm:text-sm font-normal text-[#8a8f98]">
                      {' '}
                      / 100
                    </span>
                  </div>
                  <div className="mt-1.5 sm:mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
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
              {(!isMobileCompact || placement === 'mobile-docked' || mobileDetailsOpen) && (
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3.5 sm:p-4">
                  <div
                    className="text-xs sm:text-[13px] font-semibold"
                    style={{ color: selected2035.colorHex }}
                  >
                    Auf einen Blick
                  </div>
                  <p className="mt-1 text-sm sm:text-[15px] leading-relaxed text-[#f1f5f9]">
                    <EditableText
                      value={selected2035.causalChainSummary}
                      multiline
                      onCommit={(val) =>
                        updateMilieu2035(selected2035.id, {
                          causalChainSummary: val,
                        })
                      }
                    />
                  </p>
                </div>
              )}

              {/* Mobile Expand / Collapse Details Button */}
              {isMobileCompact && (
                <button
                  type="button"
                  onClick={() => setMobileDetailsOpen((prev) => !prev)}
                  data-testid="toggle-mobile-details-btn"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/[0.1] bg-white/[0.03] px-4 py-2.5 text-xs font-medium text-[#e2e8f0] hover:bg-white/[0.08] cursor-pointer transition-colors"
                >
                  <span>
                    {mobileDetailsOpen
                      ? 'Weniger Details anzeigen'
                      : 'Vollständigen Steckbrief & Kausalkette öffnen'}
                  </span>
                  {mobileDetailsOpen ? (
                    <ChevronUp className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              )}

              {showFullSections && (
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
                      <EditableText
                        value={selected2035.socialLayerLabel}
                        multiline
                        onCommit={(val) =>
                          updateMilieu2035(selected2035.id, {
                            socialLayerLabel: val,
                          })
                        }
                      />
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
                      <EditableText
                        value={selected2035.detailedProfile}
                        multiline
                        onCommit={(val) =>
                          updateMilieu2035(selected2035.id, {
                            detailedProfile: val,
                          })
                        }
                      />
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
                      <EditableText
                        value={selected2035.originFrom2026}
                        multiline
                        onCommit={(val) =>
                          updateMilieu2035(selected2035.id, {
                            originFrom2026: val,
                          })
                        }
                      />
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
                          <span className="min-w-0 flex-1">
                            <EditableText
                              value={step}
                              multiline
                              onCommit={(val) =>
                                updateMilieu2035ChainStep(
                                  selected2035.id,
                                  i,
                                  val,
                                )
                              }
                            />
                          </span>
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
                      <EditableText
                        value={selected2035.conflictLine}
                        multiline
                        onCommit={(val) =>
                          updateMilieu2035(selected2035.id, {
                            conflictLine: val,
                          })
                        }
                      />
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-white/[0.08] bg-[#0b0c0f] px-4 py-3 sm:px-6">
              <button
                type="button"
                onClick={() => onStep2035(-1)}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.03] px-4 py-2 text-xs sm:text-[13px] font-medium text-[#cbd5e1] hover:bg-white/[0.08] hover:text-white cursor-pointer transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Vorheriges</span>
              </button>
              <button
                type="button"
                onClick={() => onStep2035(1)}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.03] px-4 py-2 text-xs sm:text-[13px] font-medium text-[#cbd5e1] hover:bg-white/[0.08] hover:text-white cursor-pointer transition-colors"
              >
                <span>Nächstes</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </>
        )}

        {selected2026 && (
          <>
            <div className="flex items-start justify-between gap-3 border-b border-white/[0.09] px-4 py-3.5 sm:px-6 sm:py-5">
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className="linear-icon-box flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl"
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
                  <h3 className="mt-0.5 font-display text-lg sm:text-[22px] font-semibold leading-snug text-white">
                    <EditableText
                      value={selected2026.name}
                      onCommit={(val) =>
                        updateMilieu2026(selected2026.id, { name: val })
                      }
                    />
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={onResetOverview}
                aria-label="Steckbrief schließen"
                data-testid="close-steckbrief-btn"
                className="flex h-10 w-10 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.04] text-[#9ea4b0] hover:bg-white/[0.1] hover:text-white cursor-pointer shrink-0 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="sidebar-scroll flex-1 overflow-y-auto px-4 py-3.5 sm:px-6 sm:py-5 space-y-4 sm:space-y-5">
              <div className="rounded-2xl border border-white/[0.09] bg-white/[0.025] p-3.5 sm:p-4">
                <div className="text-xs sm:text-[13px] font-medium text-[#9ea4b0]">
                  Bevölkerungsanteil 2026
                </div>
                <div
                  className="mt-1 font-mono-tabular text-xl sm:text-[26px] font-semibold leading-none"
                  style={{ color: selected2026.colorHex }}
                >
                  <EditableNumber
                    value={selected2026.share2026}
                    min={0}
                    max={100}
                    step={0.5}
                    suffix=" %"
                    onCommit={(val) =>
                      updateMilieu2026(selected2026.id, { share2026: val })
                    }
                  />
                </div>
              </div>

              {isMobileCompact && (
                <button
                  type="button"
                  onClick={() => setMobileDetailsOpen((prev) => !prev)}
                  data-testid="toggle-mobile-details-btn"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/[0.1] bg-white/[0.03] px-4 py-2.5 text-xs font-medium text-[#e2e8f0] hover:bg-white/[0.08] cursor-pointer transition-colors"
                >
                  <span>
                    {mobileDetailsOpen
                      ? 'Weniger Details anzeigen'
                      : 'Charakteristik & Entwicklung bis 2035 öffnen'}
                  </span>
                  {mobileDetailsOpen ? (
                    <ChevronUp className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              )}

              {showFullSections && (
                <>
                  <div>
                    <div className="text-[13px] font-semibold text-white">
                      Verortung im 2D-Raum
                    </div>
                    <p className="mt-1.5 text-sm sm:text-[15px] leading-relaxed text-[#cbd5e1]">
                      <EditableText
                        value={selected2026.socialLayer}
                        onCommit={(val) =>
                          updateMilieu2026(selected2026.id, { socialLayer: val })
                        }
                      />{' '}
                      ·{' '}
                      <EditableText
                        value={selected2026.valueOrientation}
                        onCommit={(val) =>
                          updateMilieu2026(selected2026.id, {
                            valueOrientation: val,
                          })
                        }
                      />
                    </p>
                  </div>

                  <div>
                    <div className="text-[13px] font-semibold text-white">
                      Charakteristik 2026
                    </div>
                    <p className="mt-1.5 text-sm sm:text-[15px] leading-relaxed text-[#cbd5e1]">
                      <EditableText
                        value={selected2026.description}
                        multiline
                        onCommit={(val) =>
                          updateMilieu2026(selected2026.id, { description: val })
                        }
                      />
                    </p>
                  </div>

                  <div className="border-t border-white/[0.08] pt-4">
                    <div className="text-[13px] font-semibold text-white">
                      Entwicklung bis 2035
                    </div>
                    <p className="mt-1.5 text-sm sm:text-[15px] leading-relaxed text-[#f1f5f9]">
                      <EditableText
                        value={selected2026.evolvesInto}
                        multiline
                        onCommit={(val) =>
                          updateMilieu2026(selected2026.id, { evolvesInto: val })
                        }
                      />
                    </p>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </motion.aside>
    );
  };

  return (
    <section
      id="modell-3d"
      className="section-anchor relative border-t border-white/[0.06] pb-16 pt-10 sm:pb-22 sm:pt-14"
    >
      <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8">
        {/* Linear-style Asymmetric Split Editorial Header */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.12 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-end"
        >
          <div className="lg:col-span-7">
            <p className="text-xs sm:text-sm font-medium tracking-wide text-[#9ea4b0]">
              <EditableText
                value={meta.stageEyebrow}
                onCommit={(val) =>
                  updateSectionDraft('meta', (p) => ({
                    ...p,
                    stageEyebrow: val,
                  }))
                }
              />
            </p>
            <h2 className="mt-2 font-display text-3xl sm:text-5xl lg:text-[48px] font-semibold tracking-tight text-[#f7f8f8] leading-[1.08] text-balance">
              <EditableText
                value={meta.stageHeadline}
                multiline
                onCommit={(val) =>
                  updateSectionDraft('meta', (p) => ({
                    ...p,
                    stageHeadline: val,
                  }))
                }
              />
            </h2>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-4 lg:items-end">
            <p className="text-base sm:text-[17px] leading-relaxed text-[#b4bac4] lg:text-right max-w-lg text-balance">
              <EditableText
                value={meta.stageDescription}
                multiline
                onCommit={(val) =>
                  updateSectionDraft('meta', (p) => ({
                    ...p,
                    stageDescription: val,
                  }))
                }
              />
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
                className={`relative min-h-[40px] rounded-full px-3.5 sm:px-4 py-2 text-[13px] font-medium transition-colors cursor-pointer whitespace-nowrap text-center ${
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
                  <EditableText
                    value={meta.stageMode2026Label}
                    onCommit={(val) =>
                      updateSectionDraft('meta', (p) => ({
                        ...p,
                        stageMode2026Label: val,
                      }))
                    }
                  />
                </span>
              </button>
              <button
                type="button"
                onClick={() => onChangeMode('2035')}
                data-testid="toggle-mode-2035"
                aria-pressed={mode === '2035'}
                className={`relative min-h-[40px] rounded-full px-3.5 sm:px-4 py-2 text-[13px] font-medium transition-colors cursor-pointer whitespace-nowrap text-center ${
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
                  <EditableText
                    value={meta.stageMode2035Label}
                    onCommit={(val) =>
                      updateSectionDraft('meta', (p) => ({
                        ...p,
                        stageMode2035Label: val,
                      }))
                    }
                  />
                </span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Linear Architectural 3D Stage Window Fading into Black */}
        <div
          ref={stageBoxRef}
          data-testid="three-stage-box"
          data-fullscreen={isFullscreen ? 'true' : 'false'}
          data-mode={mode}
          data-selected={selection ? `${selection.kind}:${selection.id}` : 'none'}
          className={
            isFullscreen
              ? 'fixed inset-0 z-50 flex h-[100dvh] w-screen flex-col overflow-hidden bg-[#040406]'
              : 'linear-fade-window relative mt-5 sm:mt-7 flex h-[56vh] min-h-[410px] max-h-[500px] sm:h-[74vh] sm:min-h-[600px] lg:h-[76vh] sm:max-h-[820px] w-full flex-col overflow-hidden rounded-3xl'
          }
        >
          {/* Dedicated Linear Window Chrome (never overlaps the 3D scene or right drawer) */}
          <div className="shrink-0 border-b border-white/[0.08] bg-[#0b0d11]/95">
            {/* Row 1: Action controls & interaction hint */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 sm:px-5 sm:py-3">
              <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto sidebar-scroll">
                <button
                  type="button"
                  onClick={onResetOverview}
                  data-testid="reset-camera-btn"
                  className="inline-flex min-h-[34px] shrink-0 items-center gap-1.5 rounded-full border border-white/[0.12] bg-white/[0.04] px-3 sm:px-3.5 py-1.5 text-xs sm:text-[13px] font-medium text-[#e2e8f0] hover:bg-white/[0.1] hover:text-white cursor-pointer transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Übersicht</span>
                </button>

                <div
                  role="group"
                  aria-label="3D-Ansicht zoomen"
                  className="inline-flex shrink-0 items-center rounded-full border border-white/[0.12] bg-white/[0.04] p-0.5"
                >
                  <button
                    type="button"
                    onClick={() => onZoomStep('out')}
                    data-testid="zoom-out-btn"
                    aria-label="Herauszoomen"
                    title="Herauszoomen"
                    className="inline-flex h-7 w-8 sm:w-7 items-center justify-center rounded-full text-[#e2e8f0] hover:bg-white/[0.1] hover:text-white cursor-pointer transition-colors"
                  >
                    <ZoomOut className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onZoomStep('in')}
                    data-testid="zoom-in-btn"
                    aria-label="Heranzoomen"
                    title="Heranzoomen"
                    className="inline-flex h-7 w-8 sm:w-7 items-center justify-center rounded-full text-[#e2e8f0] hover:bg-white/[0.1] hover:text-white cursor-pointer transition-colors"
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
                  className="inline-flex min-h-[34px] shrink-0 items-center gap-1.5 rounded-full border border-white/[0.12] bg-white/[0.04] px-3 sm:px-3.5 py-1.5 text-xs sm:text-[13px] font-medium text-[#e2e8f0] hover:bg-white/[0.1] hover:text-white cursor-pointer transition-colors"
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
                  title="Teilen"
                  className="inline-flex min-h-[34px] shrink-0 items-center gap-1.5 rounded-full border border-white/[0.12] bg-white/[0.04] px-2.5 sm:px-3.5 py-1.5 text-xs sm:text-[13px] font-medium text-[#e2e8f0] hover:bg-white/[0.1] hover:text-white cursor-pointer transition-colors"
                >
                  <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">Teilen</span>
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
              className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#040406] via-[#040406]/55 to-transparent z-[1]"
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

            {/* Fixed, Non-Intrusive Bottom-Left Axis Reference Key (Tablet/Desktop) */}
            <div
              aria-label="Achsenorientierung"
              className={`${
                canInlineEdit ? 'pointer-events-auto' : 'pointer-events-none'
              } absolute bottom-3.5 left-3.5 z-10 hidden sm:flex flex-col gap-1.5 rounded-xl border border-white/[0.1] bg-[#0c0e12]/90 px-3.5 py-2.5 shadow-lg`}
            >
              <div className="flex items-center gap-2 text-xs text-[#cbd5e1]">
                <span className="font-mono-tabular font-semibold text-white">X</span>
                <span>
                  <EditableText
                    value={meta.stageAxisKeyX}
                    onCommit={(val) =>
                      updateSectionDraft('meta', (p) => ({
                        ...p,
                        stageAxisKeyX: val,
                      }))
                    }
                  />
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#cbd5e1]">
                <span className="font-mono-tabular font-semibold text-white">Y</span>
                <span>
                  <EditableText
                    value={meta.stageAxisKeyY}
                    onCommit={(val) =>
                      updateSectionDraft('meta', (p) => ({
                        ...p,
                        stageAxisKeyY: val,
                      }))
                    }
                  />
                </span>
              </div>
              {mode === '2035' && (
                <div className="flex items-center gap-2 text-xs text-emerald-400">
                  <span className="font-mono-tabular font-semibold">Z</span>
                  <span>
                    <EditableText
                      value={meta.stageAxisKeyZ}
                      onCommit={(val) =>
                        updateSectionDraft('meta', (p) => ({
                          ...p,
                          stageAxisKeyZ: val,
                        }))
                      }
                    />
                  </span>
                </div>
              )}
            </div>

            {/* Desktop/Tablet Right-Side Steckbrief Drawer & Mobile Fullscreen Compact Sheet */}
            <AnimatePresence>
              {!isMobile && renderInspectorCard('desktop-overlay')}
              {isMobile && isFullscreen && renderInspectorCard('mobile-fullscreen')}
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile Clean Touch Cue + Quick Tour Directly Below the 3D Window (never covers the canvas) */}
        <div className="mt-3 flex flex-col gap-2.5 px-0.5 sm:hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#8a8f98]">
            <span>Wischen = Drehen · 2 Finger = Zoom · Insel tippen</span>
            <span className="font-mono-tabular text-[11px] text-[#9ea4b0]">
              X Werte · Y Schicht{mode === '2035' ? ' · Z Resilienz' : ''}
            </span>
          </div>

          {!selection && mode === '2035' && (
            <div className="flex items-center justify-between gap-2 rounded-2xl border border-white/[0.1] bg-[#0c0e13]/90 p-2">
              <button
                type="button"
                onClick={() => onStep2035(-1)}
                data-testid="mobile-tour-prev-btn"
                className="inline-flex min-h-[40px] items-center gap-1 rounded-xl border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-xs font-medium text-[#e2e8f0] hover:bg-white/[0.08] cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                <span>Zurück</span>
              </button>
              <span className="text-xs font-medium text-[#cbd5e1] text-center">
                3D-Rundgang durch alle 6 Milieus
              </span>
              <button
                type="button"
                onClick={() => onStep2035(1)}
                data-testid="mobile-tour-next-btn"
                className="inline-flex min-h-[40px] items-center gap-1 rounded-xl bg-[#f7f8f8] px-3.5 py-2 text-xs font-semibold text-[#08090a] hover:bg-white cursor-pointer"
              >
                <span>Starten</span>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        {/* Mobile Docked Steckbrief Card Directly Underneath the 3D Window (keeps 3D model 100% unobstructed) */}
        <AnimatePresence>
          {isMobile && !isFullscreen && renderInspectorCard('mobile-docked')}
        </AnimatePresence>
      </div>
    </section>
  );
}
