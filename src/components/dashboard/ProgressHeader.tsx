'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Zap,
  Flame,
  Sparkles,
  GraduationCap,
  Bell,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import type { UserStats, StudyDay } from '@/lib/types';
import { RANGOS } from '@/lib/types';
import { getUserStats, updateUserStats, getStudyDays } from '@/lib/supabase';
import { generarMensajeMotivador, isGeminiConfigured } from '@/lib/gemini';
import { getEnglishClassAlerts } from '@/lib/curriculum';

interface ProgressHeaderProps {
  stats: UserStats | null;
  studyDays: StudyDay[];
  onStatsUpdate?: (stats: UserStats) => void;
}

function getRangoInfo(xp: number): { emoji: string; nombre: string; nextMin: number; currentMin: number } {
  for (let i = 0; i < RANGOS.length; i++) {
    const rango = RANGOS[i];
    if (xp >= rango.min && xp <= rango.max) {
      const nextMin = i < RANGOS.length - 1 ? RANGOS[i + 1].min : rango.max;
      return { emoji: rango.emoji, nombre: rango.nombre, nextMin, currentMin: rango.min };
    }
  }
  return { emoji: RANGOS[0].emoji, nombre: RANGOS[0].nombre, nextMin: RANGOS[1].min, currentMin: 0 };
}

function getRangoColor(xp: number): string {
  if (xp >= 5001) return 'text-amber-400';
  if (xp >= 3001) return 'text-cyan-400';
  if (xp >= 1501) return 'text-yellow-400';
  if (xp >= 501) return 'text-slate-300';
  return 'text-orange-400';
}

