import { ArrowLeft, CheckCircle2, Compass, RotateCcw } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { MilieuId } from '../data/milieus';
import { getMilieuIcon } from '../utils/milieuIcons';
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

  const TopMatchIcon = result
    ? getMilieuIcon(result.topMatch.milieu.id)
    : Compass;

  return (
    <section
      id="selbsttest"
      className="section-anchor border-t border-white/[0.07] py-20 sm:py-28"
    >
      <div className="mx-auto max-w-[960px] px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.12 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-2xl mx-auto"
        >
          <p className="text-xs sm:text-sm font-medium tracking-wide text-[#9ea4b0]">
            Interaktive Standortbestimmung · Euklidische 3D-Distanzberechnung
          </p>
          <h2 className="mt-2 font-display text-3xl sm:text-4xl lg:text-[42px] font-semibold tracking-tight text-[#f7f8f8] text-balance leading-[1.12]">
            Milieu-Selbsttest 2035: Wo stehst du in 10 Jahren?
          </h2>
          <p className="mt-3.5 text-base sm:text-[17px] leading-relaxed text-[#b4bac4]">
            Wähle bei jeder der 10 Aussagen deine Einschätzung – nach dem Klick geht es
            automatisch weiter, bis dein persönlicher Standort ins 3D-Modell projiziert wird.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.985 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          data-testid="self-test-card"
          className="linear-fade-window mt-10 overflow-hidden rounded-3xl"
        >
          {/* Top Progress Bar */}
          <div className="border-b border-white/[0.08] bg-white/[0.025] px-6 py-4 sm:px-8">
            <div className="flex items-center justify-between text-sm font-medium text-[#9ea4b0]">
              <span>
                {isResultStep
                  ? 'Auswertung abgeschlossen'
                  : `Frage ${step + 1} von ${totalQuestions}`}
              </span>
              <span className="font-mono-tabular font-semibold text-[#f7f8f8]">
                {progressPercent} %
              </span>
            </div>
            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
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
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="p-6 sm:p-9"
              >
                <p className="text-sm font-semibold text-emerald-400">
                  {currentQuestion.dimensionLabel}
                </p>

                <h3 className="mt-3 font-display text-xl sm:text-[23px] font-semibold leading-snug text-[#f7f8f8]">
                  „{currentQuestion.text}“
                </h3>

                <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-5">
                  {SELF_TEST_SCALE_OPTIONS.map((opt) => {
                    const selected = currentAnswer === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        data-testid={`quiz-option-${opt.value}`}
                        onClick={() => handleSelectOption(currentQuestion.id, opt.value)}
                        className={`flex sm:flex-col items-center sm:items-start justify-between gap-2.5 rounded-2xl border p-4 sm:p-5 text-left transition-all cursor-pointer ${
                          selected
                            ? 'border-white bg-[#f7f8f8] text-[#08090a] shadow-sm'
                            : 'border-white/[0.09] bg-white/[0.025] text-[#e2e8f0] hover:border-white/[0.22] hover:bg-white/[0.06]'
                        }`}
                      >
                        <span
                          className={`font-mono-tabular text-sm font-semibold ${
                            selected ? 'text-[#08090a]' : 'text-[#8a8f98]'
                          }`}
                        >
                          {opt.value}
                        </span>
                        <span className="text-sm font-medium leading-snug">
                          {opt.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-8 flex items-center justify-between border-t border-white/[0.08] pt-5">
                  <button
                    type="button"
                    onClick={handlePrev}
                    disabled={step === 0}
                    data-testid="quiz-prev-btn"
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.12] bg-white/[0.03] px-4 py-2 text-sm font-medium text-[#e2e8f0] hover:bg-white/[0.08] disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    <span>Zurück</span>
                  </button>

                  <span className="text-sm text-[#8a8f98]">
                    Auswahl führt automatisch weiter
                  </span>
                </div>
              </motion.div>
            ) : (
              result && (
                <motion.div
                  key="quiz-result"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="p-6 sm:p-9"
                  data-testid="quiz-result-view"
                >
                  {/* User 3D coordinates summary */}
                  <div className="grid grid-cols-3 gap-3 rounded-2xl border border-white/[0.09] bg-white/[0.025] p-5 text-center">
                    <div>
                      <div className="text-xs sm:text-[13px] font-medium text-[#9ea4b0]">
                        X · Werteorientierung
                      </div>
                      <div className="mt-1 font-mono-tabular text-xl sm:text-2xl font-semibold text-[#f7f8f8]">
                        {result.uXRounded} / 100
                      </div>
                    </div>
                    <div className="border-x border-white/[0.08]">
                      <div className="text-xs sm:text-[13px] font-medium text-[#9ea4b0]">
                        Y · Soziale Lage
                      </div>
                      <div className="mt-1 font-mono-tabular text-xl sm:text-2xl font-semibold text-[#f7f8f8]">
                        {result.uYRounded} / 100
                      </div>
                    </div>
                    <div>
                      <div className="text-xs sm:text-[13px] font-medium text-[#9ea4b0]">
                        Z · Resilienz 2035
                      </div>
                      <div className="mt-1 font-mono-tabular text-xl sm:text-2xl font-semibold text-emerald-400">
                        {result.uZRounded} / 100
                      </div>
                    </div>
                  </div>

                  {/* Top Match Callout */}
                  <div className="mt-6 rounded-2xl border border-white/[0.1] bg-white/[0.025] p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="linear-icon-box flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                          style={{
                            borderColor: `${result.topMatch.milieu.colorHex}50`,
                          }}
                        >
                          <TopMatchIcon
                            className="h-5 w-5"
                            style={{ color: result.topMatch.milieu.colorHex }}
                            aria-hidden="true"
                          />
                        </div>
                        <span className="text-sm font-medium text-[#9ea4b0]">
                          Höchste Übereinstimmung im 3D-Raum
                        </span>
                      </div>
                      <span
                        className="font-mono-tabular text-2xl font-semibold"
                        style={{ color: result.topMatch.milieu.colorHex }}
                      >
                        {result.topMatch.percent} %
                      </span>
                    </div>

                    <h3 className="mt-3 font-display text-2xl font-semibold text-[#f7f8f8]">
                      {result.topMatch.milieu.name}
                    </h3>
                    <p className="mt-2 text-[15px] sm:text-base leading-relaxed text-[#cbd5e1]">
                      {result.explanation}
                    </p>
                  </div>

                  {/* Sorted 6-Milieu Distance Distribution */}
                  <div className="mt-8">
                    <h4 className="text-sm font-semibold text-[#9ea4b0]">
                      Prozentuale Nähe zu allen 6 Milieus (Summe: 100 %)
                    </h4>
                    <div className="mt-4 space-y-4">
                      {result.ranked.map((entry, idx) => {
                        const EntryIcon = getMilieuIcon(entry.milieu.id);
                        return (
                          <div key={entry.milieu.id} className="space-y-2">
                            <div className="flex items-center justify-between text-sm sm:text-[15px]">
                              <span className="flex items-center gap-2 font-medium text-[#e2e8f0]">
                                <EntryIcon
                                  className="h-4 w-4 shrink-0"
                                  style={{ color: entry.milieu.colorHex }}
                                  aria-hidden="true"
                                />
                                <span>{entry.milieu.name}</span>
                              </span>
                              <span className="font-mono-tabular font-semibold text-[#f7f8f8]">
                                {entry.percent} %
                              </span>
                            </div>
                            <div className="h-3.5 w-full overflow-hidden rounded-full border border-white/[0.07] bg-white/[0.06]">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${entry.percent}%` }}
                                transition={{
                                  duration: 0.55,
                                  delay: idx * 0.05,
                                  ease: [0.16, 1, 0.3, 1],
                                }}
                                className="h-full rounded-full"
                                style={{
                                  backgroundColor: entry.milieu.colorHex,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] pt-6">
                    <button
                      type="button"
                      onClick={handleReset}
                      data-testid="quiz-retake-btn"
                      className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-[#e2e8f0] hover:bg-white/[0.09] cursor-pointer transition-colors"
                    >
                      <RotateCcw className="h-4 w-4" aria-hidden="true" />
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
                      className="inline-flex items-center gap-2 rounded-full bg-[#f7f8f8] px-6 py-2.5 text-sm font-semibold text-[#08090a] hover:bg-white cursor-pointer transition-colors shadow-sm"
                    >
                      <Compass className="h-4 w-4" aria-hidden="true" />
                      <span>Mein Ergebnis im 3D-Modell ansehen</span>
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
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
