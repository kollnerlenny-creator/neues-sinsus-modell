import { BarChart3, Compass, Radio, Users } from 'lucide-react';
import { motion } from 'motion/react';
import type { MilieuId } from '../data/milieus';
import type { LiveSurveyAggregation } from '../services/liveSurvey';
import { getMilieuIcon } from '../utils/milieuIcons';

interface LiveSurveyChartProps {
  aggregation: LiveSurveyAggregation;
  surveyCode: string;
  onProjectAverageIn3D?: (
    milieuId: MilieuId,
    coords: { uX: number; uY: number; uZ: number },
  ) => void;
}

export function LiveSurveyChart({
  aggregation,
  surveyCode,
  onProjectAverageIn3D,
}: LiveSurveyChartProps) {
  const { totalResponses, buckets, avgX, avgY, avgZ, leadingMilieu } = aggregation;
  const maxBarScale = Math.max(
    35,
    ...buckets.map((b) => Math.max(b.percent, b.milieu.share2035)),
  );

  return (
    <div
      data-testid="live-survey-chart"
      className="flex h-full flex-col justify-between rounded-2xl border border-white/[0.1] bg-[#0a0c10]/90 p-5 sm:p-6"
    >
      <div>
        {/* Header Summary */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/[0.08] pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-400">
              <Radio className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Echtzeit-Auswertung · Raum {surveyCode}</span>
            </div>
            <h4 className="mt-1 font-display text-xl font-semibold text-[#f7f8f8]">
              Live-Verteilung der Ergebnisse
            </h4>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-white/[0.1] bg-white/[0.03] px-3.5 py-2">
            <Users className="h-4 w-4 text-[#9ea4b0]" aria-hidden="true" />
            <div className="text-right">
              <div
                data-testid="live-response-count"
                className="font-mono-tabular text-xl font-semibold leading-none text-[#f7f8f8]"
              >
                {totalResponses}
              </div>
              <div className="mt-0.5 text-[11px] text-[#8a8f98]">
                {totalResponses === 1 ? 'Teilnahme' : 'Teilnahmen'}
              </div>
            </div>
          </div>
        </div>

        {/* Distribution Bars */}
        {totalResponses === 0 ? (
          <div
            data-testid="live-chart-empty"
            className="my-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.12] bg-white/[0.015] px-5 py-10 text-center"
          >
            <div className="linear-icon-box flex h-11 w-11 items-center justify-center rounded-xl text-[#9ea4b0]">
              <BarChart3 className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="mt-3 font-display text-base font-semibold text-[#f7f8f8]">
              Warte auf die ersten Antworten
            </p>
            <p className="mt-1 max-w-sm text-sm text-[#9ea4b0]">
              Sobald Teilnehmende den QR-Code scannen oder den Code eingeben und den
              Selbsttest abschließen, aktualisiert sich das Diagramm hier live.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between text-xs text-[#8a8f98]">
              <span>Gruppe (farbig) vs. Deutschland 2035 (Markierung)</span>
              <span className="font-mono-tabular">Anteil / Stimmen</span>
            </div>

            {buckets.map((bucket) => {
              const Icon = getMilieuIcon(bucket.milieu.id);
              const barWidth = Math.round((bucket.percent / maxBarScale) * 100);
              const benchmarkLeft = Math.round(
                (bucket.milieu.share2035 / maxBarScale) * 100,
              );

              return (
                <div
                  key={bucket.milieu.id}
                  data-testid={`live-bar-${bucket.milieu.id}`}
                  className="space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="flex items-center gap-2 min-w-0 font-medium text-[#e2e8f0]">
                      <Icon
                        className="h-4 w-4 shrink-0"
                        style={{ color: bucket.milieu.colorHex }}
                        aria-hidden="true"
                      />
                      <span className="truncate">{bucket.milieu.shortName}</span>
                    </span>
                    <div className="flex items-center gap-2.5 shrink-0 font-mono-tabular">
                      <span className="text-xs text-[#8a8f98]">
                        {bucket.count}×
                      </span>
                      <span
                        className="w-11 text-right font-semibold"
                        style={{ color: bucket.milieu.colorHex }}
                      >
                        {bucket.percent} %
                      </span>
                    </div>
                  </div>

                  <div className="relative h-4 w-full overflow-hidden rounded-full border border-white/[0.08] bg-white/[0.04]">
                    <motion.div
                      initial={false}
                      animate={{ width: `${barWidth}%` }}
                      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: bucket.milieu.colorHex }}
                    />
                    {/* Germany 2035 reference tick */}
                    <div
                      title={`Prognose Deutschland 2035: ${bucket.milieu.share2035} %`}
                      style={{ left: `${Math.min(98, benchmarkLeft)}%` }}
                      className="pointer-events-none absolute inset-y-0 w-[2px] bg-white/65"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Group Average Footer */}
      {totalResponses > 0 && leadingMilieu && (
        <div className="mt-6 border-t border-white/[0.08] pt-4 space-y-3">
          <div className="grid grid-cols-3 gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 text-center">
            <div>
              <div className="text-[11px] text-[#8a8f98]">Ø Werte (X)</div>
              <div className="font-mono-tabular text-base font-semibold text-[#f7f8f8]">
                {avgX}
              </div>
            </div>
            <div className="border-x border-white/[0.07]">
              <div className="text-[11px] text-[#8a8f98]">Ø Lage (Y)</div>
              <div className="font-mono-tabular text-base font-semibold text-[#f7f8f8]">
                {avgY}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-[#8a8f98]">Ø Resilienz (Z)</div>
              <div className="font-mono-tabular text-base font-semibold text-emerald-400">
                {avgZ}
              </div>
            </div>
          </div>

          {onProjectAverageIn3D && (
            <button
              type="button"
              onClick={() =>
                onProjectAverageIn3D(leadingMilieu.milieu.id, {
                  uX: avgX,
                  uY: avgY,
                  uZ: avgZ,
                })
              }
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#f7f8f8] px-4 py-2.5 text-sm font-semibold text-[#08090a] hover:bg-white cursor-pointer transition-colors"
            >
              <Compass className="h-4 w-4" aria-hidden="true" />
              <span>Gruppen-Durchschnitt im 3D-Modell zeigen</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
