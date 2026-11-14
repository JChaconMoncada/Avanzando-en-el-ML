'use client';

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { UserStats, StudyDay, Evaluacion, DeudaTecnica, GeminiEvalResult } from './types';
import { RANGOS } from './types';

let supabaseInstance: SupabaseClient | null = null;

function getConfigFromStorage(): { url: string; key: string } | null {
  if (typeof window === 'undefined') return null;
  const url = localStorage.getItem('jmh_supabase_url');
  const key = localStorage.getItem('jmh_supabase_key');
  if (url && key) return { url, key };
  return null;
}

export function getSupabase(): SupabaseClient | null {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (envUrl && envKey) {
    if (!supabaseInstance) {
      supabaseInstance = createClient(envUrl, envKey);
    }
    return supabaseInstance;
  }

  const stored = getConfigFromStorage();
  if (stored) {
    supabaseInstance = createClient(stored.url, stored.key);
    return supabaseInstance;
  }

  return null;
}

export function resetSupabaseClient() {
  supabaseInstance = null;
}

export function isSupabaseConfigured(): boolean {
  return getSupabase() !== null;
}

// ==================== USER STATS ====================

export async function getUserStats(): Promise<UserStats | null> {
  const sb = getSupabase();
  if (!sb) return getLocalUserStats();
  const { data, error } = await sb.from('user_stats').select('*').limit(1).single();
  if (error || !data) return getLocalUserStats();
  return data as UserStats;
}

export async function updateUserStats(updates: Partial<UserStats>): Promise<void> {
  const sb = getSupabase();
  updates.updated_at = new Date().toISOString();
  if (!sb) {
    updateLocalUserStats(updates);
    return;
  }
  const { data: existing } = await sb.from('user_stats').select('id').limit(1).single();
  if (existing) {
    await sb.from('user_stats').update(updates).eq('id', existing.id);
  } else {
    await sb.from('user_stats').insert({ ...getDefaultUserStats(), ...updates });
  }
}

export async function addXP(amount: number): Promise<UserStats> {
  const stats = await getUserStats();
  const current = stats || getDefaultUserStats();
  const newXP = Math.max(0, current.xp_total + amount);
  const rango = RANGOS.find(r => newXP >= r.min && newXP <= r.max) || RANGOS[0];
  const updates: Partial<UserStats> = {
    xp_total: newXP,
    rango_actual: `${rango.emoji} ${rango.nombre}`,
  };
  await updateUserStats(updates);
  return { ...current, ...updates };
}

export async function deductXP(amount: number): Promise<UserStats> {
  const stats = await getUserStats();
  const current = stats || getDefaultUserStats();
  const newXP = Math.max(0, current.xp_total - amount);
  const rango = RANGOS.find(r => newXP >= r.min && newXP <= r.max) || RANGOS[0];
  const updates: Partial<UserStats> = {
    xp_total: newXP,
    rango_actual: `${rango.emoji} ${rango.nombre}`,
  };
  await updateUserStats(updates);
  return { ...current, ...updates };
}

export async function resetUserXP(): Promise<UserStats> {
  const stats = await getUserStats();
  const current = stats || getDefaultUserStats();
  const rango = RANGOS[0];
  const updates: Partial<UserStats> = {
    xp_total: 0,
    rango_actual: `${rango.emoji} ${rango.nombre}`,
  };
  await updateUserStats(updates);
  return { ...current, ...updates };
}

export async function syncUserXP(): Promise<UserStats> {
  const days = await getStudyDays();
  const evals = await getEvaluaciones(999);

  let completedBlocks = 0;
  for (const d of days) {
    const states = [
      d.ing_b1_estado,
      d.ing_b2_estado,
      d.ing_b3_estado,
      d.ml_parte1_estado,
      d.ml_parte2_estado,
      d.slb_estado,
    ];
    completedBlocks += states.filter((s) => s === 'entendido').length;
  }

  // Si todos los bloques están pendientes y no hay evaluaciones reales aprobadas
  if (completedBlocks === 0 && evals.length === 0) {
    return await resetUserXP();
  }

  let calculatedXP = completedBlocks * 20;
  for (const ev of evals) {
    if (ev.xp_cambio && ev.tipo_evaluacion !== 'ejercicio_diario') {
      calculatedXP += ev.xp_cambio;
    }
  }

  const finalXP = Math.max(0, calculatedXP);
  const rango = RANGOS.find((r) => finalXP >= r.min && finalXP <= r.max) || RANGOS[0];
  const updates: Partial<UserStats> = {
    xp_total: finalXP,
    rango_actual: `${rango.emoji} ${rango.nombre}`,
  };
  await updateUserStats(updates);
  const current = (await getUserStats()) || getDefaultUserStats();
  return { ...current, ...updates };
}

export async function updateSkill(skill: string, delta: number): Promise<void> {
  const stats = await getUserStats();
  if (!stats) return;
  const key = `skill_${skill}` as keyof UserStats;
  const current = (stats[key] as number) || 0;
  const newVal = Math.min(100, Math.max(0, current + delta));
  await updateUserStats({ [key]: newVal } as Partial<UserStats>);
}

