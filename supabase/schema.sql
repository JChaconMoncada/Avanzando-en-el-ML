-- ============================================================
-- JESUS MASTERY HUB - Esquema de Base de Datos para Supabase
-- Ruta a SLB & Data/ML Engineer (2026-2027)
-- ============================================================

-- Extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PERFIL Y PUNTUACIÓN DE JESÚS
CREATE TABLE IF NOT EXISTS user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL DEFAULT 'Jesús Chacón',
  xp_total INT NOT NULL DEFAULT 0,
  promedio_general NUMERIC(5,2) NOT NULL DEFAULT 0,
  rango_actual TEXT NOT NULL DEFAULT 'Nivel 1: Estudiante en Formación',
  racha_dias INT NOT NULL DEFAULT 0,
  progreso_porcentaje NUMERIC(5,2) NOT NULL DEFAULT 0,
  skill_python_pandas INT NOT NULL DEFAULT 0,
  skill_sql_bi INT NOT NULL DEFAULT 0,
  skill_ml_xgboost INT NOT NULL DEFAULT 0,
  skill_slb_tecnico INT NOT NULL DEFAULT 0,
  skill_ingles_b2 INT NOT NULL DEFAULT 0,
  ultimo_mensaje_ia TEXT,
  medallas_google_cloud JSONB DEFAULT '[]'::jsonb,
  medallas_kaggle JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. CALENDARIO DE 199 DÍAS DE ESTUDIO
CREATE TABLE IF NOT EXISTS study_days (
  dia_numero INT PRIMARY KEY CHECK (dia_numero BETWEEN 1 AND 199),
  fecha DATE NOT NULL,
  punto_fijo_fase TEXT NOT NULL,
  completado_dia BOOLEAN NOT NULL DEFAULT false,

  -- Inglés (3 bloques de 30 min)
  ing_b1_titulo TEXT,
  ing_b1_estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (ing_b1_estado IN ('pendiente', 'entendido', 'no_entendido')),
  ing_b2_titulo TEXT,
  ing_b2_estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (ing_b2_estado IN ('pendiente', 'entendido', 'no_entendido')),
  ing_b3_titulo TEXT,
  ing_b3_estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (ing_b3_estado IN ('pendiente', 'entendido', 'no_entendido')),

  -- Datos/ML (2 partes con break)
  ml_parte1_titulo TEXT,
  ml_parte1_desc TEXT,
  ml_parte1_estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (ml_parte1_estado IN ('pendiente', 'entendido', 'no_entendido')),
  ml_parte2_titulo TEXT,
  ml_parte2_desc TEXT,
  ml_parte2_estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (ml_parte2_estado IN ('pendiente', 'entendido', 'no_entendido')),

  -- SLB (1 hora diaria)
  slb_titulo TEXT,
  slb_desc TEXT,
  slb_estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (slb_estado IN ('pendiente', 'entendido', 'no_entendido')),

  notas_dia TEXT
);

-- 3. EVALUACIONES Y PARCIALES
CREATE TABLE IF NOT EXISTS evaluaciones_y_parciales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dia_numero INT REFERENCES study_days(dia_numero) ON DELETE SET NULL,
  tipo_evaluacion TEXT NOT NULL CHECK (tipo_evaluacion IN ('ejercicio_diario', 'parcial_codigo', 'simulacro_slb', 'practica_ingles')),
  categoria TEXT NOT NULL CHECK (categoria IN ('Python/Pandas', 'SQL/BI', 'Machine Learning', 'SLB Técnico', 'Inglés B2')),
  enunciado_reto TEXT,
  entrega_usuario_texto TEXT,
  nombre_archivo TEXT,
  puntaje INT NOT NULL DEFAULT 0 CHECK (puntaje BETWEEN 0 AND 100),
  xp_cambio INT NOT NULL DEFAULT 0,
  veredicto TEXT NOT NULL CHECK (veredicto IN ('APROBADO CON EXCELENCIA', 'APROBADO CON OBSERVACIONES', 'REPROBADO - DEUDA TÉCNICA')),
  aciertos_json JSONB DEFAULT '[]'::jsonb,
  errores_criticos_json JSONB DEFAULT '[]'::jsonb,
  temas_reforzar_json JSONB DEFAULT '[]'::jsonb,
  feedback_detallado TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. DEUDA TÉCNICA
CREATE TABLE IF NOT EXISTS deuda_tecnica (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dia_numero INT REFERENCES study_days(dia_numero) ON DELETE SET NULL,
  categoria TEXT NOT NULL,
  tema TEXT NOT NULL,
  motivo_fallo TEXT,
  cursos_respaldo_sugeridos TEXT,
  resuelto BOOLEAN NOT NULL DEFAULT false,
  nota_recuperacion INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ÍNDICES para rendimiento
CREATE INDEX IF NOT EXISTS idx_study_days_fecha ON study_days(fecha);
CREATE INDEX IF NOT EXISTS idx_study_days_fase ON study_days(punto_fijo_fase);
CREATE INDEX IF NOT EXISTS idx_evaluaciones_dia ON evaluaciones_y_parciales(dia_numero);
CREATE INDEX IF NOT EXISTS idx_evaluaciones_tipo ON evaluaciones_y_parciales(tipo_evaluacion);
CREATE INDEX IF NOT EXISTS idx_evaluaciones_categoria ON evaluaciones_y_parciales(categoria);
CREATE INDEX IF NOT EXISTS idx_deuda_categoria ON deuda_tecnica(categoria);
CREATE INDEX IF NOT EXISTS idx_deuda_resuelta ON deuda_tecnica(resuelto);

-- ROW LEVEL SECURITY (deshabilitada para app mono-usuario, se puede habilitar si se requiere)
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluaciones_y_parciales ENABLE ROW LEVEL SECURITY;
ALTER TABLE deuda_tecnica ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas para acceso anónimo (app mono-usuario)
CREATE POLICY "Allow all on user_stats" ON user_stats FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on study_days" ON study_days FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on evaluaciones_y_parciales" ON evaluaciones_y_parciales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on deuda_tecnica" ON deuda_tecnica FOR ALL USING (true) WITH CHECK (true);

-- Insertar registro inicial de usuario
INSERT INTO user_stats (nombre) VALUES ('Jesús Chacón') ON CONFLICT DO NOTHING;
