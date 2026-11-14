'use client';

import { useState, useEffect, useCallback, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Swords,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  X,
  Loader2,
  Send,
  BookOpen,
  Tag,
  FileWarning,
  Sparkles,
} from 'lucide-react';
import { getDeudas, resolveDeuda, addXP } from '@/lib/supabase';
import { generarEjercicio, evaluarEntrega } from '@/lib/gemini';
import type { DeudaTecnica } from '@/lib/types';

interface RevanchaModalState {
  open: boolean;
  deuda: DeudaTecnica | null;
  exercise: string | null;
  loadingExercise: boolean;
  userSolution: string;
  submitting: boolean;
  result: { score: number; feedback: string } | null;
  resolved: boolean;
}

const initialModalState: RevanchaModalState = {
  open: false,
  deuda: null,
  exercise: null,
  loadingExercise: false,
  userSolution: '',
  submitting: false,
  result: null,
  resolved: false,
};

export default function DebtWall() {
  const [deudas, setDeudas] = useState<DeudaTecnica[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showResolved, setShowResolved] = useState(false);
  const [modal, setModal] = useState<RevanchaModalState>(initialModalState);

  const fetchDeudas = useCallback(async () => {
    try {
      const data = await getDeudas();
      setDeudas(data);
    } catch (err) {
      console.error('Error fetching deudas:', err);
      setError('Error al cargar las deudas técnicas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeudas();
  }, [fetchDeudas]);

  const unresolvedDeudas = deudas.filter((d) => !d.resuelto);
  const resolvedDeudas = deudas.filter((d) => d.resuelto);

  const openRevancha = async (deuda: DeudaTecnica) => {
    setModal({
      ...initialModalState,
      open: true,
      deuda,
      loadingExercise: true,
    });

    try {
      const exercise = await generarEjercicio(
        deuda.categoria as any,
        'Intermedio',
        `Tema específico a reforzar: ${deuda.tema}. Motivo de fallo previo: ${deuda.motivo_fallo || 'Dificultad en parcial previo'}`
      );
      setModal((prev) => ({
        ...prev,
        exercise,
        loadingExercise: false,
      }));
    } catch (err) {
      console.error('Error generating exercise:', err);
      setModal((prev) => ({
        ...prev,
        exercise: 'Error al generar el ejercicio. Intenta de nuevo.',
        loadingExercise: false,
      }));
    }
  };

  const closeModal = () => {
    setModal(initialModalState);
  };

  const submitRevancha = async () => {
    if (!modal.deuda || !modal.exercise || !modal.userSolution.trim()) return;

    setModal((prev) => ({ ...prev, submitting: true }));

    try {
      const evaluation = await evaluarEntrega(
        (modal.deuda.categoria as any) || 'Python/Pandas',
        modal.exercise,
        modal.userSolution,
        'ejercicio_diario'
      );

      const score = evaluation.puntaje;
      const feedback = evaluation.solucion_optima_explicada;

      if (score >= 85) {
        await resolveDeuda(modal.deuda.id, score);
        await addXP(50);

        setDeudas((prev) =>
          prev.map((d) =>
            d.id === modal.deuda!.id ? { ...d, resuelto: true, nota_recuperacion: score } : d
          )
        );

        setModal((prev) => ({
          ...prev,
          submitting: false,
          result: { score, feedback },
          resolved: true,
        }));
      } else {
        setModal((prev) => ({
          ...prev,
          submitting: false,
          result: { score, feedback },
          resolved: false,
        }));
      }
    } catch (err) {
      console.error('Error submitting revancha:', err);
      setModal((prev) => ({
        ...prev,
        submitting: false,
        result: {
          score: 0,
          feedback: 'Error al evaluar la entrega. Intenta de nuevo.',
        },
        resolved: false,
      }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/90 p-12">
        <Loader2 className="h-8 w-8 animate-spin text-red-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-800 bg-red-950/30 p-6 text-center text-red-300">
        {error}
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="relative overflow-hidden rounded-2xl border border-red-900/50 bg-slate-900/90 p-6 shadow-lg shadow-red-500/5"
      >
        {/* Glow */}
        <div className="pointer-events-none absolute -top-16 -right-16 h-32 w-32 rounded-full bg-red-500/8 blur-3xl" />

        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Muro Rojo de Deuda Técnica</h3>
            <p className="text-xs text-slate-400">
              {unresolvedDeudas.length} pendiente{unresolvedDeudas.length !== 1 ? 's' : ''} ·{' '}
              {resolvedDeudas.length} resuelta{resolvedDeudas.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Unresolved Debts */}
        {unresolvedDeudas.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-emerald-800/50 bg-emerald-950/20 py-8 text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            <p className="text-sm font-medium text-emerald-300">¡Sin deudas técnicas pendientes!</p>
            <p className="text-xs text-slate-500">Sigue así, crack 🚀</p>
          </div>
        ) : (
          <div className="space-y-3">
            {unresolvedDeudas.map((deuda) => (
              <motion.div
                key={deuda.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="rounded-xl border border-red-800/60 bg-red-950/50 p-4"
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <Tag className="h-3.5 w-3.5 flex-shrink-0 text-red-400" />
                      <span className="text-xs font-medium uppercase tracking-wider text-red-400">
                        {deuda.categoria}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-white">{deuda.tema}</h4>
                  </div>
                  <button
                    onClick={() => openRevancha(deuda)}
                    className="flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-red-600/20 px-3 py-1.5 text-xs font-semibold text-red-300 transition-all hover:bg-red-600/30 hover:text-red-200"
                  >
                    <Swords className="h-3.5 w-3.5" />
                    Rendir Revancha
                  </button>
                </div>

                {deuda.motivo_fallo && (
                  <div className="mb-2 flex items-start gap-2">
                    <FileWarning className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-red-500/70" />
                    <p className="text-xs leading-relaxed text-red-300/70">{deuda.motivo_fallo}</p>
                  </div>
                )}

                {deuda.cursos_respaldo_sugeridos && (
                  <div className="flex items-start gap-2">
                    <BookOpen className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-500/70" />
                    <p className="text-xs leading-relaxed text-amber-400/80">{deuda.cursos_respaldo_sugeridos}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Resolved Debts Collapsible */}
        {resolvedDeudas.length > 0 && (
          <div className="mt-6">
            <button
              onClick={() => setShowResolved((prev) => !prev)}
              className="flex w-full items-center justify-between rounded-lg border border-slate-800 bg-slate-950/50 px-4 py-2.5 text-sm text-slate-400 transition-colors hover:border-slate-700 hover:text-slate-300"
            >
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Deudas Resueltas ({resolvedDeudas.length})
              </span>
              {showResolved ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            <AnimatePresence>
              {showResolved && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 space-y-2">
                    {resolvedDeudas.map((deuda) => (
                      <div
                        key={deuda.id}
                        className="flex items-center gap-3 rounded-lg border border-emerald-900/30 bg-emerald-950/20 px-4 py-3"
                      >
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-500" />
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-medium uppercase text-emerald-600">
                            {deuda.categoria}
                          </span>
                          <p className="text-sm text-slate-400 line-through decoration-emerald-600/50">
                            {deuda.tema}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Revancha Modal */}
      <AnimatePresence>
        {modal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) closeModal();
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
            >
              {/* Modal Header */}
              <div className="mb-5 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
                    <Swords className="h-5 w-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Revancha</h3>
                    {modal.deuda && (
                      <p className="text-sm text-slate-400">
                        {modal.deuda.categoria} · {modal.deuda.tema}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="rounded-lg p-1 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Exercise Loading */}
              {modal.loadingExercise && (
                <div className="flex flex-col items-center gap-3 py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
                  <p className="text-sm text-slate-400">Generando ejercicio con IA...</p>
                </div>
              )}

              {/* Exercise Content */}
              {!modal.loadingExercise && modal.exercise && (
                <>
                  <div className="mb-5 rounded-xl border border-slate-700 bg-slate-950/70 p-4">
                    <div className="mb-2 flex items-center gap-2 text-xs font-medium text-cyan-400">
                      <Sparkles className="h-3.5 w-3.5" />
                      Ejercicio Generado por IA
                    </div>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
                      {modal.exercise}
                    </div>
                  </div>

                  {/* Result Display */}
                  {modal.result && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`mb-5 rounded-xl border p-4 ${
                        modal.resolved
                          ? 'border-emerald-700 bg-emerald-950/40'
                          : 'border-amber-700 bg-amber-950/30'
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span
                          className={`text-sm font-semibold ${
                            modal.resolved ? 'text-emerald-300' : 'text-amber-300'
                          }`}
                        >
                          {modal.resolved ? '✅ ¡Deuda Resuelta!' : '❌ No aprobado (mínimo 85)'}
                        </span>
                        <span
                          className={`rounded-full px-3 py-0.5 text-lg font-bold ${
                            modal.resolved
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {modal.result.score}/100
                        </span>
                      </div>
                      {modal.resolved && (
                        <p className="mb-2 text-sm font-medium text-emerald-400">+50 XP ganados 🎉</p>
                      )}
                      <p className="text-sm leading-relaxed text-slate-300">{modal.result.feedback}</p>
                    </motion.div>
                  )}

                  {/* Solution Input */}
                  {!modal.resolved && (
                    <>
                      <div className="mb-4">
                        <label
                          htmlFor="revancha-solution"
                          className="mb-2 block text-sm font-medium text-slate-300"
                        >
                          Tu Solución
                        </label>
                        <textarea
                          id="revancha-solution"
                          rows={10}
                          value={modal.userSolution}
                          onChange={(e) =>
                            setModal((prev) => ({ ...prev, userSolution: e.target.value }))
                          }
                          placeholder="Escribe tu solución aquí... (código, explicación, SQL, etc.)"
                          className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950/70 p-4 font-mono text-sm text-slate-200 placeholder-slate-600 outline-none transition-colors focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600/30"
                          disabled={modal.submitting}
                        />
                      </div>

                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={closeModal}
                          className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-400 transition-colors hover:border-slate-600 hover:text-slate-300"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={submitRevancha}
                          disabled={modal.submitting || !modal.userSolution.trim()}
                          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all hover:from-cyan-500 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {modal.submitting ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Evaluando...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4" />
                              Enviar Solución
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  )}

                  {/* Close after resolved */}
                  {modal.resolved && (
                    <div className="flex justify-end">
                      <button
                        onClick={closeModal}
                        className="rounded-lg bg-emerald-600/20 px-5 py-2 text-sm font-semibold text-emerald-300 transition-colors hover:bg-emerald-600/30"
                      >
                        Cerrar
                      </button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
