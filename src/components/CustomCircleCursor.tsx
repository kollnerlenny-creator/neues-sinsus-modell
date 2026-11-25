import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export function CustomCircleCursor() {
  const ringRef = useRef<HTMLDivElement | null>(null);
  const dotRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const ringEl = ringRef.current;
    const dotEl = dotRef.current;
    if (!ringEl || !dotEl) return;

    // Skip only on pure touch-only devices that report no fine pointer at all
    const hasAnyFinePointer = window.matchMedia('(any-pointer: fine)').matches;
    const isPrimaryCoarseNoHover =
      window.matchMedia('(pointer: coarse)').matches &&
      window.matchMedia('(hover: none)').matches;
    if (!hasAnyFinePointer && isPrimaryCoarseNoHover) {
      return;
    }

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    let active = false;
    let visible = false;
    let isPressed = false;
    let isInteractive = false;
    let isGrabbing = false;
    let lastTouchMs = 0;

    let targetX = -100;
    let targetY = -100;
    let ringX = -100;
    let ringY = -100;
    let ringScale = 1;
    let dotScale = 1;
    let rafId = 0;

    const applyTransforms = () => {
      ringEl.style.transform = `translate3d(${ringX.toFixed(1)}px, ${ringY.toFixed(1)}px, 0) translate(-50%, -50%) scale(${ringScale})`;
      dotEl.style.transform = `translate3d(${targetX.toFixed(1)}px, ${targetY.toFixed(1)}px, 0) translate(-50%, -50%) scale(${dotScale})`;
    };

    const updateVisualState = () => {
      ringEl.style.opacity = visible ? '1' : '0';
      dotEl.style.opacity = visible ? '1' : '0';

      ringScale = isPressed
        ? 0.8
        : isInteractive
          ? 1.38
          : isGrabbing
            ? 0.86
            : 1;
      dotScale = isPressed ? 1.35 : isInteractive ? 0.78 : 1;

      ringEl.dataset.state = isInteractive
        ? 'interactive'
        : isGrabbing
          ? 'grabbing'
          : 'default';
      dotEl.dataset.state = isInteractive ? 'interactive' : 'default';

      applyTransforms();
    };

    const detectContext = (x: number, y: number, eventTarget: EventTarget | null) => {
      const target =
        eventTarget instanceof Element
          ? eventTarget
          : document.elementFromPoint(x, y);
      if (!target) {
        isInteractive = false;
        isGrabbing = false;
        return;
      }
      const interactiveMatch = target.closest(
        'a, button, [role="button"], input, select, textarea, label, [data-hover-3d="true"]',
      );
      const grabbingMatch = target.closest('[data-canvas-grabbing="true"]');
      isInteractive = Boolean(interactiveMatch);
      isGrabbing = !isInteractive && Boolean(grabbingMatch);
    };

    const tick = () => {
      const lerp = reducedMotion ? 1 : 0.28;
      ringX += (targetX - ringX) * lerp;
      ringY += (targetY - ringY) * lerp;

      applyTransforms();

      if (
        visible &&
        (Math.abs(targetX - ringX) > 0.25 || Math.abs(targetY - ringY) > 0.25)
      ) {
        rafId = window.requestAnimationFrame(tick);
      } else {
        ringX = targetX;
        ringY = targetY;
        applyTransforms();
        rafId = 0;
      }
    };

    const scheduleTick = () => {
      if (!rafId) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    const activateAt = (
      x: number,
      y: number,
      target: EventTarget | null,
    ) => {
      if (!active) {
        active = true;
        document.documentElement.classList.add('has-custom-cursor');
        ringX = x;
        ringY = y;
      }
      targetX = x;
      targetY = y;
      visible = true;
      detectContext(x, y, target);
      updateVisualState();
      scheduleTick();
    };

    const deactivateForTouch = () => {
      lastTouchMs = performance.now();
      active = false;
      visible = false;
      isPressed = false;
      isInteractive = false;
      isGrabbing = false;
      document.documentElement.classList.remove('has-custom-cursor');
      updateVisualState();
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') {
        deactivateForTouch();
        return;
      }
      activateAt(e.clientX, e.clientY, e.target);
    };

    const onMouseMove = (e: MouseEvent) => {
      // Ignore synthetic mousemove emitted right after a touch tap
      if (performance.now() - lastTouchMs < 600) return;
      activateAt(e.clientX, e.clientY, e.target);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'touch') {
        deactivateForTouch();
        return;
      }
      isPressed = true;
      activateAt(e.clientX, e.clientY, e.target);
    };

    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      isPressed = false;
      detectContext(e.clientX, e.clientY, e.target);
      updateVisualState();
    };

    const onTouchStart = () => {
      deactivateForTouch();
    };

    const onPointerLeave = () => {
      visible = false;
      isPressed = false;
      isInteractive = false;
      isGrabbing = false;
      updateVisualState();
    };

    window.addEventListener('pointermove', onPointerMove, {
      capture: true,
      passive: true,
    });
    window.addEventListener('mousemove', onMouseMove, {
      capture: true,
      passive: true,
    });
    window.addEventListener('pointerdown', onPointerDown, {
      capture: true,
      passive: true,
    });
    window.addEventListener('pointerup', onPointerUp, {
      capture: true,
      passive: true,
    });
    window.addEventListener('touchstart', onTouchStart, {
      capture: true,
      passive: true,
    });
    document.addEventListener('mouseleave', onPointerLeave);
    window.addEventListener('blur', onPointerLeave);

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      document.documentElement.classList.remove('has-custom-cursor');
      window.removeEventListener('pointermove', onPointerMove, { capture: true });
      window.removeEventListener('mousemove', onMouseMove, { capture: true });
      window.removeEventListener('pointerdown', onPointerDown, { capture: true });
      window.removeEventListener('pointerup', onPointerUp, { capture: true });
      window.removeEventListener('touchstart', onTouchStart, { capture: true });
      document.removeEventListener('mouseleave', onPointerLeave);
      window.removeEventListener('blur', onPointerLeave);
    };
  }, []);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      aria-hidden="true"
      data-testid="custom-circle-cursor"
      className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden"
    >
      {/* Outer sleek Linear circular ring */}
      <div
        ref={ringRef}
        style={{ opacity: 0 }}
        className="fixed left-0 top-0 h-8 w-8 rounded-full border-[1.5px] border-white/85 bg-white/[0.04] shadow-[0_0_0_1px_rgba(4,4,6,0.55),0_0_20px_rgba(255,255,255,0.14)] transition-[border-color,background-color,box-shadow] duration-150 ease-out data-[state=interactive]:border-emerald-400 data-[state=interactive]:bg-emerald-400/15 data-[state=interactive]:shadow-[0_0_0_1px_rgba(4,4,6,0.6),0_0_24px_rgba(52,211,153,0.35)] data-[state=grabbing]:border-white data-[state=grabbing]:bg-white/12"
      />
      {/* Crisp center dot */}
      <div
        ref={dotRef}
        style={{ opacity: 0 }}
        className="fixed left-0 top-0 h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_6px_rgba(0,0,0,0.7)] transition-colors duration-150 ease-out data-[state=interactive]:bg-emerald-300"
      />
    </div>,
    document.body,
  );
}
