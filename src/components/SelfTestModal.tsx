import { ArrowLeft, ArrowRight, Compass, RotateCcw, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { MilieuId } from '../data/milieus';
import {
  calculateSelfTestResult,
  SELF_TEST_QUESTIONS,
  SELF_TEST_SCALE_OPTIONS,
} from '../utils/selfTest';

interface SelfTestModalProps {
  open: boolean;
  onClose: () => void;
  onViewIn3D: (milieuId: MilieuId) => void;
}

export function SelfTestModal({ open, onClose, onViewIn3D }: SelfTestModalProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResult, setShowResult] = useState(false);
  const [barsAnimated, setBarsAnimated] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!showResult) {
      setBarsAnimated(false);
      return;
    }
    const id = window.requestAnimationFrame(() => {
      setBarsAnimated(true);
    });
    return () => window.cancelAnimationFrame(id);
  }, [showResult]);

  const result = useMemo(() => {
    if (!showResult) return null;
    return calculateSelfTestResult(answers);
  }, [showResult, answers]);

  if (!open) return null;

  const currentQuestion = SELF_TEST_QUESTIONS[stepIndex];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const progressPct = showResult ? 100 : ((stepIndex + 1) / SELF_TEST_QUESTIONS.length) * 100;

  const handleSelectOption = (value: number) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
  };

  const handleNext = () => {
    if (currentAnswer === undefined) return;
    if (stepIndex < SELF_TEST_QUESTIONS.length - 1) {
      setStepIndex((prev) => prev + 1);
    } else {
      setShowResult(true);
    }
  };

  const handlePrev = () => {
    if (showResult) {
      setShowResult(false);
      setStepIndex(SELF_TEST_QUESTIONS.length - 1);
      return;
    }
    if (stepIndex > 0) {
      setStepIndex((prev) => prev - 1);
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setStepIndex(0);
    setShowResult(false);
    setBarsAnimated(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="selftest-modal-title"
      data-testid="selftest-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75"
    >
      <div className="glass-panel relative w-full max-w-2xl max-h-[90vh] rounded-2xl flex flex-col overflow-hidden">
        {/* Top Accent Strip */}
        <div
          className="h-1 w-full shrink-0"
          style={{
            background: showResult && result
              ? result.topMatch.milieu.colorHex
              : 'linear-gradient(90deg, #10b981, #06b6d4, #3b82f6)',
          }}
        />

        {/* Modal Header */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-slate-700/50 shrink-0">
          <div>
            <p className="text-[11px] font-medium tracking-wider uppercase text-emerald-400">
              {showResult ? 'Auswertung · Prognose 2035' : `Frage ${stepIndex + 1} von ${SELF_TEST_QUESTIONS.length}`}
            </p>
            <h2
              id="selftest-modal-title"
              className="font-display text-lg sm:text-xl font-bold text-slate-50"
            >
              Milieu-Selbsttest 2035
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Selbsttest schließen"
            data-testid="selftest-close-btn"
            className="w-9 h-9 rounded-xl inline-flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar */}
        {!showResult && (
          <div className="px-6 pt-3 shrink-0">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
              <span>{currentQuestion.dimensionLabel}</span>
              <span className="font-mono-tabular text-slate-300">
                Frage {stepIndex + 1} von {SELF_TEST_QUESTIONS.length}
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {!showResult ? (
            <div>
              <p className="text-base sm:text-[17px] font-medium leading-relaxed text-slate-100 mb-5">
                „{currentQuestion.text}“
              </p>

              <div className="space-y-2.5" role="radiogroup" aria-label="Antwortskala">
                {SELF_TEST_SCALE_OPTIONS.map((opt) => {
                  const selected = currentAnswer === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      data-testid={`selftest-option-${opt.value}`}
                      onClick={() => handleSelectOption(opt.value)}
                      className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-left transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-400 ${
                        selected
                          ? 'bg-emerald-500/20 border-emerald-400/70 text-white shadow-[0_0_20px_rgba(16,185,129,0.18)]'
                          : 'bg-slate-900/65 border-slate-700/55 text-slate-200 hover:bg-slate-800/80 hover:border-slate-500/60'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span
                          className={`w-7 h-7 rounded-lg font-mono-tabular text-xs font-bold inline-flex items-center justify-center shrink-0 ${
                            selected
                              ? 'bg-emerald-400 text-slate-950'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}
                        >
                          {opt.value}
                        </span>
                        <span className="text-sm font-medium">{opt.label}</span>
                      </span>
                      {selected && (
                        <span className="text-[11px] font-semibold text-emerald-300 shrink-0">
                          Gewählt
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            result && (
              <div className="space-y-5" data-testid="selftest-result">
                {/* 3D Coordinates Banner */}
                <div className="rounded-xl bg-slate-900/75 border border-slate-700/55 px-4 py-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Dein Standort im 3D-Raum
                  </div>
                  <div
                    data-testid="selftest-coords"
                    className="font-mono-tabular text-xs sm:text-[13px] text-slate-100 flex flex-wrap items-center gap-x-2.5 gap-y-1"
                  >
                    <span>
                      Werteorientierung (X):{' '}
                      <strong className="text-sky-300">{result.uXRounded}%</strong>
                    </span>
                    <span className="text-slate-600" aria-hidden="true">|</span>
                    <span>
                      Soziale Lage (Y):{' '}
                      <strong className="text-violet-300">{result.uYRounded}%</strong>
                    </span>
                    <span className="text-slate-600" aria-hidden="true">|</span>
                    <span>
                      Krisenresilienz (Z):{' '}
                      <strong className="text-emerald-300">{result.uZRounded}%</strong>
                    </span>
                  </div>
                </div>

                {/* Top Match */}
                <div
                  className="rounded-2xl p-4 border bg-slate-900/75"
                  style={{ borderColor: `${result.topMatch.milieu.colorHex}75` }}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3
                      data-testid="selftest-top-result"
                      className="font-display text-base sm:text-lg font-bold text-white"
                    >
                      Dein Zukunfts-Milieu 2035:{' '}
                      <span style={{ color: result.topMatch.milieu.colorHex }}>
                        {result.topMatch.milieu.name}
                      </span>{' '}
                      <span className="font-mono-tabular text-slate-100">
                        ({result.topMatch.percent}%)
                      </span>
                    </h3>
                  </div>
                  <p className="mt-2 text-xs sm:text-[13px] leading-relaxed text-slate-300">
                    {result.explanation}
                  </p>
                </div>

                {/* Sorted Bar Chart of all 6 Milieus */}
                <div>
                  <h4 className="font-display text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
                    Milieu-Übereinstimmung (Platz 1 bis 6 · Summe 100 %)
                  </h4>
                  <div className="space-y-2">
                    {result.ranked.map((entry, idx) => (
                      <div key={entry.milieu.id} className="space-y-1">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="flex items-center gap-2 min-w-0">
                            <span className="font-mono-tabular text-[11px] text-slate-400 w-4 shrink-0">
                              {idx + 1}.
                            </span>
                            <span
                              className="w-2.5 h-2.5 rounded-xs shrink-0"
                              style={{ backgroundColor: entry.milieu.colorHex }}
                              aria-hidden="true"
                            />
                            <span className="font-medium text-slate-100 truncate">
                              {entry.milieu.name}
                            </span>
                          </span>
                          <span className="font-mono-tabular font-semibold text-slate-100 shrink-0">
                            {entry.percent}%
                          </span>
                        </div>
                        <div className="h-2.5 w-full rounded-full bg-slate-800/90 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700 ease-out"
                            style={{
                              width: barsAnimated ? `${Math.max(2, entry.percent)}%` : '0%',
                              backgroundColor: entry.milieu.colorHex,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-700/50 flex flex-wrap items-center justify-between gap-3 shrink-0 bg-slate-950/35">
          {!showResult ? (
            <>
              <button
                type="button"
                onClick={handlePrev}
                disabled={stepIndex === 0}
                data-testid="selftest-prev-btn"
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-sky-400 ${
                  stepIndex === 0
                    ? 'bg-slate-900/40 text-slate-500 border border-slate-800/60 cursor-not-allowed'
                    : 'bg-slate-800/80 text-slate-200 border border-slate-700/60 hover:bg-slate-700/85 cursor-pointer'
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Zurück</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={currentAnswer === undefined}
                data-testid="selftest-next-btn"
                className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold transition-all focus-visible:outline-2 focus-visible:outline-sky-400 ${
                  currentAnswer === undefined
                    ? 'bg-slate-800/50 text-slate-500 border border-slate-700/40 cursor-not-allowed'
                    : 'bg-emerald-500/25 text-emerald-100 border border-emerald-400/55 hover:bg-emerald-500/35 cursor-pointer shadow-[0_0_18px_rgba(16,185,129,0.22)]'
                }`}
              >
                <span>{stepIndex === SELF_TEST_QUESTIONS.length - 1 ? 'Weiter' : 'Weiter'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            result && (
              <>
                <button
                  type="button"
                  onClick={handleRetry}
                  data-testid="selftest-retry-btn"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 text-slate-200 border border-slate-700/60 hover:bg-slate-700/85 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-400"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Test wiederholen</span>
                </button>

                <button
                  type="button"
                  onClick={() => onViewIn3D(result.topMatch.milieu.id)}
                  data-testid="selftest-view-3d-btn"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-500/25 text-emerald-100 border border-emerald-400/60 hover:bg-emerald-500/35 transition-all cursor-pointer shadow-[0_0_22px_rgba(16,185,129,0.28)] focus-visible:outline-2 focus-visible:outline-sky-400"
                >
                  <Compass className="w-4 h-4" />
                  <span>Im 3D-Modell ansehen</span>
                </button>
              </>
            )
          )}
        </div>
      </div>
    </div>
  );
}
