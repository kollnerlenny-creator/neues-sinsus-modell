import { Check, Copy, Link2, Share2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import sharePreviewImg from '../assets/images/sinus_share_preview_1795621646525.jpg';
import { MILIEUS, type ModelMode } from '../data/milieus';
import type { SelectionPayload } from '../three/SinusSceneManager';

interface SharePreviewModalProps {
  open: boolean;
  onClose: () => void;
  mode: ModelMode;
  selection: SelectionPayload | null;
}

export function SharePreviewModal({
  open,
  onClose,
  mode,
  selection,
}: SharePreviewModalProps) {
  const [includeViewState, setIncludeViewState] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const base = `${window.location.origin}${window.location.pathname}`;
    if (!includeViewState) return base;

    const params = new URLSearchParams();
    if (mode === '2026') {
      params.set('mode', '2026');
    }
    if (selection) {
      params.set('kind', selection.kind);
      params.set('milieu', selection.id);
    }
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  }, [includeViewState, mode, selection]);

  const previewTitle = useMemo(() => {
    if (includeViewState && selection?.kind === '2035') {
      const m = MILIEUS.find((item) => item.id === selection.id);
      if (m) return `${m.name} (${m.share2035} %) · SINUS 2035`;
    }
    return 'SOZIALSTRUKTUR DEUTSCHLAND 2035 – Das schwebende 3D-SINUS-Modell';
  }, [includeViewState, selection]);

  const hostLabel = useMemo(() => {
    if (!shareUrl) return 'sinus2035.app';
    try {
      return new URL(shareUrl).hostname;
    } catch {
      return 'sinus2035.app';
    }
  }, [shareUrl]);

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        throw new Error('Clipboard unavailable');
      }
    } catch {
      const ta = document.createElement('textarea');
      ta.value = shareUrl;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (!shareUrl || typeof navigator.share !== 'function') return;
    try {
      await navigator.share({
        title: previewTitle,
        text: 'Interaktives 3D-Sozialstrukturmodell auf Basis der SINUS-Milieus (2026 vs. 2035).',
        url: shareUrl,
      });
    } catch {
      // User cancelled native share sheet
    }
  };

  const supportsNativeShare =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="share-modal-title"
          data-testid="share-preview-modal"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="linear-surface relative z-10 w-full max-w-lg overflow-hidden rounded-3xl bg-[#0f1011] p-5 sm:p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium text-[#8a8f98]">
                  Vorschau-Link &amp; OpenGraph-Karte
                </p>
                <h2
                  id="share-modal-title"
                  className="mt-1 font-display text-lg font-semibold text-[#f7f8f8]"
                >
                  Modell mit Link-Vorschau teilen
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Teilen-Dialog schließen"
                data-testid="close-share-modal-btn"
                className="rounded-full border border-white/[0.1] p-1.5 text-[#8a8f98] hover:bg-white/[0.06] hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Live Social Card Preview */}
            <div className="mt-4 overflow-hidden rounded-2xl border border-white/[0.1] bg-[#08090a]">
              <div className="aspect-video w-full overflow-hidden border-b border-white/[0.08] bg-[#08090a]">
                <img
                  src={sharePreviewImg}
                  alt="Vorschaubild: Schwebendes 3D-SINUS-Modell Deutschland 2035"
                  onError={(e) => {
                    if (!e.currentTarget.src.endsWith('/og-preview.jpg')) {
                      e.currentTarget.src = '/og-preview.jpg';
                    }
                  }}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-3.5 sm:p-4">
                <div className="text-[11px] font-mono-tabular text-[#8a8f98] truncate">
                  {hostLabel}
                </div>
                <div className="mt-1 text-sm font-semibold text-[#f7f8f8] leading-snug">
                  {previewTitle}
                </div>
                <p className="mt-1 text-xs text-[#9ea4b0] line-clamp-2">
                  Entdecke die 6 Zukunfts-Milieus 2035 im interaktiven 3D-Raummodell,
                  vergleiche 2026 vs. 2035 und bestimme deinen Standort im Selbsttest.
                </p>
              </div>
            </div>

            {/* Optional Deep-Link toggle when a mode/milieu is active */}
            {(mode === '2026' || selection !== null) && (
              <label className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3.5 py-2.5 text-xs text-[#cbd5e1] cursor-pointer">
                <span>Aktuelle Ansicht (2026/2035 &amp; Auswahl) im Link speichern</span>
                <input
                  type="checkbox"
                  checked={includeViewState}
                  onChange={(e) => setIncludeViewState(e.target.checked)}
                  className="h-4 w-4 accent-white rounded cursor-pointer"
                />
              </label>
            )}

            {/* URL Field + Copy/Share Actions */}
            <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
              <div className="flex flex-1 items-center gap-2 rounded-full border border-white/[0.1] bg-[#08090a] px-3.5 py-2 text-xs text-[#9ea4b0] min-w-0">
                <Link2 className="h-3.5 w-3.5 shrink-0 text-[#62666d]" aria-hidden="true" />
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  aria-label="Teilbarer Vorschau-Link"
                  data-testid="share-url-input"
                  onFocus={(e) => e.currentTarget.select()}
                  className="w-full bg-transparent text-xs text-[#e2e8f0] outline-none truncate font-mono-tabular"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopy}
                  data-testid="copy-share-link-btn"
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-full bg-[#f7f8f8] px-4 py-2 text-xs font-semibold text-[#08090a] hover:bg-white transition-colors cursor-pointer whitespace-nowrap"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                      <span>Kopiert</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Link kopieren</span>
                    </>
                  )}
                </button>

                {supportsNativeShare && (
                  <button
                    type="button"
                    onClick={handleNativeShare}
                    aria-label="Über System-Teilen senden"
                    className="inline-flex items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.04] p-2 text-[#f7f8f8] hover:bg-white/[0.08] cursor-pointer"
                  >
                    <Share2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
