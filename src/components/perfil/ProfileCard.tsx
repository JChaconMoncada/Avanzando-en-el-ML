'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Flame, Award, CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { getUserStats, updateUserStats } from '@/lib/supabase';
import type { UserStats, RANGOS } from '@/lib/types';

const RANGOS_LIST: { nombre: string; emoji: string; xpMin: number }[] = [
  { nombre: 'Novato', emoji: '🌱', xpMin: 0 },
  { nombre: 'Aprendiz', emoji: '📘', xpMin: 500 },
  { nombre: 'Practicante', emoji: '⚙️', xpMin: 1500 },
  { nombre: 'Competente', emoji: '🔧', xpMin: 3500 },
  { nombre: 'Avanzado', emoji: '🚀', xpMin: 6000 },
  { nombre: 'Experto', emoji: '🧠', xpMin: 10000 },
  { nombre: 'Maestro', emoji: '👑', xpMin: 15000 },
  { nombre: 'Leyenda', emoji: '🏆', xpMin: 25000 },
];

const GOOGLE_CLOUD_MEDALS = [
  { key: 'bigquery', label: 'BigQuery' },
  { key: 'intro_genai', label: 'Intro to GenAI' },
  { key: 'responsible_ai', label: 'Responsible AI' },
  { key: 'ml_crash_course', label: 'ML Crash Course' },
] as const;

const KAGGLE_MEDALS = [
  { key: 'python', label: 'Python' },
  { key: 'pandas', label: 'Pandas' },
  { key: 'sql_intro', label: 'SQL Intro' },
  { key: 'sql_advanced', label: 'SQL Advanced' },
  { key: 'intro_ml', label: 'Intro to ML' },
  { key: 'intermediate_ml', label: 'Intermediate ML' },
] as const;

type GoogleCloudMedalKey = (typeof GOOGLE_CLOUD_MEDALS)[number]['key'];
type KaggleMedalKey = (typeof KAGGLE_MEDALS)[number]['key'];

interface MedallasGoogleCloud {
  [key: string]: boolean;
}

interface MedallasKaggle {
  [key: string]: boolean;
}

function getCurrentRank(xp: number): { nombre: string; emoji: string; xpMin: number; next: { nombre: string; xpMin: number } | null } {
  let current = RANGOS_LIST[0];
  for (let i = RANGOS_LIST.length - 1; i >= 0; i--) {
    if (xp >= RANGOS_LIST[i].xpMin) {
      current = RANGOS_LIST[i];
      break;
    }
  }
  const currentIndex = RANGOS_LIST.indexOf(current);
  const next = currentIndex < RANGOS_LIST.length - 1 ? RANGOS_LIST[currentIndex + 1] : null;
  return { ...current, next };
}

function ProgressRing({ value, size = 100, strokeWidth = 8 }: { value: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgb(30 41 59)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgb(6 182 212)" />
            <stop offset="100%" stopColor="rgb(59 130 246)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-white">{Math.round(value)}</span>
        <span className="text-[10px] text-slate-400">/100</span>
      </div>
    </div>
  );
}

