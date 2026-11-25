import { ArrowLeft, CheckCircle2, Compass, RotateCcw } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { MilieuId } from '../data/milieus';
import {
  calculateSelfTestResult,
  SELF_TEST_QUESTIONS,
  SELF_TEST_SCALE_OPTIONS,
} from '../utils/selfTest';

interface SelfTestSectionProps {
  onViewResultIn3D: (
    milieuId: MilieuId,
    coords: { uX: number; uY: number; uZ: number },
  ) => void;
}

export function SelfTestSection({ onViewResultIn3D }: SelfTestSectionProps) {
  const [step, setStep] = useState<number>(0); // 0..9 = questions, 10 = result
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const advanceTimerRef = useRef<number | null>(null);

  const totalQuestions = SELF_TEST_QUESTIONS.length;
  const isResultStep = step >= totalQuestions;
  const currentQuestion = !isResultStep ? SELF_TEST_QUESTIONS[step] : null;
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current !== null) {
        window.clearTimeout(advanceTimerRef.current);
      }
    };
  }, []);

  const result = useMemo(() => {
    if (!isResultStep) return null;
    return calculateSelfTestResult(answers);
  }, [isResultStep, answers]);

  const progressPercent = isResultStep
    ? 100
    : Math.round(((step + 1) / totalQuestions) * 100);

  const handleSelectOption = (questionId: number, value: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    if (advanceTimerRef.current !== null) {
      window.clearTimeout(advanceTimerRef.current);
    }
    advanceTimerRef.current = window.setTimeout(() => {
      setStep((prev) => Math.min(totalQuestions, prev + 1));
      advanceTimerRef.current = null;
    }, 180);
  };

  const handlePrev = () => {
    if (advanceTimerRef.current !== null) {
      window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
    setStep((prev) => Math.max(0, prev - 1));
  };

  const handleReset = () => {
    if (advanceTimerRef.current !== null) {
      window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
    setAnswers({});
    setStep(0);
  };

  return (
    <section
      id="selbsttest"
      className="section-anchor border-t border-white/[0.06] py-20 sm:py-28"
    >
      <div className="mx-auto max-w-[920px] px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.12 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-2xl mx-auto"
        >
          <p className="text-xs font-medium tracking-wide text-[#8a8f98]">
            Interaktive Standortbestimmung · Euklidische 3D-Distanzberechnung
          </p>
          <h2 className="mt-2 font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[#f7f8f8] text-balance">
            Milieu-Selbsttest 2035: Wo stehst du in 10 Jahren?
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#9ea4b0]">
            Wähle bei jeder der 10 Aussagen deine Einschätzung – nach dem Klick geht es
            automatisch weiter, bis dein persönlicher Standort ins 3D-Modell projiziert wird.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          data-testid="self-test-card"
          className="linear-surface mt-10 overflow-hidden rounded-3xl"
        >
          {/* Top Progress Bar */}
          <div className="border-b border-white/[0.08] bg-white/[0.02] px-6 py-4 sm:px-8">
            <div className="flex items-center justify-between text-xs font-medium text-[#8a8f98]">
              <span>
                {isResultStep
                  ? 'Auswertung abgeschlossen'
                  : `Frage ${step + 1} von ${totalQuestions}`}
              </span>
              <span className="font-mono-tabular text-[#f7f8f8]">
                {progressPercent} %
              </span>
            </div>
            <div className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
              <div
                className="h-full rounded-full bg-[#f7f8f8] transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {!isResultStep && currentQuestion ? (
              <motion.div
                key={`q-${currentQuestion.id}`}
                initial={{ opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -14 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="p-6 sm:p-8"
              >
                <p className="text-xs font-medium text-emerald-400">
                  {currentQuestion.dimensionLabel}
                </p>

                <h3 className="mt-2.5 font-display text-lg sm:text-xl font-semibold leading-snug text-[#f7f8f8]">
                  „{currentQuestion.text}“
                </h3>

                <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-5">
                  {SELF_TEST_SCALE_OPTIONS.map((opt) => {
                    const selected = currentAnswer === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        data-testid={`quiz-option-${opt.value}`}
                        onClick={() => handleSelectOption(currentQuestion.id, opt.value)}
                        className={`flex sm:flex-col items-center sm:items-start justify-between gap-2 rounded-2xl border p-4 text-left transition-all cursor-pointer ${
                          selected
                            ? 'border-white bg-[#f7f8f8] text-[#08090a] shadow-sm'
                            : 'border-white/[0.08] bg-white/[0.02] text-[#cbd5e1] hover:border-white/[0.2] hover:bg-white/[0.05]'
                        }`}
                      >
                        <span
                          className={`font-mono-tabular text-xs font-semibold ${
                            selected ? 'text-[#08090a]' : 'text-[#62666d]'
                          }`}
                        >
                          {opt.value}
                        </span>
                        <span className="text-xs font-medium leading-snug">
                          {opt.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-8 flex items-center justify-between border-t border-white/[0.07] pt-5">
                  <button
                    type="button"
                    onClick={handlePrev}
                    disabled={step === 0}
                    data-testid="quiz-prev-btn"
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.03] px-4 py-2 text-xs font-medium text-[#cbd5e1] hover:bg-white/[0.07] disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Zurück</span>
                  </button>

                  <span className="text-xs text-[#62666d]">
                    Auswahl führt automatisch weiter
                  </span>
                </div>
              </motion.div>
            ) : (
              result && (
                <motion.div
                  key="quiz-result"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                  className="p-6 sm:p-8"
                  data-testid="quiz-result-view"
                >
                  {/* User 3D coordinates summary */}
                  <div className="grid grid-cols-3 gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 text-center">
                    <div>
                      <div className="text-[11px] font-medium text-[#8a8f98]">
                        X · Werteorientierung
                      </div>
                      <div className="mt-1 font-mono-tabular text-lg font-semibold text-[#f7f8f8]">
                        {result.uXRounded} / 100
                      </div>
                    </div>
                    <div className="border-x border-white/[0.08]">
                      <div className="text-[11px] font-medium text-[#8a8f98]">
                        Y · Soziale Lage
                      </div>
                      <div className="mt-1 font-mono-tabular text-lg font-semibold text-[#f7f8f8]">
                        {result.uYRounded} / 100
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] font-medium text-[#8a8f98]">
                        Z · Resilienz 2035
                      </div>
                      <div className="mt-1 font-mono-tabular text-lg font-semibold text-emerald-400">
                        {result.uZRounded} / 100
                      </div>
                    </div>
                  </div>

                  {/* Top Match Callout */}
                  <div className="mt-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-[3px] shrink-0"
                          style={{ backgroundColor: result.topMatch.milieu.colorHex }}
                          aria-hidden="true"
                        />
                        <span className="text-xs font-medium text-[#8a8f98]">
                          Höchste Übereinstimmung im 3D-Raum
                        </span>
                      </div>
                      <span
                        className="font-mono-tabular text-lg font-semibold"
                        style={{ color: result.topMatch.milieu.colorHex }}
                      >
                        {result.topMatch.percent} %
                      </span>
                    </div>

                    <h3 className="mt-2 font-display text-xl font-semibold text-[#f7f8f8]">
                      {result.topMatch.milieu.name}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#9ea4b0]">
                      {result.explanation}
                    </p>
                  </div>

                  {/* Sorted 6-Milieu Distance Distribution */}
                  <div className="mt-7">
                    <h4 className="text-xs font-medium text-[#8a8f98]">
                      Prozentuale Nähe zu allen 6 Milieus (Summe: 100 %)
                    </h4>
                    <div className="mt-4 space-y-4">
                      {result.ranked.map((entry) => (
                        <div key={entry.milieu.id} className="space-y-2">
                          <div className="flex items-center justify-between text-[13px]">
                            <span className="font-medium text-[#e2e8f0]">
                              {entry.milieu.name}
                            </span>
                            <span className="font-mono-tabular font-semibold text-[#f7f8f8]">
                              {entry.percent} %
                            </span>
                          </div>
                          <div className="h-3.5 w-full overflow-hidden rounded-full border border-white/[0.06] bg-white/[0.07]">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${entry.percent}%`,
                                backgroundColor: entry.milieu.colorHex,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] pt-5">
                    <button
                      type="button"
                      onClick={handleReset}
                      data-testid="quiz-retake-btn"
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.03] px-4 py-2 text-xs font-medium text-[#cbd5e1] hover:bg-white/[0.07] cursor-pointer transition-colors"
                    >
                      <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Test wiederholen</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onViewResultIn3D(result.topMatch.milieu.id, {
                          uX: result.uX,
                          uY: result.uY,
                          uZ: result.uZ,
                        })
                      }
                      data-testid="quiz-view-3d-btn"
                      className="inline-flex items-center gap-2 rounded-full bg-[#f7f8f8] px-5 py-2.5 text-xs font-semibold text-[#08090a] hover:bg-white cursor-pointer transition-colors"
                    >
                      <Compass className="h-4 w-4" aria-hidden="true" />
                      <span>Mein Ergebnis im 3D-Modell ansehen</span>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                    </button>
                  </div>
                </motion.div>
              )
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
