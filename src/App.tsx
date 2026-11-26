import { MotionConfig } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { DistributionSection } from './components/DistributionSection';
import { Hero3DStage } from './components/Hero3DStage';
import { HeroHookSection } from './components/HeroHookSection';
import { IntroTimelineSplash } from './components/IntroTimelineSplash';
import { MilieusGridSection } from './components/MilieusGridSection';
import { Navbar } from './components/Navbar';
import { SelfTestSection } from './components/SelfTestSection';
import { SharePreviewModal } from './components/SharePreviewModal';
import { TransformationSection } from './components/TransformationSection';
import {
  CLASSIC_MILIEUS_2026,
  MILIEUS,
  type MilieuId,
  type ModelMode,
} from './data/milieus';
import {
  SinusSceneManager,
  type ProjectedLabelPosition,
  type SelectionPayload,
} from './three/SinusSceneManager';

function getInitialSurveyCode(): string | null {
  if (typeof window === 'undefined') return null;
  const raw = new URLSearchParams(window.location.search).get('umfrage');
  if (!raw) return null;
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return cleaned.length === 6 ? cleaned : null;
}

function shouldSkipIntroOnLoad(): boolean {
  if (typeof window === 'undefined') return true;
  const params = new URLSearchParams(window.location.search);
  return (
    params.get('autostart') === '1' ||
    params.has('milieu') ||
    params.has('umfrage')
  );
}

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<SinusSceneManager | null>(null);
  const userMarkerLabelRef = useRef<HTMLDivElement | null>(null);

  const [initialSurveyCode] = useState<string | null>(() => getInitialSurveyCode());
  const [showIntro, setShowIntro] = useState<boolean>(() => !shouldSkipIntroOnLoad());
  const [mode, setMode] = useState<ModelMode>('2035');
  const [selection, setSelection] = useState<SelectionPayload | null>(null);
  const [contextLost, setContextLost] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [userResultCoords, setUserResultCoords] = useState<{
    uX: number;
    uY: number;
    uZ: number;
  } | null>(null);

  const smoothedUserRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleLabelsFrame = useCallback(
    (
      _axisPositions: Record<string, ProjectedLabelPosition>,
      userMarkerPosition: ProjectedLabelPosition,
    ) => {
      const uEl = userMarkerLabelRef.current;
      if (uEl) {
        if (!userMarkerPosition.visible) {
          uEl.style.opacity = '0';
        } else {
          uEl.style.opacity = '1';
          const prevU = smoothedUserRef.current;
          const sx = prevU.x + (userMarkerPosition.x - prevU.x) * 0.35;
          const sy = prevU.y + (userMarkerPosition.y - prevU.y) * 0.35;
          smoothedUserRef.current = { x: sx, y: sy };
          uEl.style.transform = `translate3d(${Math.round(sx)}px, ${Math.round(sy)}px, 0) translate(-50%, -50%)`;
        }
      }
    },
    [],
  );

  // Sync dynamic canonical & OpenGraph URL tags
  useEffect(() => {
    const baseUrl = `${window.location.origin}${window.location.pathname}`;
    const absoluteImg = `${window.location.origin}/og-preview.jpg`;

    const upsertMeta = (attr: 'property' | 'name', key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    upsertMeta('property', 'og:url', window.location.href);
    upsertMeta('property', 'og:image', absoluteImg);
    upsertMeta('name', 'twitter:image', absoluteImg);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', baseUrl);
  }, []);

  // Mount Three.js scene once
  useEffect(() => {
    const mountEl = canvasMountRef.current;
    if (!mountEl) return;

    const manager = new SinusSceneManager(mountEl, {
      onSelect: (sel) => setSelection(sel),
      onHover: () => {},
      onLabelsFrame: handleLabelsFrame,
      onContextLost: (lost) => setContextLost(lost),
    });
    sceneRef.current = manager;

    // Support shared deep-link query parameters (?mode=2026&kind=2035&milieu=avantgarde)
    const params = new URLSearchParams(window.location.search);
    const paramMode = params.get('mode');
    const paramKind = params.get('kind');
    const paramMilieu = params.get('milieu');

    if (paramMode === '2026') {
      setMode('2026');
      manager.setMode('2026');
    }

    if (paramMilieu) {
      if (
        (paramKind === '2026' || paramMode === '2026') &&
        CLASSIC_MILIEUS_2026.some((c) => c.id === paramMilieu)
      ) {
        const sel: SelectionPayload = { kind: '2026', id: paramMilieu };
        setMode('2026');
        manager.setMode('2026');
        setSelection(sel);
        manager.applySelection(sel, true);
      } else if (MILIEUS.some((m) => m.id === paramMilieu)) {
        const sel: SelectionPayload = {
          kind: '2035',
          id: paramMilieu as MilieuId,
        };
        setMode('2035');
        manager.setMode('2035');
        setSelection(sel);
        manager.applySelection(sel, true);
      }
      window.requestAnimationFrame(() => {
        document.getElementById('modell-3d')?.scrollIntoView({ behavior: 'auto' });
      });
    } else if (paramMode === '2026') {
      window.requestAnimationFrame(() => {
        document.getElementById('modell-3d')?.scrollIntoView({ behavior: 'auto' });
      });
    } else if (params.has('umfrage')) {
      window.requestAnimationFrame(() => {
        document.getElementById('selbsttest')?.scrollIntoView({ behavior: 'auto' });
      });
    }

    return () => {
      manager.dispose();
      sceneRef.current = null;
    };
  }, [handleLabelsFrame]);

  const handleChangeMode = useCallback((nextMode: ModelMode) => {
    setMode(nextMode);
    setSelection(null);
    sceneRef.current?.setMode(nextMode);
  }, []);

  const handleResetOverview = useCallback(() => {
    setSelection(null);
    sceneRef.current?.applySelection(null, false);
    if (mode === '2026') {
      sceneRef.current?.setMode('2026');
    } else {
      sceneRef.current?.resetCamera();
    }
  }, [mode]);

  const handleStageResize = useCallback(() => {
    sceneRef.current?.handleResize();
  }, []);

  const handleZoomStep = useCallback((dir: 'in' | 'out') => {
    sceneRef.current?.zoomByStep(dir);
  }, []);

  const handleFullscreenChange = useCallback((fullscreen: boolean) => {
    sceneRef.current?.setFullscreenZoom(fullscreen);
  }, []);

  const handleStep2035 = useCallback(
    (dir: -1 | 1) => {
      const idx =
        selection?.kind === '2035'
          ? MILIEUS.findIndex((m) => m.id === selection.id)
          : -1;
      const nextIdx =
        idx === -1 ? 0 : (idx + dir + MILIEUS.length) % MILIEUS.length;
      const nextSel: SelectionPayload = {
        kind: '2035',
        id: MILIEUS[nextIdx].id,
      };
      setSelection(nextSel);
      sceneRef.current?.applySelection(nextSel, true);
    },
    [selection],
  );

  const handleFocusMilieuFromGrid = useCallback((id: MilieuId) => {
    setMode('2035');
    sceneRef.current?.setMode('2035');
    const nextSel: SelectionPayload = { kind: '2035', id };
    setSelection(nextSel);
    sceneRef.current?.applySelection(nextSel, true);
    document.getElementById('modell-3d')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleViewSelfTestResultIn3D = useCallback(
    (milieuId: MilieuId, coords: { uX: number; uY: number; uZ: number }) => {
      setUserResultCoords(coords);
      setMode('2035');
      sceneRef.current?.setMode('2035');
      sceneRef.current?.setUserSelfTestMarker(coords);
      const nextSel: SelectionPayload = { kind: '2035', id: milieuId };
      setSelection(nextSel);
      sceneRef.current?.applySelection(nextSel, true);
      document.getElementById('modell-3d')?.scrollIntoView({ behavior: 'smooth' });
    },
    [],
  );

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative min-h-screen bg-[#040406] text-[#f7f8f8]">
        {showIntro && (
          <IntroTimelineSplash onComplete={() => setShowIntro(false)} />
        )}

        {/* Subtle Linear-style ambient light points fading into black */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0"
          style={{
            backgroundImage: [
              'radial-gradient(900px circle at 50% 0%, rgba(255, 255, 255, 0.075), transparent 64%)',
              'radial-gradient(640px circle at 50% 62%, rgba(16, 185, 129, 0.025), transparent 72%)',
            ].join(', '),
          }}
        />

        <div className="relative z-10">
          <Navbar onOpenShare={() => setShareOpen(true)} />

          <main>
            <HeroHookSection />

            <Hero3DStage
              mode={mode}
              onChangeMode={handleChangeMode}
              canvasMountRef={canvasMountRef}
              userMarkerLabelRef={userMarkerLabelRef}
              selection={selection}
              onStep2035={handleStep2035}
              onResetOverview={handleResetOverview}
              onStageResize={handleStageResize}
              onOpenShare={() => setShareOpen(true)}
              contextLost={contextLost}
              userResultCoords={userResultCoords}
              onSelectMilieu={(sel) => {
                setSelection(sel);
                sceneRef.current?.applySelection(sel, true);
              }}
              onZoomStep={handleZoomStep}
              onFullscreenChange={handleFullscreenChange}
            />

            <MilieusGridSection onFocusIn3D={handleFocusMilieuFromGrid} />

            <TransformationSection />

            <DistributionSection />

            <SelfTestSection
              onViewResultIn3D={handleViewSelfTestResultIn3D}
              initialSurveyCode={initialSurveyCode}
            />
          </main>

          <footer className="border-t border-white/[0.06] py-10">
            <div className="mx-auto flex max-w-[1280px] flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 text-sm text-[#8a8f98] text-center sm:text-left">
              <span>
                SOZIALSTRUKTUR DEUTSCHLAND 2035 · Das schwebende 3D-SINUS-Modell
              </span>
              <span>Gemeinschaftskunde / GRW · Klasse 12</span>
            </div>
          </footer>
        </div>

        <SharePreviewModal
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          mode={mode}
          selection={selection}
        />
      </div>
    </MotionConfig>
  );
}
