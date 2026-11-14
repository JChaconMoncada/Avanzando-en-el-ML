'use client';

import ProfileCard from '@/components/perfil/ProfileCard';
import SkillRadar from '@/components/perfil/SkillRadar';
import DebtWall from '@/components/perfil/DebtWall';
import { UserCheck, ShieldAlert, Award, Compass } from 'lucide-react';

export default function PerfilPage() {
  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              Tracking de Carrera & Competencias
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Perfil de Empleabilidad & Deuda Técnica
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Monitoreo continuo de tu índice de preparación para la vacante en Schlumberger (SLB) y puestos remotos como Data/ML Engineer.
              Sube de rango sumando XP en parciales y resolviendo tu muro de deuda técnica.
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Profile Card + Skill Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7">
          <ProfileCard />
        </div>
        <div className="lg:col-span-5">
          <SkillRadar />
        </div>
      </div>

      {/* Full width: Red Debt Wall */}
      <div className="pt-2">
        <DebtWall />
      </div>
    </div>
  );
}
