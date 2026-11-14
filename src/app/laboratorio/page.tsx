'use client';

import { useState } from 'react';
import { Code2, Gauge, Award, Terminal, Flame, ShieldAlert } from 'lucide-react';
import ExerciseTab from '@/components/laboratorio/ExerciseTab';
import SLBTrainer from '@/components/laboratorio/SLBTrainer';

export default function LaboratorioPage() {
  const [activeTab, setActiveTab] = useState<'codigo' | 'slb'>('codigo');

  return (
    <div className="space-y-6">
      {/* Page Title & Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
              Modo Riguroso Industrial (No-Friendly)
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Laboratorio & Parciales con IA
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Evaluación técnica estricta con los estándares de Schlumberger y empresas de software internacionales. 
              Vectorización en Pandas, optimización de queries SQL, pipelines sin data leakage y física aplicada de campo.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 self-start md:self-auto">
            <button
              onClick={() => setActiveTab('codigo')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'codigo'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <Code2 className="w-4 h-4" />
              Pestaña A: Código & ML
            </button>
            <button
              onClick={() => setActiveTab('slb')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'slb'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <Gauge className="w-4 h-4" />
              Pestaña B: Entrenador SLB
            </button>
          </div>
        </div>
      </div>

      {/* Active Tab View */}
      <div>
        {activeTab === 'codigo' ? <ExerciseTab /> : <SLBTrainer />}
      </div>
    </div>
  );
}