// ==================== STUDY DAYS ====================

export async function getStudyDays(): Promise<StudyDay[]> {
  const sb = getSupabase();
  if (!sb) return getLocalStudyDays();
  const { data, error } = await sb.from('study_days').select('*').order('dia_numero', { ascending: true });
  if (error || !data || data.length === 0) return getLocalStudyDays();
  return data as StudyDay[];
}

export async function getStudyDay(diaNumero: number): Promise<StudyDay | null> {
  const sb = getSupabase();
  if (!sb) {
    const days = getLocalStudyDays();
    return days.find(d => d.dia_numero === diaNumero) || null;
  }
  const { data, error } = await sb.from('study_days').select('*').eq('dia_numero', diaNumero).single();
  if (error || !data) return null;
  return data as StudyDay;
}

export async function updateStudyDay(diaNumero: number, updates: Partial<StudyDay>): Promise<void> {
  const sb = getSupabase();
  if (!sb) {
    updateLocalStudyDay(diaNumero, updates);
    return;
  }
  await sb.from('study_days').update(updates).eq('dia_numero', diaNumero);
}

export async function seedStudyDays(days: StudyDay[]): Promise<void> {
  const sb = getSupabase();
  if (!sb) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('jmh_study_days', JSON.stringify(days));
    }
    return;
  }
  const { data: existing } = await sb.from('study_days').select('dia_numero').limit(1);
  if (existing && existing.length > 0) return;
  const batchSize = 50;
  for (let i = 0; i < days.length; i += batchSize) {
    const batch = days.slice(i, i + batchSize);
    await sb.from('study_days').upsert(batch, { onConflict: 'dia_numero' });
  }
}

// ==================== EVALUACIONES ====================

export async function getEvaluaciones(limit = 50): Promise<Evaluacion[]> {
  const sb = getSupabase();
  if (!sb) return getLocalEvaluaciones();
  const { data, error } = await sb.from('evaluaciones_y_parciales').select('*').order('created_at', { ascending: false }).limit(limit);
  if (error || !data) return getLocalEvaluaciones();
  return data as Evaluacion[];
}

export async function saveEvaluacion(evalData: Omit<Evaluacion, 'id' | 'created_at'>): Promise<void> {
  const sb = getSupabase();
  if (!sb) {
    saveLocalEvaluacion(evalData);
    return;
  }
  await sb.from('evaluaciones_y_parciales').insert(evalData);
}

export async function saveEvalResult(
  diaNumero: number,
  tipo: Evaluacion['tipo_evaluacion'],
  categoria: Evaluacion['categoria'],
  enunciado: string,
  entrega: string,
  resultado: GeminiEvalResult,
  nombreArchivo?: string
): Promise<void> {
  const evalData: Omit<Evaluacion, 'id' | 'created_at'> = {
    dia_numero: diaNumero,
    tipo_evaluacion: tipo,
    categoria,
    enunciado_reto: enunciado,
    entrega_usuario_texto: entrega,
    nombre_archivo: nombreArchivo || null,
    puntaje: resultado.puntaje,
    xp_cambio: resultado.xp_cambio,
    veredicto: resultado.veredicto,
    aciertos_json: resultado.lo_que_estuvo_bien,
    errores_criticos_json: resultado.errores_criticos,
    temas_reforzar_json: resultado.temas_a_reforzar,
    feedback_detallado: resultado.solucion_optima_explicada,
  };
  await saveEvaluacion(evalData);
  await addXP(resultado.xp_cambio);

  const skillMap: Record<string, string> = {
    'Python/Pandas': 'python_pandas',
    'SQL/BI': 'sql_bi',
    'Machine Learning': 'ml_xgboost',
    'SLB Técnico': 'slb_tecnico',
    'Inglés B2': 'ingles_b2',
  };
  const skillKey = skillMap[categoria];
  if (skillKey && resultado.puntaje >= 70) {
    await updateSkill(skillKey, Math.floor(resultado.puntaje / 20));
  }

  if (resultado.veredicto === 'REPROBADO - DEUDA TÉCNICA') {
    for (const tema of resultado.temas_a_reforzar) {
      await addDeuda({
        dia_numero: diaNumero,
        categoria,
        tema,
        motivo_fallo: resultado.errores_criticos.join('; '),
        cursos_respaldo_sugeridos: null,
        resuelto: false,
        nota_recuperacion: null,
      });
    }
  }

  const allEvals = await getEvaluaciones(999);
  if (allEvals.length > 0) {
    const avg = allEvals.reduce((sum, e) => sum + e.puntaje, 0) / allEvals.length;
    await updateUserStats({ promedio_general: Math.round(avg * 100) / 100 });
  }
}

// ==================== DEUDA TÉCNICA ====================

