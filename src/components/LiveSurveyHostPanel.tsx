import { ArrowLeft, Check, Copy, Link2, PlusCircle, QrCode } from 'lucide-react';
import QRCode from 'qrcode';
import { useEffect, useMemo, useState } from 'react';
import type { MilieuId } from '../data/milieus';
import {
  aggregateSurveyResults,
  type LiveSurveySession,
  type SurveyResponseDoc,
} from '../services/liveSurvey';
import { LiveSurveyChart } from './LiveSurveyChart';

interface LiveSurveyHostPanelProps {
  session: LiveSurveySession;
  responses: SurveyResponseDoc[];
  syncError: string | null;
  isCreating: boolean;
  onCreateNewSession: () => void;
  onExitHostMode: () => void;
  onProjectAverageIn3D: (
    milieuId: MilieuId,
    coords: { uX: number; uY: number; uZ: number },
  ) => void;
}

export function LiveSurveyHostPanel({
  session,
  responses,
  syncError,
  isCreating,
  onCreateNewSession,
  onExitHostMode,
  onProjectAverageIn3D,
}: LiveSurveyHostPanelProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedType, setCopiedType] = useState<'code' | 'link' | null>(null);

  const joinUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}${window.location.pathname}?umfrage=${session.code}#selbsttest`;
  }, [session.code]);

  const aggregation = useMemo(
    () => aggregateSurveyResults(responses),
    [responses],
  );

  useEffect(() => {
    let active = true;
    if (!joinUrl) return;
    QRCode.toDataURL(joinUrl, {
      width: 280,
      margin: 2,
      color: {
        dark: '#08090a',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch(() => {
        if (active) setQrDataUrl('');
      });

    return () => {
      active = false;
    };
  }, [joinUrl]);

  const handleCopy = async (type: 'code' | 'link', value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedType(type);
      window.setTimeout(() => setCopiedType(null), 1800);
    } catch {
      // Ignore clipboard permission errors in restricted contexts
    }
  };

  return (
    <div data-testid="live-survey-host-panel" className="p-6 sm:p-8">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-5">
        <div>
          <p className="text-xs font-medium text-emerald-400">
            Host-Ansicht · Gerätesynchronisation über Cloud Firestore
          </p>
          <h3 className="mt-1 font-display text-xl sm:text-2xl font-semibold text-[#f7f8f8]">
            {session.title}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onCreateNewSession}
            disabled={isCreating}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.12] bg-white/[0.04] px-3.5 py-2 text-xs sm:text-[13px] font-medium text-[#e2e8f0] hover:bg-white/[0.09] disabled:opacity-50 cursor-pointer transition-colors"
          >
            <PlusCircle className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Neuer Code</span>
          </button>

          <button
            type="button"
            onClick={onExitHostMode}
            data-testid="exit-host-mode-btn"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.12] bg-white/[0.04] px-3.5 py-2 text-xs sm:text-[13px] font-medium text-[#e2e8f0] hover:bg-white/[0.09] cursor-pointer transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Zum Selbsttest</span>
          </button>
        </div>
      </div>

      {syncError && (
        <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {syncError}
        </div>
      )}

      {/* Two-Column Live Workspace: Join Info + Live Chart */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: QR Code & Join Code */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl border border-white/[0.1] bg-[#0a0c10]/90 p-5 sm:p-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-[#9ea4b0]">
              <QrCode className="h-4 w-4 text-emerald-400" aria-hidden="true" />
              <span>Andere Geräte einladen</span>
            </div>

            <div className="mt-4 rounded-2xl border border-white/[0.1] bg-white/[0.03] p-4 text-center">
              <div className="text-xs font-medium text-[#9ea4b0]">
                Beitritts-Code eingeben
              </div>
              <div
                data-testid="host-survey-code"
                className="mt-1 font-mono-tabular text-3xl sm:text-4xl font-semibold tracking-[0.2em] text-[#f7f8f8]"
              >
                {session.code}
              </div>
            </div>

            {/* Crisp Scannable QR Code */}
            <div className="mt-5 flex flex-col items-center">
              <div className="rounded-2xl bg-white p-3.5 shadow-lg">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`QR-Code zur Live-Umfrage ${session.code}`}
                    data-testid="host-qr-image"
                    className="h-44 w-44 sm:h-48 sm:w-48 block"
                  />
                ) : (
                  <div className="flex h-44 w-44 sm:h-48 sm:w-48 items-center justify-center text-xs text-slate-600">
                    QR-Code wird erzeugt…
                  </div>
                )}
              </div>
              <p className="mt-3 text-center text-xs leading-relaxed text-[#9ea4b0]">
                Mit Smartphone-Kamera scannen oder auf anderem Gerät unter{' '}
                <strong className="text-[#e2e8f0]">„Mit Code beitreten“</strong>{' '}
                eingeben.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2.5 border-t border-white/[0.08] pt-4">
            <button
              type="button"
              onClick={() => handleCopy('code', session.code)}
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-white/[0.12] bg-white/[0.04] px-3 py-2 text-xs font-medium text-[#e2e8f0] hover:bg-white/[0.09] cursor-pointer transition-colors"
            >
              {copiedType === 'code' ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              <span>{copiedType === 'code' ? 'Kopiert!' : 'Code kopieren'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleCopy('link', joinUrl)}
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-white/[0.12] bg-white/[0.04] px-3 py-2 text-xs font-medium text-[#e2e8f0] hover:bg-white/[0.09] cursor-pointer transition-colors"
            >
              {copiedType === 'link' ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Link2 className="h-3.5 w-3.5" />
              )}
              <span>{copiedType === 'link' ? 'Kopiert!' : 'Link kopieren'}</span>
            </button>
          </div>
        </div>

        {/* Right: Live Distribution Chart */}
        <div className="lg:col-span-7">
          <LiveSurveyChart
            aggregation={aggregation}
            surveyCode={session.code}
            onProjectAverageIn3D={onProjectAverageIn3D}
          />
        </div>
      </div>
    </div>
  );
}
