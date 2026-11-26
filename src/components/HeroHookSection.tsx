import { ArrowDown, Compass, Layers, MoveVertical, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { useSiteContent } from '../context/ContentContext';

const SHIFT_ICONS = [Layers, MoveVertical, Users];

export function HeroHookSection() {
  const { content } = useSiteContent();
  const { meta } = content;

  return (
    <section
      id="einstieg"
      className="section-anchor relative flex min-h-[calc(100vh-5.5rem)] flex-col justify-center overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24"
    >
      {/* Subtle fading architectural grid backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: [
            'linear-gradient(to top, #040406 0%, rgba(4,4,6,0.4) 30%, rgba(4,4,6,0) 75%)',
            'radial-gradient(840px circle at 50% 12%, rgba(255, 255, 255, 0.075), transparent 68%)',
            'linear-gradient(to right, rgba(255, 255, 255, 0.025) 1px, transparent 1px)',
            'linear-gradient(to bottom, rgba(255, 255, 255, 0.025) 1px, transparent 1px)',
          ].join(', '),
          backgroundSize: '100% 100%, 100% 100%, 72px 72px, 72px 72px',
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-[1260px] px-4 sm:px-6 lg:px-8">
        {/* Editorial Hero Thesis Hook */}
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-4xl text-center"
        >
          <p className="text-xs sm:text-sm font-medium tracking-wide text-[#9ea4b0]">
            {meta.heroEyebrow}
          </p>

          <h1 className="mt-4 font-display text-4xl sm:text-6xl lg:text-[68px] font-semibold tracking-tight text-[#f7f8f8] leading-[1.04] text-balance">
            {meta.heroHeadline}
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-xl leading-relaxed text-[#b4bac4]">
            {meta.heroLead}
          </p>

          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <a
              href="#modell-3d"
              data-testid="hook-explore-3d-btn"
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-[#f7f8f8] px-7 py-3.5 text-sm sm:text-[15px] font-semibold text-[#040406] hover:bg-white transition-all shadow-[0_0_32px_rgba(255,255,255,0.16)]"
            >
              <span>{meta.heroExploreBtn}</span>
              <ArrowDown className="h-4 w-4" aria-hidden="true" />
            </a>

            <a
              href="#selbsttest"
              data-testid="hook-selftest-btn"
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-white/[0.14] bg-white/[0.03] px-7 py-3.5 text-sm sm:text-[15px] font-medium text-[#e2e8f0] hover:border-white/[0.26] hover:bg-white/[0.07] hover:text-white transition-colors"
            >
              <Compass className="h-4 w-4 text-emerald-400" aria-hidden="true" />
              <span>{meta.heroSelftestBtn}</span>
            </a>
          </div>
        </motion.div>

        {/* Linear Fading-into-Black Architectural Window Preview */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
          className="linear-fade-window mt-12 sm:mt-16 overflow-hidden rounded-3xl"
        >
          {/* Minimal Linear window top bar */}
          <div className="flex items-center justify-between border-b border-white/[0.07] px-6 py-3.5 text-xs sm:text-[13px] text-[#8a8f98]">
            <span className="font-medium text-[#cbd5e1]">
              {meta.heroShiftsBarTitle}
            </span>
            <span className="font-mono-tabular hidden sm:inline">
              {meta.heroShiftsBarTag}
            </span>
          </div>

          <div className="grid grid-cols-1 divide-y md:grid-cols-3 md:divide-y-0 md:divide-x divide-white/[0.07] px-2 pt-2 pb-10 sm:pb-14">
            {meta.heroShifts.map((item, idx) => {
              const Icon = SHIFT_ICONS[idx % SHIFT_ICONS.length];
              return (
                <motion.div
                  key={`${item.metric}-${idx}`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.55,
                    delay: 0.22 + idx * 0.08,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="p-6 sm:p-8"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div
                      className="linear-icon-box flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{ borderColor: `${item.accent}40` }}
                    >
                      <Icon
                        className="h-5 w-5"
                        style={{ color: item.accent }}
                        aria-hidden="true"
                      />
                    </div>
                    <span
                      className="font-mono-tabular text-sm font-semibold"
                      style={{ color: item.accent }}
                    >
                      {item.metric}
                    </span>
                  </div>

                  <h2 className="mt-5 font-display text-xl font-semibold text-[#f7f8f8]">
                    {item.title}
                  </h2>
                  <p className="mt-2 text-[15px] leading-relaxed text-[#9ea4b0]">
                    {item.detail}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Soft dissolve into pure black at bottom edge */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#040406] to-transparent"
          />
        </motion.div>

        {/* Scroll Down Cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.55, delay: 0.25 }}
          className="mt-8 flex justify-center"
        >
          <a
            href="#modell-3d"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-[#8a8f98] hover:text-[#f7f8f8] transition-colors"
          >
            <span>{meta.heroScrollCue}</span>
            <ArrowDown className="h-4 w-4" aria-hidden="true" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
