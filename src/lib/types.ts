// ============================================================
// TIPOS CENTRALES - Jesus Mastery Hub
// ============================================================

export interface UserStats {
  id: string;
  nombre: string;
  xp_total: number;
  promedio_general: number;
  rango_actual: string;
  racha_dias: number;
  progreso_porcentaje: number;
  skill_python_pandas: number;
  skill_sql_bi: number;
  skill_ml_xgboost: number;
  skill_slb_tecnico: number;
  skill_ingles_b2: number;
  ultimo_mensaje_ia: string | null;
  medallas_google_cloud: string[];
  medallas_kaggle: string[];
  updated_at: string;
}

export type EstadoBloque = 'pendiente' | 'entendido' | 'no_entendido';

export interface StudyDay {
  dia_numero: number;
  fecha: string;
  punto_fijo_fase: string;
  completado_dia: boolean;
  ing_b1_titulo: string | null;
  ing_b1_estado: EstadoBloque;
  ing_b2_titulo: string | null;
  ing_b2_estado: EstadoBloque;
  ing_b3_titulo: string | null;
  ing_b3_estado: EstadoBloque;
  ml_parte1_titulo: string | null;
  ml_parte1_desc: string | null;
  ml_parte1_estado: EstadoBloque;
  ml_parte2_titulo: string | null;
  ml_parte2_desc: string | null;
  ml_parte2_estado: EstadoBloque;
  slb_titulo: string | null;
  slb_desc: string | null;
  slb_estado: EstadoBloque;
  notas_dia: string | null;
}

export type TipoEvaluacion = 'ejercicio_diario' | 'parcial_codigo' | 'simulacro_slb' | 'practica_ingles';
export type CategoriaEval = 'Python/Pandas' | 'SQL/BI' | 'Machine Learning' | 'SLB Técnico' | 'Inglés B2';
export type Veredicto = 'APROBADO CON EXCELENCIA' | 'APROBADO CON OBSERVACIONES' | 'REPROBADO - DEUDA TÉCNICA';

export interface Evaluacion {
  id: string;
  dia_numero: number | null;
  tipo_evaluacion: TipoEvaluacion;
  categoria: CategoriaEval;
  enunciado_reto: string | null;
  entrega_usuario_texto: string | null;
  nombre_archivo: string | null;
  puntaje: number;
  xp_cambio: number;
  veredicto: Veredicto;
  aciertos_json: string[];
  errores_criticos_json: string[];
  temas_reforzar_json: string[];
  feedback_detallado: string | null;
  created_at: string;
}

export interface DeudaTecnica {
  id: string;
  dia_numero: number | null;
  categoria: string;
  tema: string;
  motivo_fallo: string | null;
  cursos_respaldo_sugeridos: string | null;
  resuelto: boolean;
  nota_recuperacion: number | null;
  created_at: string;
}

export interface QuizPregunta {
  id: number;
  pregunta: string;
  opciones: string[];
  respuesta_correcta: number; // 0, 1, 2, 3
  explicacion: string;
}

export interface QuizResultado {
  totalPreguntas: number;
  correctas: number;
  porcentaje: number;
  aprobado: boolean;
  detalles: {
    pregunta: string;
    seleccionada: number;
    correcta: number;
    esCorrecta: boolean;
    explicacion: string;
  }[];
}

export interface GeminiEvalResult {
  puntaje: number;
  veredicto: Veredicto;
  lo_que_estuvo_bien: string[];
  errores_criticos: string[];
  temas_a_reforzar: string[];
  solucion_optima_explicada: string;
  xp_cambio: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface AppConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  geminiApiKey: string;
}

export const RANGOS = [
  { min: 0, max: 500, emoji: '🥉', nombre: 'Nivel 1: Estudiante en Formación' },
  { min: 501, max: 1500, emoji: '🥈', nombre: 'Nivel 2: Data Trainee en Progreso' },
  { min: 1501, max: 3000, emoji: '🥇', nombre: 'Nivel 3: Junior Data Analyst Ready' },
  { min: 3001, max: 5000, emoji: '💎', nombre: 'Nivel 4: Junior ML & AI Candidate' },
  { min: 5001, max: Infinity, emoji: '🏆', nombre: 'Nivel 5: CALIFICADO PARA SLB & VACANTES REMOTAS LATAM' },
] as const;

