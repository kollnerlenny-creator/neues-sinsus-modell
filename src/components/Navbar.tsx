import { Menu, Share2, X } from 'lucide-react';
import { motion, useScroll } from 'motion/react';
import { useState } from 'react';

const NAV_LINKS = [
  { href: '#modell-3d', label: '3D-Modell' },
  { href: '#milieus-detail', label: 'Die 6 Milieus' },
  { href: '#transformation', label: 'Transformation' },
  { href: '#verteilung', label: 'Verteilung' },
  { href: '#selbsttest', label: 'Selbsttest' },
];

interface NavbarProps {
  onOpenShare: () => void;
}

export function Navbar({ onOpenShare }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { scrollYProgress } = useScroll();

  return (
    <header className="sticky top-3 z-40 px-3.5 sm:px-6 lg:px-8 pointer-events-none">
      <div className="pointer-events-auto relative mx-auto flex h-13 sm:h-14 max-w-[1220px] items-center justify-between gap-4 sm:gap-8 overflow-hidden rounded-full border border-white/[0.11] bg-[#090a0d]/95 px-4 sm:px-6 shadow-[0_1px_0_0_rgba(255,255,255,0.07)_inset,0_14px_32px_rgba(0,0,0,0.72)]">
        {/* Subtle Linear scroll progress hairline at bottom of header */}
        <motion.div
          aria-hidden="true"
          style={{ scaleX: scrollYProgress, transformOrigin: 'left center' }}
          className="pointer-events-none absolute inset-x-4 bottom-0 h-[1.5px] bg-gradient-to-r from-white/40 via-emerald-400 to-emerald-300 opacity-80"
        />

        {/* Zone 1: Single-line Brand Wordmark */}
        <a
          href="#einstieg"
          className="font-display text-[15px] font-semibold tracking-tight text-[#f7f8f8] whitespace-nowrap shrink-0 pl-1 hover:text-white transition-colors"
        >
          SINUS 2035
        </a>

        {/* Zone 2: Clean single-line navigation links */}
        <nav
          aria-label="Hauptnavigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#9ea4b0]"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="whitespace-nowrap shrink-0 py-1 hover:text-[#f7f8f8] transition-colors duration-150"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Zone 3: Share button + 1 primary CTA + mobile menu toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenShare}
            aria-label="Link-Vorschau teilen"
            title="Link teilen"
            className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.03] text-[#cbd5e1] hover:bg-white/[0.08] hover:text-white transition-colors cursor-pointer"
          >
            <Share2 className="h-4 w-4" aria-hidden="true" />
          </button>

          <a
            href="#selbsttest"
            className="inline-flex items-center justify-center rounded-full bg-[#f7f8f8] px-4 sm:px-5 py-2 text-[13px] font-semibold text-[#040406] hover:bg-white transition-colors whitespace-nowrap shrink-0 shadow-sm"
          >
            Selbsttest starten
          </a>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Navigation schließen' : 'Navigation öffnen'}
            aria-expanded={mobileOpen}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.1] text-[#cbd5e1] hover:bg-white/[0.08] hover:text-white md:hidden cursor-pointer"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav
          aria-label="Mobile Navigation"
          className="pointer-events-auto mx-auto mt-2 max-w-[1220px] rounded-2xl border border-white/[0.1] bg-[#0a0b0e]/98 p-2.5 shadow-2xl md:hidden"
        >
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-4 py-3 text-[15px] font-medium text-[#cbd5e1] hover:bg-white/[0.06] hover:text-[#f7f8f8]"
              >
                {link.label}
              </a>
            ))}
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                onOpenShare();
              }}
              className="flex items-center gap-2.5 rounded-xl border-t border-white/[0.07] mt-1 px-4 py-3 text-left text-[15px] font-medium text-[#cbd5e1] hover:bg-white/[0.06]"
            >
              <Share2 className="h-4 w-4 text-[#9ea4b0]" aria-hidden="true" />
              <span>Vorschau-Link teilen</span>
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}
