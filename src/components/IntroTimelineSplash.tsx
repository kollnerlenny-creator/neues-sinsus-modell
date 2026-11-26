import { ArrowRight } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';

interface IntroTimelineSplashProps {
  onComplete: () => void;
}

const TIMELINE_STOPS = [
  {
    year: 2026,
    label: '10 klassische Milieus · Flacher 2D-Raum',
    detail: 'Hohe Durchlässigkeit und breite Mittelschicht',
  },
  {
    year: 2029,
    label: 'KI-Automatisierung & Strukturwandel',
    detail: 'Routineberufe geraten unter massiven Anpassungsdruck',
  },
  {
    year: 2032,
    label: 'Klimakosten & Demografischer Umbruch',
    detail: 'Babyboomer-Rente und Energiepreise verschieben Gewichte',
  },
  {
    year: 2035,
    label: '6 Schwebende Zukunfts-Milieus',
    detail: 'Krisenresilienz trennt die Gesellschaft in drei Dimensionen',
  },
];

const RULER_TICKS = Array.from({ length: 37 }, (_, i) => i);

export function IntroTimelineSplash({ onComplete }: IntroTimelineSplashProps) {
  const prefersReducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<'sweep' | 'focus' | 'zoom' | 'done'>('sweep');
  const [activeYear, setActiveYear] = useState(2026);
  const [displayYear, setDisplayYear] = useState(2026);

  useEffect(() => {
    if (prefersReducedMotion) {
      onComplete();
      return;
    }

    // Smooth numeric odometer tick from 2026 -> 2035 (only updates state when integer changes)
    const startMs = performance.now();
    const sweepDurationMs = 1950;
    let rafId = 0;
    let lastYear = 2026;

    const updateYearCounter = (now: number) => {
      const elapsed = now - startMs;
      const t = Math.min(1, elapsed / sweepDurationMs);
      const eased = 1 - Math.pow(1 - t, 2.2);
      const yr = Math.min(2035, Math.round(2026 + eased * 9));
      if (yr !== lastYear) {
        lastYear = yr;
        setDisplayYear(yr);
      }
      if (t < 1) {
        rafId = requestAnimationFrame(updateYearCounter);
      }
    };
    rafId = requestAnimationFrame(updateYearCounter);

    const t1 = window.setTimeout(() => setActiveYear(2029), 580);
    const t2 = window.setTimeout(() => setActiveYear(2032), 1250);
    const t3 = window.setTimeout(() => {
      setActiveYear(2035);
      setDisplayYear(2035);
      setPhase('focus');
    }, 1980);
    const t4 = window.setTimeout(() => setPhase('zoom'), 2750);
    const t5 = window.setTimeout(() => {
      setPhase('done');
      onComplete();
    }, 3350);

    return () => {
      cancelAnimationFrame(rafId);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.clearTimeout(t4);
      window.clearTimeout(t5);
    };
  }, [onComplete, prefersReducedMotion]);

  const handleSkip = () => {
    setPhase('done');
    onComplete();
  };

  if (prefersReducedMotion || phase === 'done') return null;

  const isZooming = phase === 'zoom';
  const isFocused2035 = phase === 'focus' || phase === 'zoom';
  const activeStop =
    TIMELINE_STOPS.find((s) => s.year === activeYear) ?? TIMELINE_STOPS[0];

  return (
    <AnimatePresence>
      <motion.div
        key="intro-timeline-overlay"
        data-testid="intro-timeline-overlay"
        initial={{ opacity: 1 }}
        animate={{
          opacity: isZooming ? 0 : 1,
        }}
        transition={{
          duration: isZooming ? 0.72 : 0.3,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-[#030305] px-5 sm:px-8 text-[#f7f8f8]"
      >
        {/* Dramatic 3D Perspective Linear Horizon Grid */}
        <motion.div
          aria-hidden="true"
          animate={{
            scale: isZooming ? 1.8 : isFocused2035 ? 1.12 : 1,
            opacity: isZooming ? 0 : 1,
          }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          {/* Radial Core Spotlight */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: [
                'radial-gradient(760px circle at 50% 44%, rgba(255, 255, 255, 0.09), transparent 68%)',
                'radial-gradient(540px circle at 50% 52%, rgba(16, 185, 129, 0.14), transparent 72%)',
              ].join(', '),
            }}
          />

          {/* Subtle Architectural Floor Grid (no expensive CSS maskImage) */}
          <div
            className="absolute inset-x-0 bottom-0 h-[56vh] opacity-55"
            style={{
              backgroundImage: [
                'linear-gradient(to top, rgba(3,3,5,1) 0%, rgba(3,3,5,0) 65%)',
                'linear-gradient(to right, rgba(255,255,255,0.045) 1px, transparent 1px)',
                'linear-gradient(to bottom, rgba(255,255,255,0.045) 1px, transparent 1px)',
              ].join(', '),
              backgroundSize: '100% 100%, 64px 64px, 64px 64px',
            }}
          />

          {/* Subtle Horizontal Horizon Light Line */}
          <motion.div
            initial={{ scaleX: 0.15, opacity: 0 }}
            animate={{
              scaleX: isFocused2035 ? 1 : 0.65,
              opacity: isFocused2035 ? 0.75 : 0.3,
            }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-1/2 top-[48%] h-[1px] w-[min(92vw,1080px)] -translate-x-1/2 bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent"
          />
        </motion.div>

        {/* Skip button */}
        <button
          type="button"
          onClick={handleSkip}
          data-testid="skip-intro-btn"
          className="absolute top-5 right-5 z-20 inline-flex items-center gap-1.5 rounded-full border border-white/[0.14] bg-white/[0.04] px-4 py-2 text-xs sm:text-[13px] font-medium text-[#cbd5e1] hover:bg-white/[0.1] hover:text-white transition-colors cursor-pointer"
        >
          <span>Überspringen</span>
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>

        {/* Centerpiece Warp-Zoom Stage */}
        <motion.div
          animate={{
            scale: isZooming ? 2.65 : isFocused2035 ? 1.04 : 1,
            opacity: isZooming ? 0 : 1,
          }}
          transition={{
            duration: isZooming ? 0.78 : 0.7,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="relative z-10 w-full max-w-4xl text-center"
        >
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="text-xs sm:text-sm font-medium tracking-wide text-[#8a8f98]"
          >
            Sozialstruktur Deutschland · Zeitachse der Transformation
          </motion.p>

          {/* Giant Cinematic Year Readout with Light Flare */}
          <div className="relative mt-5 flex flex-col items-center justify-center">
            <motion.div
              animate={{
                scale: isFocused2035 ? 1.04 : 1,
              }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              style={
                isFocused2035
                  ? { textShadow: '0 0 36px rgba(16,185,129,0.35)' }
                  : undefined
              }
              className={`font-display text-7xl sm:text-[116px] lg:text-[136px] font-semibold tracking-tight leading-none font-mono-tabular transition-colors duration-300 ${
                isFocused2035 ? 'text-white' : 'text-[#d1d5db]'
              }`}
            >
              {displayYear}
            </motion.div>

            {/* Crisp Linear Flare Beam under 2035 */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{
                scaleX: isFocused2035 ? 1 : 0.25,
                opacity: isFocused2035 ? 1 : 0.25,
              }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="mt-4 h-[2px] w-44 sm:w-64 rounded-full bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
            />
          </div>

          {/* Dynamic Chapter Caption */}
          <div className="mt-5 min-h-[60px]">
            <motion.p
              key={`caption-${activeYear}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className={`text-base sm:text-xl font-semibold ${
                isFocused2035 ? 'text-emerald-400' : 'text-[#e2e8f0]'
              }`}
            >
              {activeStop.label}
            </motion.p>
            <motion.p
              key={`detail-${activeYear}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, delay: 0.05 }}
              className="mt-1 text-sm sm:text-[15px] text-[#9ea4b0]"
            >
              {activeStop.detail}
            </motion.p>
          </div>

          {/* Linear Precision Ruler & Chronometer Track */}
          <div className="mt-10 sm:mt-12 px-2 sm:px-8">
            <div className="relative h-16 flex items-center">
              {/* Precision Micro-Tick Ruler Background */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-0.5"
              >
                {RULER_TICKS.map((tick) => (
                  <span
                    key={tick}
                    className={`w-[1px] transition-colors ${
                      tick % 12 === 0
                        ? 'h-4 bg-white/25'
                        : tick % 4 === 0
                          ? 'h-2.5 bg-white/15'
                          : 'h-1.5 bg-white/[0.07]'
                    }`}
                  />
                ))}
              </div>

              {/* Base Hairline Track */}
              <div className="relative h-[2px] w-full rounded-full bg-white/[0.12]" />

              {/* Animated Progress Beam */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1.95, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformOrigin: 'left center' }}
                className="absolute left-0 right-0 h-[3px] rounded-full bg-gradient-to-r from-white/50 via-emerald-400 to-emerald-300 shadow-[0_0_16px_rgba(16,185,129,0.7)]"
              />

              {/* Milestone Nodes */}
              <div className="absolute inset-0 flex items-center justify-between">
                {TIMELINE_STOPS.map((stop) => {
                  const passed = activeYear >= stop.year;
                  const current = activeYear === stop.year;
                  const isTarget2035 = stop.year === 2035;
                  return (
                    <div
                      key={stop.year}
                      className="relative flex flex-col items-center"
                    >
                      <div
                        className={`h-4 w-4 rounded-full border transition-all duration-300 ${
                          current && isTarget2035
                            ? 'scale-125 border-emerald-200 bg-emerald-400 shadow-[0_0_28px_rgba(16,185,129,0.95)]'
                            : passed
                              ? 'border-white bg-white shadow-[0_0_12px_rgba(255,255,255,0.45)]'
                              : 'border-white/25 bg-[#030305]'
                        }`}
                      />
                      <span
                        className={`absolute top-7 font-mono-tabular text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors duration-300 ${
                          current && isTarget2035
                            ? 'text-emerald-400'
                            : passed
                              ? 'text-[#f7f8f8]'
                              : 'text-[#62666d]'
                        }`}
                      >
                        {stop.year}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: isFocused2035 ? 1 : 0.4 }}
            transition={{ duration: 0.4 }}
            className="mt-14 text-xs sm:text-sm font-medium text-[#8a8f98]"
          >
            {isFocused2035
              ? 'Eintritt in die Zukunftsprojektion 2035 …'
              : 'Zeitachse wird kalibriert …'}
          </motion.p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
