'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';
import { Loader2, Crosshair } from 'lucide-react';
import { getUserStats } from '@/lib/supabase';
import type { UserStats } from '@/lib/types';

interface SkillDataPoint {
  skill: string;
  value: number;
  fullMark: number;
}

const SKILL_KEYS: { key: keyof UserStats; label: string }[] = [
  { key: 'skill_python_pandas', label: 'Python/Pandas' },
  { key: 'skill_sql_bi', label: 'SQL/BI' },
  { key: 'skill_ml_xgboost', label: 'ML/XGBoost' },
  { key: 'skill_slb_tecnico', label: 'SLB Técnico' },
  { key: 'skill_ingles_b2', label: 'Inglés B2' },
];

function CustomAngleAxisTick(props: any) {
  const { x, y, payload } = props;
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="central"
      fill="rgb(148 163 184)"
      fontSize={12}
      fontWeight={500}
    >
      {payload?.value}
    </text>
  );
}

export default function SkillRadar() {
  const [data, setData] = useState<SkillDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSkills = useCallback(async () => {
    try {
      const stats = await getUserStats();
      const skillData: SkillDataPoint[] = SKILL_KEYS.map((sk) => ({
        skill: sk.label,
        value: stats && typeof stats[sk.key] === 'number' ? (stats[sk.key] as number) : 0,
        fullMark: 100,
      }));
      setData(skillData);
    } catch (err) {
      console.error('Error fetching skills:', err);
      setError('Error al cargar habilidades');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/90 p-12">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
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

  const avgScore =
    data.length > 0
      ? Math.round(data.reduce((sum, d) => sum + d.value, 0) / data.length)
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-lg shadow-cyan-500/5"
    >
      {/* Glow */}
      <div className="pointer-events-none absolute -top-16 left-1/2 h-32 w-32 -translate-x-1/2 rounded-full bg-cyan-500/8 blur-3xl" />

      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crosshair className="h-5 w-5 text-cyan-400" />
          <h3 className="text-lg font-bold text-white">Radar de Habilidades</h3>
        </div>
        <div className="rounded-full bg-cyan-500/10 px-3 py-1 text-sm font-semibold text-cyan-400">
          Promedio: {avgScore}
        </div>
      </div>

      {/* Radar Chart */}
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
            <PolarGrid
              stroke="rgb(51 65 85)"
              strokeDasharray="3 3"
              gridType="polygon"
            />
            <PolarAngleAxis
              dataKey="skill"
              tick={CustomAngleAxisTick}
              tickLine={false}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tickCount={5}
              tick={{ fill: 'rgb(100 116 139)', fontSize: 10 }}
              axisLine={false}
              stroke="rgb(51 65 85)"
            />
            <Radar
              name="Habilidades"
              dataKey="value"
              stroke="rgb(6 182 212)"
              strokeWidth={2}
              fill="rgb(6 182 212)"
              fillOpacity={0.2}
              dot={{
                r: 4,
                fill: 'rgb(6 182 212)',
                stroke: 'rgb(8 145 178)',
                strokeWidth: 1,
              }}
              animationDuration={1200}
              animationEasing="ease-out"
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Skill Breakdown */}
      <div className="mt-4 grid grid-cols-5 gap-2">
        {data.map((skill) => {
          let colorClass = 'text-red-400';
          if (skill.value >= 85) colorClass = 'text-emerald-400';
          else if (skill.value >= 60) colorClass = 'text-cyan-400';
          else if (skill.value >= 40) colorClass = 'text-amber-400';

          return (
            <div
              key={skill.skill}
              className="flex flex-col items-center rounded-lg border border-slate-800 bg-slate-950/50 px-2 py-2"
            >
              <span className={`text-lg font-bold ${colorClass}`}>{skill.value}</span>
              <span className="text-center text-[10px] leading-tight text-slate-500">
                {skill.skill}
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
