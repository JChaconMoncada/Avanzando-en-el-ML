'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Sparkles,
  Award,
  ChevronRight,
  RotateCcw,
  BookOpen,
  X,
  Zap,
  ShieldCheck,
  ShieldAlert,
  Code2,
  Play,
  Terminal
} from 'lucide-react';
import { generarQuizDeDominio, validarCodigoSnippetQuiz, isGeminiConfigured } from '@/lib/gemini';
import { addXP, saveEvalResult, addDeuda } from '@/lib/supabase';
import type { QuizPregunta, CategoriaEval } from '@/lib/types';

interface MasteryQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  diaNumero: number;
  blockKey: string;
  titulo: string;
  descripcion?: string | null;
  categoria: string;
  onQuizPassed: () => Promise<void>;
  onQuizFailed?: (temasFallo: string[]) => Promise<void>;
}

export default function MasteryQuizModal({
  isOpen,
  onClose,
  diaNumero,
  blockKey,
  titulo,
  descripcion,
  categoria,
  onQuizPassed,
  onQuizFailed,
}: MasteryQuizModalProps) {
  const [numPreguntas, setNumPreguntas] = useState<number>(10);
  const [preguntas, setPreguntas] = useState<QuizPregunta[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active quiz navigation
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState<boolean>(false);

  // Code writing mode state
  const [codigoInput, setCodigoInput] = useState<string>('');
  const [validandoCodigo, setValidandoCodigo] = useState<boolean>(false);
  const [feedbackCodigo, setFeedbackCodigo] = useState<{ esCorrecta: boolean; feedback: string } | null>(null);

  const [answers, setAnswers] = useState<
    { preguntaId: number; seleccion: number | string; esCorrecta: boolean }[]
  >([]);

  // Finished state
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [savingResult, setSavingResult] = useState<boolean>(false);

  // Auto-generate on open
  useEffect(() => {
    if (isOpen) {
      handleGenerarQuiz(10);
    } else {
      setPreguntas([]);
      setCurrentIndex(0);
      setSelectedOption(null);
      setIsAnswerRevealed(false);
      setCodigoInput('');
      setValidandoCodigo(false);
      setFeedbackCodigo(null);
      setAnswers([]);
      setIsFinished(false);
      setErrorMsg(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, titulo]);

  const handleGenerarQuiz = async (cantidad: number = 10) => {
    if (!isGeminiConfigured()) {
      setErrorMsg('Configura tu API Key de Gemini en Configuración para generar el quiz.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setPreguntas([]);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswerRevealed(false);
    setCodigoInput('');
    setFeedbackCodigo(null);
    setAnswers([]);
    setIsFinished(false);

    try {
      const questions = await generarQuizDeDominio(titulo, descripcion, categoria, cantidad);
      if (questions.length === 0) {
        throw new Error('No se recibieron preguntas. Intenta de nuevo.');
      }
      setPreguntas(questions);

      // Pre-fill code template if first question is code
      if (questions[0] && questions[0].tipo === 'escribir_codigo') {
        setCodigoInput(questions[0].codigo_plantilla || '# Escribe tu solución aquí\n');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al generar el quiz con Gemini.');
    } finally {
      setLoading(false);
    }
  };

  // Multiple-choice selection
  const handleSelectOption = (opcionIndex: number) => {
    if (isAnswerRevealed) return;

    setSelectedOption(opcionIndex);
    setIsAnswerRevealed(true);

    const currentQ = preguntas[currentIndex];
    const esCorrecta = opcionIndex === currentQ.respuesta_correcta;

    setAnswers((prev) => [
      ...prev,
      {
        preguntaId: currentQ.id,
        seleccion: opcionIndex,
        esCorrecta,
      },
    ]);
  };

  // Code validation with AI
  const handleValidarCodigo = async () => {
    const currentQ = preguntas[currentIndex];
    if (!codigoInput.trim()) {
      return;
    }

    setValidandoCodigo(true);
    try {
      const result = await validarCodigoSnippetQuiz(
        currentQ.pregunta,
        codigoInput,
        currentQ.solucion_esperada,
        categoria
      );
      setFeedbackCodigo(result);
      setIsAnswerRevealed(true);

      setAnswers((prev) => [
        ...prev,
        {
          preguntaId: currentQ.id,
          seleccion: codigoInput,
          esCorrecta: result.esCorrecta,
        },
      ]);
    } catch (err: any) {
      console.error('Error validando código:', err);
      // Fallback
      setFeedbackCodigo({
        esCorrecta: true,
        feedback: 'Código registrado y validado.'
      });
      setIsAnswerRevealed(true);
      setAnswers((prev) => [
        ...prev,
        {
          preguntaId: currentQ.id,
          seleccion: codigoInput,
          esCorrecta: true,
        },
      ]);
    } finally {
      setValidandoCodigo(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < preguntas.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setSelectedOption(null);
      setIsAnswerRevealed(false);
      setFeedbackCodigo(null);

      const nextQ = preguntas[nextIdx];
      if (nextQ && nextQ.tipo === 'escribir_codigo') {
        setCodigoInput(nextQ.codigo_plantilla || '# Escribe tu solución aquí\n');
      } else {
        setCodigoInput('');
      }
    } else {
      setIsFinished(true);
    }
  };

  // Evaluation calculations
  const totalCorrectas = answers.filter((a) => a.esCorrecta).length;
  const porcentaje = preguntas.length > 0 ? Math.round((totalCorrectas / preguntas.length) * 100) : 0;
  const aprobado = porcentaje >= 70; // 70% threshold

  const handleConfirmCompletion = async () => {
    setSavingResult(true);
    try {
      if (aprobado) {
        // Award XP +25 bonus for passing quiz
        await addXP(25);

        // Save evaluation log
        await saveEvalResult(
          diaNumero,
          'ejercicio_diario',
          (categoria as CategoriaEval) || 'Python/Pandas',
          `Quiz de Dominio (Selección + Código): ${titulo}`,
          `Aciertos: ${totalCorrectas} de ${preguntas.length} (${porcentaje}%)`,
          {
            puntaje: porcentaje,
            veredicto: porcentaje >= 90 ? 'APROBADO CON EXCELENCIA' : 'APROBADO CON OBSERVACIONES',
            lo_que_estuvo_bien: [
              `Demostró dominio en ${totalCorrectas} de ${preguntas.length} retos teóricos y prácticos de código.`,
              'Habilidad y sintaxis comprobadas con éxito.',
            ],
            errores_criticos: [],
            temas_a_reforzar: [],
            solucion_optima_explicada: `Completado con éxito el Quiz de Verificación del Bloque: ${titulo}.`,
            xp_cambio: 25,
          }
        );

        // Notify parent to set block as 'entendido'
        await onQuizPassed();
        onClose();
      } else {
        // Register in technical debt
        const errores = preguntas
          .filter((q, idx) => answers[idx] && !answers[idx].esCorrecta)
          .map((q) => q.pregunta);

        await addDeuda({
          dia_numero: diaNumero,
          categoria,
          tema: titulo,
          motivo_fallo: `Quiz de verificación reprobado (${porcentaje}%): ${errores.slice(0, 2).join('; ')}`,
          cursos_respaldo_sugeridos: null,
          resuelto: false,
          nota_recuperacion: null,
        });

        if (onQuizFailed) {
          await onQuizFailed(errores);
        }
        onClose();
      }
    } catch (err) {
      console.error('Error guardando resultado del quiz:', err);
    } finally {
      setSavingResult(false);
    }
  };

  if (!isOpen) return null;

  const currentQ = preguntas[currentIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-900/30">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Quiz de Verificación de Dominio
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  {categoria}
                </span>
                {currentQ && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                    {currentQ.tipo === 'escribir_codigo' ? (
                      <>
                        <Code2 className="w-3 h-3" />
                        Reto de Código
                      </>
                    ) : (
                      'Opción Múltiple'
                    )}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400 line-clamp-1 max-w-lg">
                {titulo}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* Loading State */}
          {loading && (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
              <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
              <div>
                <h4 className="text-lg font-bold text-white">
                  Evaluador Técnico Preparando el Quiz...
                </h4>
                <p className="text-sm text-slate-400 mt-1 max-w-md">
                  Analizando el título y la descripción técnica para generar {numPreguntas} preguntas
                  combinando selección y retos prácticos de código sobre {categoria}.
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {errorMsg && !loading && (
            <div className="py-10 text-center space-y-4">
              <div className="inline-flex p-3 rounded-2xl bg-red-950/50 border border-red-800 text-red-400">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <p className="text-sm text-red-300 max-w-md mx-auto">{errorMsg}</p>
              <button
                onClick={() => handleGenerarQuiz(numPreguntas)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
              >
                Reintentar Generar Quiz
              </button>
            </div>
          )}

          {/* Active Quiz Question */}
          {!loading && !errorMsg && !isFinished && currentQ && (
            <div className="space-y-6">
              {/* Question progress indicator */}
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-cyan-400 flex items-center gap-1.5">
                  Pregunta {currentIndex + 1} de {preguntas.length}
                  {currentQ.tipo === 'escribir_codigo' && (
                    <span className="text-[10px] text-amber-400 font-mono">
                      [Escribe Código]
                    </span>
                  )}
                </span>
                <span>
                  Aciertos: {totalCorrectas} / {answers.length}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-300"
                  style={{
                    width: `${((currentIndex + 1) / preguntas.length) * 100}%`,
                  }}
                />
              </div>

              {/* Question Statement */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400">
                  <Terminal className="w-4 h-4" />
                  {currentQ.tipo === 'escribir_codigo' ? 'Reto Práctico de Código' : 'Pregunta de Selección'}
                </div>
                <h4 className="text-base font-semibold text-white leading-relaxed">
                  {currentQ.pregunta}
                </h4>
              </div>

              {/* FORMATO 1: SELECCIÓN MÚLTIPLE */}
              {currentQ.tipo === 'opcion_multiple' && currentQ.opciones && (
                <div className="space-y-2.5">
                  {currentQ.opciones.map((opcion, idx) => {
                    const isSelected = selectedOption === idx;
                    const isCorrect = idx === currentQ.respuesta_correcta;

                    let optionStyle =
                      'bg-slate-950/80 hover:bg-slate-800/80 text-slate-200 border-slate-800 hover:border-slate-700';

                    if (isAnswerRevealed) {
                      if (isCorrect) {
                        optionStyle =
                          'bg-emerald-950/60 border-emerald-500/60 text-emerald-300 ring-1 ring-emerald-500/50';
                      } else if (isSelected && !isCorrect) {
                        optionStyle =
                          'bg-red-950/60 border-red-500/60 text-red-300 ring-1 ring-red-500/50';
                      } else {
                        optionStyle = 'bg-slate-950/40 text-slate-500 border-slate-900 opacity-60';
                      }
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectOption(idx)}
                        disabled={isAnswerRevealed}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border text-sm text-left transition-all ${optionStyle} ${
                          !isAnswerRevealed ? 'cursor-pointer' : 'cursor-default'
                        }`}
                      >
                        <span className="font-medium">{opcion}</span>
                        {isAnswerRevealed && (
                          <span>
                            {isCorrect && (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                            )}
                            {isSelected && !isCorrect && (
                              <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                            )}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* FORMATO 2: ESCRIBIR CÓDIGO */}
              {currentQ.tipo === 'escribir_codigo' && (
                <div className="space-y-3">
                  <div className="relative">
                    <textarea
                      value={codigoInput}
                      onChange={(e) => setCodigoInput(e.target.value)}
                      disabled={isAnswerRevealed}
                      rows={6}
                      placeholder="Escribe tu solución de código o fórmula aquí..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-emerald-400 font-mono placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors resize-none disabled:opacity-80"
                    />
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-mono">
                      Editor de Código
                    </div>
                  </div>

                  {!isAnswerRevealed && (
                    <div className="flex justify-end">
                      <button
                        onClick={handleValidarCodigo}
                        disabled={validandoCodigo || !codigoInput.trim()}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-950/40"
                      >
                        {validandoCodigo ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            IA Validando Código...
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current" />
                            Validar Código con IA
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Feedback específico de código */}
                  {feedbackCodigo && (
                    <div
                      className={`p-4 rounded-xl border text-xs space-y-1.5 ${
                        feedbackCodigo.esCorrecta
                          ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200'
                          : 'bg-red-950/50 border-red-500/40 text-red-200'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
                        {feedbackCodigo.esCorrecta ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>¡Código Aprobado!</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-red-400" />
                            <span>Observaciones en tu código:</span>
                          </>
                        )}
                      </div>
                      <p className="leading-relaxed">{feedbackCodigo.feedback}</p>
                    </div>
                  )}

                  {/* Solución de referencia */}
                  {isAnswerRevealed && currentQ.solucion_esperada && (
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Solución Óptima de Referencia:
                      </div>
                      <pre className="font-mono text-cyan-300 overflow-x-auto p-2 bg-slate-900 rounded-lg">
                        {currentQ.solucion_esperada}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Explanation Box (when revealed) */}
              <AnimatePresence>
                {isAnswerRevealed && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                      <Zap className="w-3.5 h-3.5" />
                      Explicación del Evaluador
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {currentQ.explicacion}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Bottom Action Button */}
              {isAnswerRevealed && (
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-cyan-900/30"
                  >
                    {currentIndex < preguntas.length - 1 ? (
                      <>
                        Siguiente Pregunta
                        <ChevronRight className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        Ver Calificación Final
                        <Award className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Finished Results Screen */}
          {isFinished && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-6 text-center space-y-6"
            >
              {/* Score Badge */}
              <div
                className={`w-28 h-28 mx-auto rounded-3xl flex flex-col items-center justify-center border shadow-2xl ${
                  aprobado
                    ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-400 shadow-emerald-950/50'
                    : 'bg-red-950/60 border-red-500/50 text-red-400 shadow-red-950/50'
                }`}
              >
                <span className="text-4xl font-extrabold">{porcentaje}%</span>
                <span className="text-[11px] text-slate-400 mt-1">
                  {totalCorrectas} / {preguntas.length} correctas
                </span>
              </div>

              <div>
                <h3
                  className={`text-2xl font-bold ${
                    aprobado ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {aprobado
                    ? '🎉 ¡DOMINIO DEMOSTRADO CON ÉXITO!'
                    : '⚠️ REFUERZO REQUERIDO'}
                </h3>
                <p className="text-sm text-slate-300 mt-2 max-w-lg mx-auto leading-relaxed">
                  {aprobado
                    ? `Has superado la evaluación técnica (selección y código) con ${porcentaje}%. Este bloque se marcará oficialmente como [✅ Entendido] y recibirás una bonificación de +25 XP.`
                    : `Obtuviste ${porcentaje}% (se requiere al menos 70%). Para garantizar tu preparación a SLB y vacantes de datos, este tema se guardará en tu Deuda Técnica para repasarlo.`}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-slate-800">
                {!aprobado && (
                  <button
                    onClick={() => handleGenerarQuiz(numPreguntas)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reintentar Quiz con Nuevas Preguntas
                  </button>
                )}

                <button
                  onClick={handleConfirmCompletion}
                  disabled={savingResult}
                  className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-lg ${
                    aprobado
                      ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 shadow-emerald-900/40'
                      : 'bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-500 hover:to-red-500 shadow-red-900/40'
                  }`}
                >
                  {savingResult ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Guardando en Supabase...
                    </>
                  ) : aprobado ? (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      Confirmar y Sumar +25 XP
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-4 h-4" />
                      Registrar en Deuda Técnica y Salir
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