export async function getDeudas(): Promise<DeudaTecnica[]> {
  const sb = getSupabase();
  if (!sb) return getLocalDeudas();
  const { data, error } = await sb.from('deuda_tecnica').select('*').order('created_at', { ascending: false });
  if (error || !data) return getLocalDeudas();
  return data as DeudaTecnica[];
}

export async function addDeuda(deuda: Omit<DeudaTecnica, 'id' | 'created_at'>): Promise<void> {
  const sb = getSupabase();
  if (!sb) {
    saveLocalDeuda(deuda);
    return;
  }
  await sb.from('deuda_tecnica').insert(deuda);
}

export async function resolveDeuda(id: string, nota: number): Promise<void> {
  const sb = getSupabase();
  if (!sb) {
    resolveLocalDeuda(id, nota);
    return;
  }
  await sb.from('deuda_tecnica').update({ resuelto: true, nota_recuperacion: nota }).eq('id', id);
}

// ==================== PROGRESS ====================

export async function recalcProgress(): Promise<number> {
  const days = await getStudyDays();
  if (days.length === 0) return 0;
  let completed = 0;
  let total = 0;
  for (const d of days) {
    const blocks = [d.ing_b1_estado, d.ing_b2_estado, d.ing_b3_estado, d.ml_parte1_estado, d.ml_parte2_estado, d.slb_estado];
    for (const b of blocks) {
      total++;
      if (b === 'entendido') completed++;
    }
  }
  const pct = total > 0 ? Math.round((completed / total) * 10000) / 100 : 0;
  await updateUserStats({ progreso_porcentaje: pct });
  return pct;
}

// ==================== LOCAL STORAGE FALLBACK ====================

function getDefaultUserStats(): UserStats {
  return {
    id: 'local-user',
    nombre: 'Jesús Chacón',
    xp_total: 0,
    promedio_general: 0,
    rango_actual: '🥉 Nivel 1: Estudiante en Formación',
    racha_dias: 0,
    progreso_porcentaje: 0,
    skill_python_pandas: 0,
    skill_sql_bi: 0,
    skill_ml_xgboost: 0,
    skill_slb_tecnico: 0,
    skill_ingles_b2: 0,
    ultimo_mensaje_ia: null,
    medallas_google_cloud: [],
    medallas_kaggle: [],
    updated_at: new Date().toISOString(),
  };
}

function getLocalUserStats(): UserStats {
  if (typeof window === 'undefined') return getDefaultUserStats();
  const stored = localStorage.getItem('jmh_user_stats');
  if (stored) return JSON.parse(stored);
  return getDefaultUserStats();
}

function updateLocalUserStats(updates: Partial<UserStats>): void {
  if (typeof window === 'undefined') return;
  const current = getLocalUserStats();
  const updated = { ...current, ...updates, updated_at: new Date().toISOString() };
  localStorage.setItem('jmh_user_stats', JSON.stringify(updated));
}

function getLocalStudyDays(): StudyDay[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('jmh_study_days');
  if (stored) return JSON.parse(stored);
  return [];
}

function updateLocalStudyDay(diaNumero: number, updates: Partial<StudyDay>): void {
  if (typeof window === 'undefined') return;
  const days = getLocalStudyDays();
  const idx = days.findIndex(d => d.dia_numero === diaNumero);
  if (idx >= 0) {
    days[idx] = { ...days[idx], ...updates };
    localStorage.setItem('jmh_study_days', JSON.stringify(days));
  }
}

function getLocalEvaluaciones(): Evaluacion[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('jmh_evaluaciones');
  if (stored) return JSON.parse(stored);
  return [];
}

function saveLocalEvaluacion(evalData: Omit<Evaluacion, 'id' | 'created_at'>): void {
  if (typeof window === 'undefined') return;
  const evals = getLocalEvaluaciones();
  evals.unshift({ ...evalData, id: crypto.randomUUID(), created_at: new Date().toISOString() } as Evaluacion);
  localStorage.setItem('jmh_evaluaciones', JSON.stringify(evals));
}

function getLocalDeudas(): DeudaTecnica[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('jmh_deudas');
  if (stored) return JSON.parse(stored);
  return [];
}

function saveLocalDeuda(deuda: Omit<DeudaTecnica, 'id' | 'created_at'>): void {
  if (typeof window === 'undefined') return;
  const deudas = getLocalDeudas();
  deudas.unshift({ ...deuda, id: crypto.randomUUID(), created_at: new Date().toISOString() } as DeudaTecnica);
  localStorage.setItem('jmh_deudas', JSON.stringify(deudas));
}

function resolveLocalDeuda(id: string, nota: number): void {
  if (typeof window === 'undefined') return;
  const deudas = getLocalDeudas();
  const idx = deudas.findIndex(d => d.id === id);
  if (idx >= 0) {
    deudas[idx].resuelto = true;
    deudas[idx].nota_recuperacion = nota;
    localStorage.setItem('jmh_deudas', JSON.stringify(deudas));
  }
}
