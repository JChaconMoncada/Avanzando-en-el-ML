'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Code,
  Wrench,
  Check,
  AlertTriangle,
  X,
  Loader2,
  GraduationCap,
  Cog,
  ChevronDown,
  ChevronUp,
  StickyNote,
  Save,
  ExternalLink,
  Lightbulb,
  BookMarked,
  Calendar,
  RotateCcw,
} from 'lucide-react';
import type { StudyDay, EstadoBloque, UserStats } from '@/lib/types';
import { CURSOS_RESPALDO } from '@/lib/types';
import { addXP, deductXP, getUserStats, syncUserXP, updateStudyDay, recalcProgress } from '@/lib/supabase';
import { explicarTema, isGeminiConfigured } from '@/lib/gemini';
import { isEnglishClassDay } from '@/lib/curriculum';

// ============================================================
// Types
// ============================================================

interface BlockInfo {
  key: string;
  tituloField: keyof StudyDay;
  descField?: keyof StudyDay;
  estadoField: keyof StudyDay;
  label: string;
  categoria: string;
  icon: React.ReactNode;
  accentColor: string;
  bgColor: string;
  borderColor: string;
}

interface DayCardProps {
  day: StudyDay;
  onDayUpdate: (updatedDay: StudyDay) => void;
  onProgressUpdate?: (newProgress: number) => void;
  onStatsUpdate?: (newStats: UserStats) => void;
}

interface RescuePanelProps {
  isOpen: boolean;
  onClose: () => void;
  tema: string;
  categoria: string;
  descripcion?: string | null;
}

// ============================================================
// Block definitions
// ============================================================

function getBlockDefinitions(): BlockInfo[] {
  return [
    {
      key: 'ing_b1',
      tituloField: 'ing_b1_titulo',
      estadoField: 'ing_b1_estado',
      label: 'Inglés B1',
      categoria: 'Inglés B2',
      icon: <BookOpen className="h-4 w-4" />,
      accentColor: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
    },
    {
      key: 'ing_b2',
      tituloField: 'ing_b2_titulo',
      estadoField: 'ing_b2_estado',
      label: 'Inglés B2',
      categoria: 'Inglés B2',
      icon: <BookOpen className="h-4 w-4" />,
      accentColor: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
    },
    {
      key: 'ing_b3',
      tituloField: 'ing_b3_titulo',
      estadoField: 'ing_b3_estado',
      label: 'Inglés B3',
      categoria: 'Inglés B2',
      icon: <BookOpen className="h-4 w-4" />,
      accentColor: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
    },
    {
      key: 'ml_parte1',
      tituloField: 'ml_parte1_titulo',
      descField: 'ml_parte1_desc',
      estadoField: 'ml_parte1_estado',
      label: 'ML / Data Parte 1',
      categoria: 'Machine Learning',
      icon: <Code className="h-4 w-4" />,
      accentColor: 'text-violet-400',
      bgColor: 'bg-violet-500/10',
      borderColor: 'border-violet-500/30',
    },
    {
      key: 'ml_parte2',
      tituloField: 'ml_parte2_titulo',
      descField: 'ml_parte2_desc',
      estadoField: 'ml_parte2_estado',
      label: 'ML / Data Parte 2',
      categoria: 'Machine Learning',
      icon: <Code className="h-4 w-4" />,
      accentColor: 'text-violet-400',
      bgColor: 'bg-violet-500/10',
      borderColor: 'border-violet-500/30',
    },
    {
      key: 'slb',
      tituloField: 'slb_titulo',
      descField: 'slb_desc',
      estadoField: 'slb_estado',
      label: 'SLB Técnico',
      categoria: 'SLB Técnico',
      icon: <Wrench className="h-4 w-4" />,
      accentColor: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/30',
    },
  ];
}

// ============================================================
// Helper: get estado styling
// ============================================================

