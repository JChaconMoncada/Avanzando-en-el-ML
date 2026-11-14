'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getUserStats,
  getStudyDays,
  seedStudyDays,
  recalcProgress,
} from '@/lib/supabase';
import { generateAllStudyDays, getCurrentDayNumber } from '@/lib/curriculum';
import type { UserStats, StudyDay } from '@/lib/types';
import { PUNTOS_FIJOS } from '@/lib/types';
import ProgressHeader from '@/components/dashboard/ProgressHeader';
import DayCard from '@/components/dashboard/DayCard';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  Flame,
  CheckCircle2,
  Clock,
  Sparkles,
  Loader2,
  Compass,
} from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [studyDays, setStudyDays] = useState<StudyDay[]>([]);
  const [currentDayNum, setCurrentDayNum] = useState<number>(1);
  const [selectedPuntoFijo, setSelectedPuntoFijo] = useState<number | 'all'>('all');
  const [loading, setLoading] = useState(true);

  // Initialize and load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      let user = await getUserStats();
      let days = await getStudyDays();

      // If no days found, auto-seed with all 199 days
      if (days.length === 0) {
        const generated = generateAllStudyDays();
        await seedStudyDays(generated);
        days = generated;
      }

      setStudyDays(days);
      setStats(user);

      // Detect current day
      const todayNum = getCurrentDayNumber();
      setCurrentDayNum(todayNum);
    } catch (err) {
      console.error('Error cargando datos del dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatsUpdate = (newStats: UserStats) => {
    setStats(newStats);
  };

  const handleDayUpdate = (updatedDay: StudyDay) => {
    setStudyDays((prev) =>
      prev.map((d) => (d.dia_numero === updatedDay.dia_numero ? updatedDay : d))
    );
  };

  const handleProgressUpdate = async () => {
    const newPct = await recalcProgress();
    const updatedUser = await getUserStats();
    if (updatedUser) {
      setStats(updatedUser);
    }
  };

  const currentDay =
    studyDays.find((d) => d.dia_numero === currentDayNum) ||
    studyDays[0] ||
    null;

  // Filter days based on selected Punto Fijo
  const filteredDays = studyDays.filter((d) => {
    if (selectedPuntoFijo === 'all') return true;
    const pf = PUNTOS_FIJOS.find((p) => p.id === selectedPuntoFijo);
    if (!pf) return true;
    return d.dia_numero >= pf.dias[0] && d.dia_numero <= pf.dias[1];
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
        <p className="text-slate-400 text-sm">
          Cargando currículo de 199 días y sincronizando con Supabase...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* MÓDULO 1: Header de Progreso & Mensajes IA */}
      <ProgressHeader
        stats={stats}
        studyDays={studyDays}
        onStatsUpdate={handleStatsUpdate}
      />

      {/* Punto Fijo Filter Tabs */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <Filter className="w-4 h-4 text-cyan-400" />
            Filtrar por Etapa del Plan (6 Puntos Fijos)
          </div>
          <button
            onClick={() => setCurrentDayNum(getCurrentDayNumber())}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-medium border border-cyan-500/30 transition-all"
          >
            <Compass className="w-3.5 h-3.5" />
            Ir al Día Actual ({getCurrentDayNumber()})
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
          <button
            onClick={() => setSelectedPuntoFijo('all')}
            className={`px-3 py-2 rounded-xl text-xs font-medium transition-all text-center ${
              selectedPuntoFijo === 'all'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800/80'
            }`}
          >
            Todos (199 Días)
          </button>
          {PUNTOS_FIJOS.map((pf) => (
            <button
              key={pf.id}
              onClick={() => {
                setSelectedPuntoFijo(pf.id);
                // Jump to first day of this phase if outside
                if (currentDayNum < pf.dias[0] || currentDayNum > pf.dias[1]) {
                  setCurrentDayNum(pf.dias[0]);
                }
              }}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all text-left ${
                selectedPuntoFijo === pf.id
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800/80'
              }`}
            >
              <div className="font-semibold truncate">{pf.nombre}</div>
              <div className="text-[10px] text-slate-500">
                Días {pf.dias[0]}-{pf.dias[1]}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Day Selector & Navigation Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center justify-between gap-4 mb-3">
          <button
            onClick={() => setCurrentDayNum((prev) => Math.max(1, prev - 1))}
            disabled={currentDayNum <= 1}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-xs text-slate-300 disabled:opacity-30 border border-slate-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Día Anterior
          </button>

          <div className="text-center">
            <span className="text-xs uppercase tracking-wider text-slate-400">
              Viendo Día Seleccionado
            </span>
            <div className="text-lg font-bold text-white flex items-center justify-center gap-2">
              <span>Día #{currentDayNum}</span>
              <span className="text-xs text-slate-400 font-normal">
                ({currentDay?.fecha})
              </span>
            </div>
          </div>

          <button
            onClick={() => setCurrentDayNum((prev) => Math.min(199, prev + 1))}
            disabled={currentDayNum >= 199}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-xs text-slate-300 disabled:opacity-30 border border-slate-800 transition-colors"
          >
            Día Siguiente
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Day Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 pt-1 scrollbar-thin">
          {filteredDays.map((d) => {
            const isSelected = d.dia_numero === currentDayNum;
            const isCompleted = d.completado_dia;
            const hasUnderstoodBlocks = [
              d.ing_b1_estado,
              d.ing_b2_estado,
              d.ing_b3_estado,
              d.ml_parte1_estado,
              d.ml_parte2_estado,
              d.slb_estado,
            ].filter((s) => s === 'entendido').length;

            return (
              <button
                key={d.dia_numero}
                onClick={() => setCurrentDayNum(d.dia_numero)}
                className={`shrink-0 flex flex-col items-center justify-center w-11 h-14 rounded-xl text-xs font-mono transition-all ${
                  isSelected
                    ? 'bg-gradient-to-b from-cyan-500 to-blue-600 text-white font-bold shadow-lg shadow-cyan-900/40 ring-2 ring-cyan-400'
                    : isCompleted
                    ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                    : hasUnderstoodBlocks > 0
                    ? 'bg-slate-900 text-slate-200 border border-slate-700'
                    : 'bg-slate-950 text-slate-500 hover:text-slate-300 border border-slate-800/80'
                }`}
              >
                <span className="text-[10px] text-opacity-80">DÍA</span>
                <span className="text-sm font-bold">{d.dia_numero}</span>
                <span className="text-[9px] opacity-75">
                  {hasUnderstoodBlocks}/6
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* MÓDULO 2: Tarjeta del Día con los 6 Bloques & Opciones de Respaldo */}
      {currentDay && (
        <DayCard
          day={currentDay}
          onDayUpdate={handleDayUpdate}
          onProgressUpdate={handleProgressUpdate}
        />
      )}
    </div>
  );
}