export default function ProfileCard() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingMedals, setSavingMedals] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const data = await getUserStats();
      setStats(data);
    } catch (err) {
      console.error('Error fetching user stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleGoogleCloudToggle = async (key: GoogleCloudMedalKey) => {
    if (!stats || savingMedals) return;
    setSavingMedals(true);
    const currentList = Array.isArray(stats.medallas_google_cloud) ? stats.medallas_google_cloud : [];
    const updatedList = currentList.includes(key)
      ? currentList.filter((k) => k !== key)
      : [...currentList, key];
    try {
      await updateUserStats({ medallas_google_cloud: updatedList });
      setStats((prev) => prev ? { ...prev, medallas_google_cloud: updatedList } : prev);
    } catch (err) {
      console.error('Error updating Google Cloud medals:', err);
    } finally {
      setSavingMedals(false);
    }
  };

  const handleKaggleToggle = async (key: KaggleMedalKey) => {
    if (!stats || savingMedals) return;
    setSavingMedals(true);
    const currentList = Array.isArray(stats.medallas_kaggle) ? stats.medallas_kaggle : [];
    const updatedList = currentList.includes(key)
      ? currentList.filter((k) => k !== key)
      : [...currentList, key];
    try {
      await updateUserStats({ medallas_kaggle: updatedList });
      setStats((prev) => prev ? { ...prev, medallas_kaggle: updatedList } : prev);
    } catch (err) {
      console.error('Error updating Kaggle medals:', err);
    } finally {
      setSavingMedals(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/90 p-12">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="rounded-2xl border border-red-800 bg-red-950/30 p-6 text-center text-red-300">
        Error al cargar el perfil. Intenta recargar la página.
      </div>
    );
  }

  const rank = getCurrentRank(stats.xp_total ?? 0);
  const xpTotal = stats.xp_total ?? 0;
  const promedio = stats.promedio_general ?? 0;
  const streak = stats.racha_dias ?? 0;
  const googleMedalsList = Array.isArray(stats.medallas_google_cloud) ? stats.medallas_google_cloud : [];
  const kaggleMedalsList = Array.isArray(stats.medallas_kaggle) ? stats.medallas_kaggle : [];

  const xpProgress = rank.next
    ? ((xpTotal - rank.xpMin) / (rank.next.xpMin - rank.xpMin)) * 100
    : 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-lg shadow-cyan-500/5"
    >
      {/* Glow effect */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />

      {/* Header: Avatar + Name */}
      <div className="relative mb-6 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-2xl font-bold text-white shadow-lg shadow-cyan-500/20">
          JC
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Jesús Chacón</h2>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span>{rank.emoji}</span>
            <span className="font-medium text-cyan-400">{rank.nombre}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="relative mb-6 grid grid-cols-3 gap-4">
        {/* XP Total */}
        <div className="flex flex-col items-center rounded-xl border border-slate-800 bg-slate-950/50 p-4">
          <Trophy className="mb-1 h-5 w-5 text-cyan-400" />
          <span className="text-2xl font-bold text-cyan-400">{xpTotal.toLocaleString()}</span>
          <span className="text-xs text-slate-400">XP Total</span>
        </div>

        {/* Promedio General */}
        <div className="flex flex-col items-center rounded-xl border border-slate-800 bg-slate-950/50 p-4">
          <ProgressRing value={promedio} size={80} strokeWidth={6} />
          <span className="mt-1 text-xs text-slate-400">Promedio</span>
        </div>

        {/* Streak */}
        <div className="flex flex-col items-center rounded-xl border border-slate-800 bg-slate-950/50 p-4">
          <Flame className="mb-1 h-5 w-5 text-amber-400" />
          <span className="text-2xl font-bold text-amber-400">{streak}</span>
          <span className="text-xs text-slate-400">Día{streak !== 1 ? 's' : ''} Racha</span>
        </div>
      </div>

      {/* Rank Progress */}
      <div className="relative mb-6">
        <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
          <span>{rank.emoji} {rank.nombre}</span>
          {rank.next && <span>{rank.next.nombre}</span>}
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-800">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(xpProgress, 100)}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
        {rank.next && (
          <div className="mt-1 text-right text-xs text-slate-500">
            {rank.next.xpMin - xpTotal} XP para {rank.next.nombre}
          </div>
        )}
      </div>

      {/* Google Cloud Medals */}
      <div className="relative mb-5">
        <div className="mb-3 flex items-center gap-2">
          <Award className="h-4 w-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-white">Medallas Google Cloud</h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {GOOGLE_CLOUD_MEDALS.map((medal) => {
            const checked = googleMedalsList.includes(medal.key);
            return (
              <button
                key={medal.key}
                onClick={() => handleGoogleCloudToggle(medal.key)}
                disabled={savingMedals}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-all ${
                  checked
                    ? 'border-emerald-700 bg-emerald-950/40 text-emerald-300'
                    : 'border-slate-700 bg-slate-950/30 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                } ${savingMedals ? 'cursor-wait opacity-70' : 'cursor-pointer'}`}
              >
                {checked ? (
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-400" />
                ) : (
                  <Circle className="h-4 w-4 flex-shrink-0 text-slate-600" />
                )}
                <span className="truncate">{medal.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Kaggle Medals */}
      <div className="relative">
        <div className="mb-3 flex items-center gap-2">
          <Award className="h-4 w-4 text-sky-400" />
          <h3 className="text-sm font-semibold text-white">Medallas Kaggle</h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {KAGGLE_MEDALS.map((medal) => {
            const checked = kaggleMedalsList.includes(medal.key);
            return (
              <button
                key={medal.key}
                onClick={() => handleKaggleToggle(medal.key)}
                disabled={savingMedals}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-all ${
                  checked
                    ? 'border-emerald-700 bg-emerald-950/40 text-emerald-300'
                    : 'border-slate-700 bg-slate-950/30 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                } ${savingMedals ? 'cursor-wait opacity-70' : 'cursor-pointer'}`}
              >
                {checked ? (
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-400" />
                ) : (
                  <Circle className="h-4 w-4 flex-shrink-0 text-slate-600" />
                )}
                <span className="truncate">{medal.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