function getEstadoStyles(estado: EstadoBloque): {
  bg: string;
  border: string;
  badge: string;
  badgeText: string;
  icon: React.ReactNode;
} {
  switch (estado) {
    case 'entendido':
      return {
        bg: 'bg-emerald-500/5',
        border: 'border-emerald-500/30',
        badge: 'bg-emerald-500/20 ring-1 ring-emerald-500/30',
        badgeText: 'text-emerald-400',
        icon: <Check className="h-3.5 w-3.5 text-emerald-400" />,
      };
    case 'no_entendido':
      return {
        bg: 'bg-amber-500/5',
        border: 'border-amber-500/30',
        badge: 'bg-amber-500/20 ring-1 ring-amber-500/30',
        badgeText: 'text-amber-400',
        icon: <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />,
      };
    default:
      return {
        bg: 'bg-slate-900/40',
        border: 'border-slate-800',
        badge: 'bg-slate-800 ring-1 ring-slate-700',
        badgeText: 'text-slate-500',
        icon: null,
      };
  }
}

function getEstadoLabel(estado: EstadoBloque): string {
  switch (estado) {
    case 'entendido':
      return 'Entendido';
    case 'no_entendido':
      return 'No entendido';
    default:
      return 'Pendiente';
  }
}

// ============================================================
// Rescue Panel (Modal)
// ============================================================