export default function ProgressHeader({ stats, studyDays, onStatsUpdate }: ProgressHeaderProps) {
  const [iaMessage, setIaMessage] = useState<string | null>(stats?.ultimo_mensaje_ia ?? null);
  const [isLoadingMessage, setIsLoadingMessage] = useState(false);
  const [englishAlerts, setEnglishAlerts] = useState<
    { dia: StudyDay; horario: string; hoursUntil: number }[]
  >([]);
  const [displayedProgress, setDisplayedProgress] = useState(0);
  const prevProgressRef = useRef<number>(0);
  const messageGeneratedForProgress = useRef<number | null>(null);

  const progreso = stats?.progreso_porcentaje ?? 0;
  const xp = stats?.xp_total ?? 0;
  const racha = stats?.racha_dias ?? 0;
  const rangoTexto = stats?.rango_actual ?? `${RANGOS[0].emoji} ${RANGOS[0].nombre}`;
  const rangoInfo = getRangoInfo(xp);
  const rangoColor = getRangoColor(xp);

  // Animate progress number
  useEffect(() => {
    const start = prevProgressRef.current;
    const end = progreso;
    if (start === end) {
      setDisplayedProgress(end);
      return;
    }

    const duration = 1200;
    const startTime = performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      const current = start + (end - start) * eased;
      setDisplayedProgress(Math.round(current * 10) / 10);

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayedProgress(end);
        prevProgressRef.current = end;
      }
    }

    requestAnimationFrame(animate);
  }, [progreso]);

  // English class alerts
  useEffect(() => {
    if (studyDays.length > 0) {
      const alerts = getEnglishClassAlerts(studyDays);
      setEnglishAlerts(alerts);
    }
  }, [studyDays]);

  // Generate motivational message when progress changes
  const generateMotivationalMessage = useCallback(async () => {
    if (!isGeminiConfigured()) return;
    if (!stats) return;

    setIsLoadingMessage(true);
    try {
      const message = await generarMensajeMotivador(progreso, xp, rangoTexto, racha);
      setIaMessage(message);
      await updateUserStats({ ultimo_mensaje_ia: message });
      messageGeneratedForProgress.current = progreso;
      if (onStatsUpdate) {
        const updated = await getUserStats();
        if (updated) onStatsUpdate(updated);
      }
    } catch (err) {
      console.error('Error generating motivational message:', err);
    } finally {
      setIsLoadingMessage(false);
    }
  }, [progreso, xp, rangoTexto, racha, stats, onStatsUpdate]);

  // Auto-generate message when progress changes significantly
  useEffect(() => {
    if (!stats) return;
    if (messageGeneratedForProgress.current === progreso) return;
    if (iaMessage && Math.abs(progreso - (messageGeneratedForProgress.current ?? 0)) < 0.5) return;

    if (!iaMessage) {
      generateMotivationalMessage();
    }
  }, [progreso, stats, iaMessage, generateMotivationalMessage]);

  // XP progress within current rank
  const xpInRank = xp - rangoInfo.currentMin;
  const xpRankTotal = rangoInfo.nextMin - rangoInfo.currentMin;
  const xpRankPercent = xpRankTotal > 0 ? Math.min((xpInRank / xpRankTotal) * 100, 100) : 100;

  return (
    <div className="space-y-4">
      {/* English Class Alerts */}
      <AnimatePresence>
        {englishAlerts.map((alert, idx) => (
          <motion.div
            key={`alert-${alert.dia.dia_numero}-${idx}`}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="relative overflow-hidden rounded-xl border border-amber-500/40 bg-amber-950/40 p-4"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-amber-500/5" />
            <div className="relative flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/20">
                <Bell className="h-5 w-5 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-300">
                  🏫 Clase de Inglés Presencial{' '}
                  {alert.hoursUntil <= 12 ? (
                    <span className="ml-2 inline-flex items-center rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-bold text-red-400 ring-1 ring-red-500/30">
                      ¡En menos de {Math.ceil(alert.hoursUntil)}h!
                    </span>
                  ) : (
                    <span className="ml-2 inline-flex items-center rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-400 ring-1 ring-amber-500/30">
                      En ~{Math.ceil(alert.hoursUntil)}h
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-sm text-amber-200/80 truncate">
                  {alert.horario} — Día {alert.dia.dia_numero}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-amber-500/50" />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Main Progress Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl shadow-cyan-500/5"
      >
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5 pointer-events-none" />
        <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" />

        <div className="relative space-y-5">
          {/* Top Row: Title + Stats */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 ring-1 ring-cyan-500/30">
                <GraduationCap className="h-6 w-6 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  Jesus Mastery Hub
                </h2>
                <p className="text-sm text-slate-400">
                  Ruta de 199 días hacia SLB & Data/ML Engineering
                </p>
              </div>
            </div>

            {/* Stats Badges */}
            <div className="flex flex-wrap items-center gap-2">
              {/* XP Badge */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5"
              >
                <Zap className="h-4 w-4 text-cyan-400" />
                <span className="text-sm font-bold text-cyan-300">
                  {xp.toLocaleString()} XP
                </span>
              </motion.div>

              {/* Streak Badge */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 ${
                  racha >= 7
                    ? 'border-orange-500/30 bg-orange-500/10'
                    : racha >= 3
                    ? 'border-amber-500/30 bg-amber-500/10'
                    : 'border-slate-700 bg-slate-800/50'
                }`}
              >
                <Flame
                  className={`h-4 w-4 ${
                    racha >= 7
                      ? 'text-orange-400'
                      : racha >= 3
                      ? 'text-amber-400'
                      : 'text-slate-500'
                  }`}
                />
                <span
                  className={`text-sm font-bold ${
                    racha >= 7
                      ? 'text-orange-300'
                      : racha >= 3
                      ? 'text-amber-300'
                      : 'text-slate-400'
                  }`}
                >
                  {racha} día{racha !== 1 ? 's' : ''}
                </span>
              </motion.div>
            </div>
          </div>

          {/* Main Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                <motion.span
                  key={displayedProgress}
                  className="text-3xl font-black tabular-nums text-white"
                >
                  {displayedProgress.toFixed(1)}%
                </motion.span>
                <span className="text-sm font-medium text-slate-400">
                  Completado
                </span>
              </div>
              <span className="text-xs text-slate-500">
                {Math.round((progreso / 100) * 199 * 6)}/{199 * 6} bloques
              </span>
            </div>

            <div className="relative h-4 w-full overflow-hidden rounded-full bg-slate-800 ring-1 ring-slate-700/50">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progreso, 100)}%` }}
                transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-cyan-500 via-cyan-400 to-blue-500"
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 overflow-hidden rounded-full">
                  <motion.div
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 3,
                      ease: 'easeInOut',
                    }}
                    className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  />
                </div>
              </motion.div>

              {/* Milestone markers */}
              {[25, 50, 75].map((milestone) => (
                <div
                  key={milestone}
                  className="absolute top-0 bottom-0 w-px bg-slate-600/50"
                  style={{ left: `${milestone}%` }}
                />
              ))}
            </div>
          </div>

          {/* Rank Section */}
          <div className="flex flex-col gap-3 rounded-xl border border-slate-800/80 bg-slate-950/50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 ring-1 ring-slate-700">
                <Trophy className={`h-5 w-5 ${rangoColor}`} />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Rango Actual
                </p>
                <p className={`text-sm font-bold ${rangoColor}`}>
                  {rangoTexto}
                </p>
              </div>
            </div>

            {/* XP to next rank */}
            {rangoInfo.nextMin !== rangoInfo.currentMin && xp < rangoInfo.nextMin && (
              <div className="flex-1 max-w-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-500">Siguiente rango</span>
                  <span className="text-xs font-medium text-slate-400">
                    {xpInRank}/{xpRankTotal} XP
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${xpRankPercent}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full rounded-full ${
                      xpRankPercent >= 75
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                        : xpRankPercent >= 50
                        ? 'bg-gradient-to-r from-cyan-500 to-cyan-400'
                        : 'bg-gradient-to-r from-blue-600 to-blue-500'
                    }`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* AI Motivational Message */}
          <div className="relative overflow-hidden rounded-xl border border-slate-800/80 bg-slate-950/50 p-4">
            <div className="absolute top-0 left-0 h-full w-1 bg-gradient-to-b from-cyan-500 via-blue-500 to-purple-500 rounded-l-xl" />
            <div className="pl-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-cyan-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                    Mentor IA
                  </span>
                </div>
                <button
                  onClick={generateMotivationalMessage}
                  disabled={isLoadingMessage || !isGeminiConfigured()}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-400 transition-colors hover:bg-slate-800 hover:text-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed"
                  title={
                    !isGeminiConfigured()
                      ? 'Configura tu API Key de Gemini primero'
                      : 'Generar nuevo mensaje motivador'
                  }
                >
                  <RefreshCw
                    className={`h-3 w-3 ${isLoadingMessage ? 'animate-spin' : ''}`}
                  />
                  <span className="hidden sm:inline">Nuevo</span>
                </button>
              </div>

              <AnimatePresence mode="wait">
                {isLoadingMessage ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-2"
                  >
                    <div className="h-4 w-3/4 animate-pulse rounded bg-slate-800" />
                    <div className="h-4 w-1/2 animate-pulse rounded bg-slate-800" />
                  </motion.div>
                ) : iaMessage ? (
                  <motion.p
                    key={iaMessage}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.4 }}
                    className="text-sm leading-relaxed text-slate-300"
                  >
                    {iaMessage}
                  </motion.p>
                ) : (
                  <motion.p
                    key="default"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm italic text-slate-500"
                  >
                    {isGeminiConfigured()
                      ? 'Haz clic en "Nuevo" para recibir un mensaje motivador personalizado.'
                      : 'Configura tu API Key de Gemini para recibir mensajes motivadores de tu mentor IA.'}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