export const PUNTOS_FIJOS = [
  { id: 1, nombre: 'Punto Fijo 1', dias: [1, 21], titulo: 'Python Quirúrgico & Pandas Profundo', color: 'cyan' },
  { id: 2, nombre: 'Punto Fijo 2', dias: [22, 35], titulo: 'SQL para Analistas & Visualización', color: 'blue' },
  { id: 3, nombre: 'Punto Fijo 3', dias: [36, 49], titulo: 'Proyecto 1 GitHub & Medallas GCP', color: 'emerald' },
  { id: 4, nombre: 'Punto Fijo 4', dias: [50, 77], titulo: 'Machine Learning Clásico & XGBoost', color: 'violet' },
  { id: 5, nombre: 'Punto Fijo 5', dias: [78, 98], titulo: 'Proyecto 2 Estrella & Streamlit', color: 'amber' },
  { id: 6, nombre: 'Punto Fijo 6', dias: [99, 199], titulo: 'Proyecto 3, Redes Neuronales & Simulacros', color: 'rose' },
] as const;

export const SLB_ROTACION: Record<number, { titulo: string; desc: string }> = {
  1: { titulo: 'Fracciones de Pulgada & Tuberías', desc: 'ID = OD - 2t, porcentajes mentales, lectura de cintas de medición' },
  2: { titulo: 'Trenes de Engranajes & Transmisiones', desc: 'Gear ratio, Idler Gear, correas en 8, relación de transmisión' },
  3: { titulo: 'Tablas Numéricas SHL Verify', desc: 'Tablas financieras, comparación de datos, análisis numérico rápido' },
  4: { titulo: 'Poleas, Palancas & Rampas', desc: 'T = W/N, ventaja mecánica, clases de palancas, plano inclinado' },
  5: { titulo: 'Circuitos Eléctricos & Ley de Ohm', desc: 'V = IR, P = IV, Efecto Joule Q = I²Rt, circuitos serie/paralelo' },
  6: { titulo: 'Presión Hidrostática & Fluidos', desc: 'P = 0.052 × MW × TVD, Prensa de Pascal, caudales Q = A × v' },
  0: { titulo: 'Simulacro Semanal Integrado', desc: 'Despiece de válvula en 5 min, aligación de lodos, examen completo' },
};

export const CURSOS_RESPALDO: Record<string, { opciones: string[] }> = {
  'Python/Pandas': {
    opciones: [
      'Opción 1: Federico Garay – Curso de Python 18 Días (Udemy)',
      'Opción 2: Federico Garay – Curso de Python 16 Días (Udemy)',
      'Opción 3: Juan Gabriel Gomila – Python Data Analysis (Udemy)',
      'Opción 4: Ubaldo Acosta – Universidad Python Secciones 1-15 (Udemy)',
      'Opción 5: Jose Portilla – Python Bootcamp + Kaggle Learn Python/Pandas',
    ],
  },
  'SQL/BI': {
    opciones: [
      'Opción 1: Curso Práctico SQL en Udemy Plan Personal',
      'Opción 2: Juan Gabriel Gomila – SQL de A a Z (Udemy)',
      'Opción 3: Jose Portilla – Complete SQL Bootcamp (Udemy)',
      'Opción 4: Kaggle Intro & Advanced SQL (BigQuery)',
      'Opción 5: Curso Completo Microsoft Power BI (Udemy)',
    ],
  },
  'Machine Learning': {
    opciones: [
      'Opción 1: Santiago Hernández – ML y Data Science Curso Completo con Python (Udemy)',
      'Opción 2: Federico Garay – Días 13-18 (Udemy)',
      'Opción 3: Juan Gabriel Gomila & Kirill Eremenko – ML de A a la Z (solo carpetas Python)',
      'Opción 4: Juan Gabriel Gomila – Curso Completo ML en Python (Udemy)',
      'Opción 5: Kirill Eremenko – ML A-Z 2026 con AWS + Kaggle + Google ML Crash Course Badges',
    ],
  },
  'SLB Técnico': {
    opciones: [
      'Opción 1: Videos de YouTube de mecánica industrial SLB',
      'Opción 2: Manual de referencia interna SLB (si disponible)',
      'Opción 3: Khan Academy – Física Mecánica & Fluidos',
      'Opción 4: Coursera – Introduction to Mechanical Engineering',
      'Opción 5: Práctica con problemas tipo SHL Verify en portales de preparación',
    ],
  },
  'Inglés B2': {
    opciones: [
      'Opción 1: Academia presencial en Palmira (Martes y Viernes)',
      'Opción 2: Curso de inglés B2 en Udemy',
      'Opción 3: BBC Learning English – Upper Intermediate',
      'Opción 4: Cambridge English – Write & Improve',
      'Opción 5: Práctica oral con Gemini en modo conversación',
    ],
  },
};
