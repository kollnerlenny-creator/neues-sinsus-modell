import { Menu, Share2, X } from 'lucide-react';
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

  return (
    <header className="sticky top-3 z-40 px-3.5 sm:px-6 lg:px-8 pointer-events-none">
      <div className="pointer-events-auto mx-auto flex h-12 sm:h-13 max-w-[1140px] items-center justify-between gap-3 sm:gap-8 rounded-full border border-white/[0.1] bg-[#121316]/78 px-3.5 sm:px-5 backdrop-blur-xl shadow-[0_12px_36px_rgba(0,0,0,0.5)]">
        {/* Zone 1: Single-line Brand Wordmark */}
        <a
          href="#modell-3d"
          className="font-display text-sm font-semibold tracking-tight text-[#f7f8f8] whitespace-nowrap shrink-0 pl-1"
        >
          SINUS 2035
        </a>

        {/* Zone 2: Clean single-line navigation links */}
        <nav
          aria-label="Hauptnavigation"
          className="hidden md:flex items-center gap-7 text-[13px] font-medium text-[#8a8f98]"
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

        {/* Zone 3: Share button (compact) + 1 primary CTA + mobile menu toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenShare}
            aria-label="Link-Vorschau teilen"
            title="Link teilen"
            className="hidden sm:inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.1] text-[#9ea4b0] hover:bg-white/[0.06] hover:text-white transition-colors cursor-pointer"
          >
            <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
          </button>

          <a
            href="#selbsttest"
            className="inline-flex items-center justify-center rounded-full bg-[#f7f8f8] px-3.5 sm:px-4 py-1.5 text-[11.5px] sm:text-xs font-semibold text-[#08090a] hover:bg-white transition-colors whitespace-nowrap shrink-0"
          >
            Selbsttest starten
          </a>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Navigation schließen' : 'Navigation öffnen'}
            aria-expanded={mobileOpen}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.1] text-[#9ea4b0] hover:bg-white/[0.06] hover:text-white md:hidden cursor-pointer"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav
          aria-label="Mobile Navigation"
          className="pointer-events-auto mx-auto mt-2 max-w-[1140px] rounded-2xl border border-white/[0.1] bg-[#121316]/95 p-2 backdrop-blur-xl shadow-2xl md:hidden"
        >
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-3.5 py-2.5 text-sm font-medium text-[#9ea4b0] hover:bg-white/[0.06] hover:text-[#f7f8f8]"
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
              className="flex items-center gap-2 rounded-xl border-t border-white/[0.07] mt-1 px-3.5 py-2.5 text-left text-sm font-medium text-[#cbd5e1] hover:bg-white/[0.06]"
            >
              <Share2 className="h-4 w-4 text-[#8a8f98]" aria-hidden="true" />
              <span>Vorschau-Link teilen</span>
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}