function RescuePanel({ isOpen, onClose, tema, categoria, descripcion }: RescuePanelProps) {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const cursos = CURSOS_RESPALDO[categoria];

  useEffect(() => {
    if (isOpen && !explanation && !isLoading) {
      loadExplanation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  async function loadExplanation() {
    if (!isGeminiConfigured()) {
      setError('Configura tu API Key de Gemini para usar el Panel de Rescate.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await explicarTema(
        tema,
        categoria,
        descripcion ?? undefined
      );
      setExplanation(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al generar explicación';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          {/* Modal */}
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl border border-amber-500/30 bg-slate-950 shadow-2xl shadow-amber-500/10"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-950/95 px-6 py-4 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20 ring-1 ring-amber-500/30">
                  <Lightbulb className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Panel de Rescate</h3>
                  <p className="text-xs text-slate-400">
                    {categoria} — Explicación detallada
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto px-6 py-5" style={{ maxHeight: 'calc(85vh - 140px)' }}>
              {/* Topic Banner */}
              <div className="mb-5 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-1">
                  Tema que necesitas dominar
                </p>
                <p className="text-base font-semibold text-white">{tema}</p>
                {descripcion && (
                  <p className="mt-1 text-sm text-slate-400">{descripcion}</p>
                )}
              </div>

              {/* AI Explanation */}
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="h-4 w-4 text-amber-400" />
                  <h4 className="text-sm font-semibold text-amber-300">
                    Explicación de tu Mentor IA
                  </h4>
                </div>

                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
                    <p className="text-sm text-slate-400">
                      Tu mentor IA está preparando una explicación detallada...
                    </p>
                  </div>
                ) : error ? (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
                    <p className="text-sm text-red-400">{error}</p>
                    <button
                      onClick={loadExplanation}
                      className="mt-3 rounded-lg bg-red-500/20 px-4 py-2 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/30"
                    >
                      Reintentar
                    </button>
                  </div>
                ) : explanation ? (
                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                    <div className="prose prose-sm prose-invert max-w-none">
                      <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
                        {explanation}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Backup Courses */}
              {cursos && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <BookMarked className="h-4 w-4 text-cyan-400" />
                    <h4 className="text-sm font-semibold text-cyan-300">
                      Cursos de Respaldo
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {cursos.opciones.map((curso, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-900/40 p-3 transition-colors hover:border-cyan-500/30 hover:bg-cyan-500/5"
                      >
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-cyan-500/20 text-xs font-bold text-cyan-400">
                          {idx + 1}
                        </span>
                        <p className="text-sm text-slate-300 leading-relaxed">
                          {curso}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 border-t border-slate-800 bg-slate-950/95 px-6 py-3 backdrop-blur-sm">
              <button
                onClick={onClose}
                className="w-full rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 transition-all hover:shadow-amber-500/30 hover:brightness-110"
              >
                Entendido — Cerrar Panel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================
// Single Block Row
// ============================================================

interface BlockRowProps {
  block: BlockInfo;
  day: StudyDay;
  isProcessing: boolean;
  onEntendi: () => void;
  onNoEntendi: () => void;
  onResetBlock: () => void;
}

function BlockRow({ block, day, isProcessing, onEntendi, onNoEntendi, onResetBlock }: BlockRowProps) {
  const titulo = day[block.tituloField] as string | null;
  const desc = block.descField ? (day[block.descField] as string | null) : null;
  const estado = day[block.estadoField] as EstadoBloque;
  const styles = getEstadoStyles(estado);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border p-4 transition-all duration-300 ${styles.border} ${styles.bg}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        {/* Left: Block info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <div className={`flex h-7 w-7 items-center justify-center rounded-md ${block.bgColor}`}>
              <span className={block.accentColor}>{block.icon}</span>
            </div>
            <span className={`text-xs font-semibold uppercase tracking-wider ${block.accentColor}`}>
              {block.label}
            </span>

            {/* Estado badge */}
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${styles.badge} ${styles.badgeText}`}>
              {styles.icon}
              {getEstadoLabel(estado)}
            </span>
          </div>

          <p className="text-sm font-medium text-white leading-snug">
            {titulo || 'Sin contenido asignado'}
          </p>
          {desc && (
            <p className="mt-1 text-xs text-slate-400 leading-relaxed line-clamp-2">
              {desc}
            </p>
          )}
        </div>

        {/* Right: Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {estado === 'pendiente' ? (
            <>
              <button
                onClick={onEntendi}
                disabled={isProcessing}
                className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-400 transition-all hover:bg-emerald-500/20 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                Entendí
              </button>
              <button
                onClick={onNoEntendi}
                disabled={isProcessing}
                className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-400 transition-all hover:bg-amber-500/20 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                No entendí
              </button>
            </>
          ) : estado === 'entendido' ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-2 ring-1 ring-emerald-500/20">
                <Check className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-400">Dominado</span>
              </div>
              <button
                onClick={onResetBlock}
                disabled={isProcessing}
                title="Reiniciar este bloque a estado pendiente y descontar la EXP ganada"
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-amber-400 px-2.5 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/30 transition-colors cursor-pointer disabled:opacity-40"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reiniciar</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={onNoEntendi}
                className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-400 transition-all hover:bg-amber-500/20"
              >
                <Lightbulb className="h-3.5 w-3.5" />
                Explicación
              </button>
              <button
                onClick={onEntendi}
                disabled={isProcessing}
                className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-400 transition-all hover:bg-emerald-500/20 hover:border-emerald-500/50"
              >
                {isProcessing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                Entendí
              </button>
              <button
                onClick={onResetBlock}
                disabled={isProcessing}
                title="Reiniciar este bloque a estado pendiente"
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-amber-400 px-2.5 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/30 transition-colors cursor-pointer disabled:opacity-40"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reiniciar</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// Main DayCard Component
// ============================================================

export default function DayCard({ day, onDayUpdate, onProgressUpdate, onStatsUpdate }: DayCardProps) {
  const [processingBlock, setProcessingBlock] = useState<string | null>(null);
  const [rescuePanel, setRescuePanel] = useState<{
    isOpen: boolean;
    tema: string;
    categoria: string;
    descripcion?: string | null;
  }>({
    isOpen: false,
    tema: '',
    categoria: '',
    descripcion: null,
  });

  const [notesExpanded, setNotesExpanded] = useState(false);
  const [notes, setNotes] = useState(day.notas_dia ?? '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  const blocks = getBlockDefinitions();
  const classInfo = isEnglishClassDay(day.fecha);

  // Count completed blocks
  const allEstados: EstadoBloque[] = [
    day.ing_b1_estado,
    day.ing_b2_estado,
    day.ing_b3_estado,
    day.ml_parte1_estado,
    day.ml_parte2_estado,
    day.slb_estado,
  ];
  const completedCount = allEstados.filter((e) => e === 'entendido').length;
  const notUnderstoodCount = allEstados.filter((e) => e === 'no_entendido').length;
  const pendingCount = allEstados.filter((e) => e === 'pendiente').length;
  const isComplete = completedCount === 6;

  // Handle "Entendí" click (directo, instantáneo sin esperas)
  const handleEntendi = useCallback(
    async (block: BlockInfo) => {
      setProcessingBlock(block.key);
      try {
        // 1. Add XP (+20)
        const updatedStats = await addXP(20);

        // 2. Update the block estado
        const updates: Partial<StudyDay> = {
          [block.estadoField]: 'entendido' as EstadoBloque,
        };

        const newEstados = [...allEstados];
        const blockIdx = blocks.findIndex((b) => b.key === block.key);
        if (blockIdx >= 0) newEstados[blockIdx] = 'entendido';
        const willBeComplete = newEstados.every((e) => e === 'entendido');

        if (willBeComplete) {
          updates.completado_dia = true;
        }

        await updateStudyDay(day.dia_numero, updates);
        const newProgress = await recalcProgress();

        const updatedDay: StudyDay = {
          ...day,
          ...updates,
        };
        onDayUpdate(updatedDay);

        if (onProgressUpdate) {
          onProgressUpdate(newProgress);
        }
        if (onStatsUpdate && updatedStats) {
          onStatsUpdate(updatedStats);
        }
      } catch (err) {
        console.error('Error procesando Entendí:', err);
      } finally {
        setProcessingBlock(null);
      }
    },
    [day, blocks, allEstados, onDayUpdate, onProgressUpdate, onStatsUpdate]
  );

  // Handle "No Entendí" click
  const handleNoEntendi = useCallback(
    async (block: BlockInfo) => {
      const titulo = day[block.tituloField] as string | null;
      const desc = block.descField ? (day[block.descField] as string | null) : null;

      // Update estado if currently pending
      const currentEstado = day[block.estadoField] as EstadoBloque;
      if (currentEstado === 'pendiente') {
        const updates: Partial<StudyDay> = {
          [block.estadoField]: 'no_entendido' as EstadoBloque,
        };
        await updateStudyDay(day.dia_numero, updates);

        const updatedDay: StudyDay = { ...day, ...updates };
        onDayUpdate(updatedDay);
      }

      // Open rescue panel
      setRescuePanel({
        isOpen: true,
        tema: titulo || block.label,
        categoria: block.categoria,
        descripcion: desc,
      });
    },
    [day, onDayUpdate]
  );

  // Reiniciar un bloque específico a 'pendiente' y descontar los 20 XP si estaba entendido
  const handleResetBlock = useCallback(
    async (block: BlockInfo) => {
      setProcessingBlock(block.key);
      try {
        const currentEstado = day[block.estadoField] as EstadoBloque;
        const updates: Partial<StudyDay> = {
          [block.estadoField]: 'pendiente' as EstadoBloque,
        };

        if (day.completado_dia) {
          updates.completado_dia = false;
        }

        await updateStudyDay(day.dia_numero, updates);
        const newProgress = await recalcProgress();

        let updatedStats: UserStats | null = null;
        if (currentEstado === 'entendido') {
          updatedStats = await deductXP(20);
        } else {
          updatedStats = await getUserStats();
        }

        const updatedDay: StudyDay = {
          ...day,
          ...updates,
        };
        onDayUpdate(updatedDay);

        if (onProgressUpdate) {
          onProgressUpdate(newProgress);
        }
        if (onStatsUpdate && updatedStats) {
          onStatsUpdate(updatedStats);
        }
      } catch (err) {
        console.error('Error al reiniciar bloque individual:', err);
      } finally {
        setProcessingBlock(null);
      }
    },
    [day, onDayUpdate, onProgressUpdate, onStatsUpdate]
  );

  // Save notes
  const handleSaveNotes = useCallback(async () => {
    setIsSavingNotes(true);
    try {
      await updateStudyDay(day.dia_numero, { notas_dia: notes || null });
      onDayUpdate({ ...day, notas_dia: notes || null });
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    } catch (err) {
      console.error('Error saving notes:', err);
    } finally {
      setIsSavingNotes(false);
    }
  }, [day, notes, onDayUpdate]);

  // Reiniciar todos los bloques del día a 'pendiente' y descontar los XP correspondientes
  const handleResetDia = useCallback(async () => {
    const blocksInThisDay = [
      day.ing_b1_estado,
      day.ing_b2_estado,
      day.ing_b3_estado,
      day.ml_parte1_estado,
      day.ml_parte2_estado,
      day.slb_estado,
    ];
    const understoodCount = blocksInThisDay.filter((s) => s === 'entendido').length;

    const updates: Partial<StudyDay> = {
      ing_b1_estado: 'pendiente',
      ing_b2_estado: 'pendiente',
      ing_b3_estado: 'pendiente',
      ml_parte1_estado: 'pendiente',
      ml_parte2_estado: 'pendiente',
      slb_estado: 'pendiente',
      completado_dia: false,
    };
    await updateStudyDay(day.dia_numero, updates);
    const newProgress = await recalcProgress();

    let updatedStats: UserStats | null = null;
    if (understoodCount > 0) {
      updatedStats = await deductXP(understoodCount * 20);
    } else {
      updatedStats = await syncUserXP();
    }

    const updatedDay: StudyDay = { ...day, ...updates };
    onDayUpdate(updatedDay);

    if (onProgressUpdate) {
      onProgressUpdate(newProgress);
    }
    if (onStatsUpdate && updatedStats) {
      onStatsUpdate(updatedStats);
    }
  }, [day, onDayUpdate, onProgressUpdate, onStatsUpdate]);

  // Format date for display
  const formattedDate = (() => {
    try {
      const date = new Date(day.fecha + 'T12:00:00');
      return date.toLocaleDateString('es-CO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return day.fecha;
    }
  })();

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`relative overflow-hidden rounded-2xl border shadow-xl transition-all ${
          isComplete
            ? 'border-emerald-500/30 bg-slate-900/90 shadow-emerald-500/5'
            : 'border-slate-800 bg-slate-900/90 shadow-cyan-500/5'
        }`}
      >
        {/* Completion glow effect */}
        {isComplete && (
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-emerald-500/5 pointer-events-none" />
        )}

        {/* Card Header */}
        <div className="border-b border-slate-800 bg-slate-950/50 px-6 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl font-black text-lg ${
                  isComplete
                    ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30'
                    : 'bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500/30'
                }`}
              >
                {day.dia_numero}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Día {day.dia_numero}
                  {isComplete && (
                    <span className="ml-2 text-sm text-emerald-400">✓ Completado</span>
                  )}
                </h3>
                <p className="text-xs text-slate-400 capitalize">{formattedDate}</p>
              </div>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-3">
              {(completedCount > 0 || notUnderstoodCount > 0) && (
                <button
                  onClick={handleResetDia}
                  title="Reiniciar todos los bloques de este día a pendiente para probar el quiz"
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/30 text-xs text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reiniciar Día</span>
                </button>
              )}

              {/* Block counters */}
              <div className="flex items-center gap-1.5">
                {completedCount > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/30">
                    <Check className="h-3 w-3" />
                    {completedCount}
                  </span>
                )}
                {notUnderstoodCount > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-400 ring-1 ring-amber-500/30">
                    <AlertTriangle className="h-3 w-3" />
                    {notUnderstoodCount}
                  </span>
                )}
                {pendingCount > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-500 ring-1 ring-slate-700">
                    {pendingCount}
                  </span>
                )}
              </div>

              {/* Mini progress */}
              <div className="flex items-center gap-1">
                {allEstados.map((estado, i) => (
                  <div
                    key={i}
                    className={`h-2 w-2 rounded-full transition-colors ${
                      estado === 'entendido'
                        ? 'bg-emerald-400'
                        : estado === 'no_entendido'
                        ? 'bg-amber-400'
                        : 'bg-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Phase banner */}
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-slate-900/60 px-3 py-1.5 ring-1 ring-slate-800">
            <Cog className="h-3.5 w-3.5 text-slate-500" />
            <span className="text-xs text-slate-400 truncate">
              {day.punto_fijo_fase}
            </span>
          </div>

          {/* English class day banner */}
          {classInfo.isClass && classInfo.horario && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2"
            >
              <Calendar className="h-4 w-4 text-blue-400" />
              <div>
                <p className="text-xs font-semibold text-blue-300">
                  🏫 Día de Clase Presencial de Inglés
                </p>
                <p className="text-xs text-blue-400/80">{classInfo.horario}</p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Blocks List */}
        <div className="space-y-3 p-5">
          {/* English Blocks Section */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="h-4 w-4 text-blue-400" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                Inglés B2 — 3 Bloques
              </h4>
            </div>
            <div className="space-y-2">
              {blocks.slice(0, 3).map((block) => (
                <BlockRow
                  key={block.key}
                  block={block}
                  day={day}
                  isProcessing={processingBlock === block.key}
                  onEntendi={() => handleEntendi(block)}
                  onNoEntendi={() => handleNoEntendi(block)}
                  onResetBlock={() => handleResetBlock(block)}
                />
              ))}
            </div>
          </div>

          {/* ML/Data Blocks Section */}
          <div>
            <div className="flex items-center gap-2 mb-2 mt-4">
              <Code className="h-4 w-4 text-violet-400" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-violet-400">
                ML / Data Science — 2 Bloques
              </h4>
            </div>
            <div className="space-y-2">
              {blocks.slice(3, 5).map((block) => (
                <BlockRow
                  key={block.key}
                  block={block}
                  day={day}
                  isProcessing={processingBlock === block.key}
                  onEntendi={() => handleEntendi(block)}
                  onNoEntendi={() => handleNoEntendi(block)}
                  onResetBlock={() => handleResetBlock(block)}
                />
              ))}
            </div>
          </div>

          {/* SLB Block Section */}
          <div>
            <div className="flex items-center gap-2 mb-2 mt-4">
              <Wrench className="h-4 w-4 text-cyan-400" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                SLB Técnico — 1 Bloque
              </h4>
            </div>
            <div className="space-y-2">
              {blocks.slice(5, 6).map((block) => (
                <BlockRow
                  key={block.key}
                  block={block}
                  day={day}
                  isProcessing={processingBlock === block.key}
                  onEntendi={() => handleEntendi(block)}
                  onNoEntendi={() => handleNoEntendi(block)}
                  onResetBlock={() => handleResetBlock(block)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Notes Section */}
        <div className="border-t border-slate-800 px-5 py-4">
          <button
            onClick={() => setNotesExpanded(!notesExpanded)}
            className="flex w-full items-center justify-between rounded-lg px-2 py-1 text-left transition-colors hover:bg-slate-800/50"
          >
            <div className="flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-400">
                Notas del día
              </span>
              {notes && !notesExpanded && (
                <span className="text-xs text-slate-600 truncate max-w-[200px]">
                  — {notes.substring(0, 50)}...
                </span>
              )}
            </div>
            {notesExpanded ? (
              <ChevronUp className="h-4 w-4 text-slate-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-500" />
            )}
          </button>

          <AnimatePresence>
            {notesExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-3 space-y-2">
                  <textarea
                    value={notes}
                    onChange={(e) => {
                      setNotes(e.target.value);
                      setNotesSaved(false);
                    }}
                    placeholder="Escribe aquí tus notas, reflexiones, dudas o ideas del día..."
                    rows={4}
                    className="w-full resize-y rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-300 placeholder-slate-600 transition-colors focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">
                      {notes.length} caracteres
                    </span>
                    <button
                      onClick={handleSaveNotes}
                      disabled={isSavingNotes}
                      className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                        notesSaved
                          ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30'
                          : 'bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/30 hover:bg-cyan-500/20'
                      } disabled:opacity-40`}
                    >
                      {isSavingNotes ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : notesSaved ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Save className="h-3.5 w-3.5" />
                      )}
                      {notesSaved ? 'Guardado' : 'Guardar notas'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Rescue Panel Modal */}
      <RescuePanel
        isOpen={rescuePanel.isOpen}
        onClose={() =>
          setRescuePanel({ isOpen: false, tema: '', categoria: '', descripcion: null })
        }
        tema={rescuePanel.tema}
        categoria={rescuePanel.categoria}
        descripcion={rescuePanel.descripcion}
      />
    </>
  );
}
