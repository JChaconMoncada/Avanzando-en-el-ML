import type { StudyDay } from './types';
import { SLB_ROTACION } from './types';

// Fecha de inicio: 14 de noviembre de 2026
const FECHA_INICIO = new Date(2026, 10, 14); // Mes 10 = Noviembre (0-indexed)

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getPuntoFijo(dia: number): string {
  if (dia <= 21) return 'Punto Fijo 1: Python Quirúrgico & Pandas Profundo';
  if (dia <= 35) return 'Punto Fijo 2: SQL para Analistas & Visualización';
  if (dia <= 49) return 'Punto Fijo 3: Proyecto 1 GitHub & Medallas GCP';
  if (dia <= 77) return 'Punto Fijo 4: Machine Learning Clásico & XGBoost';
  if (dia <= 98) return 'Punto Fijo 5: Proyecto 2 Estrella & Streamlit';
  return 'Punto Fijo 6: Proyecto 3, Redes Neuronales & Simulacros';
}

// ==================== CONTENIDO DETALLADO POR PUNTO FIJO ====================

interface DayContent {
  ing_b1: string; ing_b2: string; ing_b3: string;
  ml1_titulo: string; ml1_desc: string;
  ml2_titulo: string; ml2_desc: string;
}

function getPF1Content(dayInPhase: number): DayContent {
  const temas: DayContent[] = [
    { ing_b1: 'Vocabulario técnico: Workplace greetings', ing_b2: 'Gramática: Present Simple for routines', ing_b3: 'Listening: Office conversations', ml1_titulo: 'Instalación Python + VS Code + Jupyter', ml1_desc: 'Configurar entorno de desarrollo. Instalar Python 3.11+, pip, VS Code con extensiones. Crear primer notebook.', ml2_titulo: 'Variables, tipos de datos y operadores', ml2_desc: 'int, float, str, bool. Operadores aritméticos, comparación, lógicos. f-strings.' },
    { ing_b1: 'Technical reading: Python documentation', ing_b2: 'Gramática: Present Continuous', ing_b3: 'Speaking: Introducing yourself', ml1_titulo: 'Estructuras de control: if/elif/else', ml1_desc: 'Condicionales anidados, operador ternario, match-case (Python 3.10+).', ml2_titulo: 'Bucles for y while', ml2_desc: 'range(), enumerate(), zip(). Break, continue. List comprehensions básicas.' },
    { ing_b1: 'Vocabulario: Data types & structures', ing_b2: 'Gramática: Past Simple regular verbs', ing_b3: 'Writing: Technical email', ml1_titulo: 'Funciones en Python', ml1_desc: 'def, return, *args, **kwargs. Docstrings. Funciones lambda. Type hints.', ml2_titulo: 'Listas, tuplas y diccionarios', ml2_desc: 'Métodos de lista: append, extend, sort, reverse. Dict comprehensions. Nested structures.' },
    { ing_b1: 'Technical terms: Engineering context', ing_b2: 'Gramática: Past Simple irregular verbs', ing_b3: 'Listening: TED talk summary', ml1_titulo: 'Manejo de strings y archivos', ml1_desc: 'String methods: split, join, strip, replace. Regex básico. Lectura/escritura de archivos con with open().', ml2_titulo: 'Sets y operaciones con colecciones', ml2_desc: 'Conjuntos, operaciones de unión e intersección. defaultdict, Counter, OrderedDict.' },
    { ing_b1: 'Reading: Stack Overflow posts', ing_b2: 'Gramática: Present Perfect', ing_b3: 'Speaking: Describing a process', ml1_titulo: 'POO Parte 1: Clases y objetos', ml1_desc: 'class, __init__, self, atributos de instancia vs clase. Métodos. @property.', ml2_titulo: 'POO Parte 2: Herencia y polimorfismo', ml2_desc: 'Herencia simple y múltiple. super(). Métodos abstractos. @staticmethod, @classmethod.' },
    { ing_b1: 'Vocab: Numbers, measurements, units', ing_b2: 'Gramática: Comparatives & Superlatives', ing_b3: 'Writing: Bug report', ml1_titulo: 'Manejo de errores y excepciones', ml1_desc: 'try/except/else/finally. Excepciones personalizadas. Logging básico.', ml2_titulo: 'Módulos, paquetes y pip', ml2_desc: 'Importar módulos. Crear paquetes. Entornos virtuales (venv). requirements.txt.' },
    { ing_b1: 'Technical reading: API documentation', ing_b2: 'Gramática: Future with will/going to', ing_b3: 'Listening: Podcast tech', ml1_titulo: 'NumPy Fundamentos', ml1_desc: 'np.array(), dtype, shape, reshape. Indexing y slicing. Broadcasting.', ml2_titulo: 'NumPy Operaciones vectorizadas', ml2_desc: 'Operaciones element-wise. np.where(), np.dot(), np.linalg. Generación aleatoria.' },
    { ing_b1: 'Vocab: Data analysis terminology', ing_b2: 'Gramática: Modal verbs (can, must)', ing_b3: 'Speaking: Explaining code', ml1_titulo: 'Pandas: Series y DataFrame', ml1_desc: 'Crear DataFrames. pd.read_csv(), .head(), .info(), .describe(). dtypes.', ml2_titulo: 'Pandas: Selección con .loc y .iloc', ml2_desc: '.loc[row, col] por etiqueta. .iloc[row, col] por posición. Boolean indexing.' },
    { ing_b1: 'Reading: Pandas documentation', ing_b2: 'Gramática: Conditional Type 1', ing_b3: 'Writing: Data analysis summary', ml1_titulo: 'Pandas: Filtros condicionales', ml1_desc: 'df[df["col"] > valor]. Múltiples condiciones con & y |. .query() method. .isin().', ml2_titulo: 'Pandas: Valores nulos y limpieza', ml2_desc: '.isna(), .fillna(), .dropna(). .replace(). .astype(). Detección de duplicados.' },
    { ing_b1: 'Vocab: Charts and visualization', ing_b2: 'Gramática: Passive voice basics', ing_b3: 'Listening: Data science talk', ml1_titulo: 'Pandas: GroupBy profundo', ml1_desc: '.groupby() con una y múltiples columnas. .agg() con diccionarios. .transform(). .apply().', ml2_titulo: 'Pandas: Merge y Join', ml2_desc: '.merge() con on, left_on, right_on. how: inner, left, right, outer. Manejo de sufijos.' },
    { ing_b1: 'Technical writing: Report structure', ing_b2: 'Gramática: Relative clauses', ing_b3: 'Speaking: Presenting data', ml1_titulo: 'Pandas: Pivot tables y crosstab', ml1_desc: '.pivot_table() con aggfunc. pd.crosstab(). .melt() para unpivot. .stack()/.unstack().', ml2_titulo: 'Pandas: Operaciones con fechas', ml2_desc: 'pd.to_datetime(). .dt accessor. Resample. Rolling windows. Timedelta.' },
    { ing_b1: 'Reading: Machine learning articles', ing_b2: 'Gramática: Conditional Type 2', ing_b3: 'Writing: LinkedIn post in English', ml1_titulo: 'Pandas: Operaciones con strings', ml1_desc: '.str accessor. str.contains(), str.extract(), str.replace(). Regex en Pandas.', ml2_titulo: 'Pandas: Rendimiento y vectorización', ml2_desc: 'Evitar loops for. .apply() vs vectorización. np.vectorize(). Benchmark con %timeit.' },
    { ing_b1: 'Vocab: Oil & Gas industry', ing_b2: 'Gramática: Reported speech', ing_b3: 'Listening: SLB company video', ml1_titulo: 'Parcial 1: Python + Pandas', ml1_desc: 'Examen práctico: Leer CSV, limpiar datos, filtrar, groupby, merge dos DataFrames.', ml2_titulo: 'Repaso de errores del Parcial 1', ml2_desc: 'Revisar feedback de la IA. Reforzar temas débiles identificados.' },
    { ing_b1: 'Technical reading: Well drilling', ing_b2: 'Gramática: Gerunds vs Infinitives', ing_b3: 'Speaking: Mock interview Q1', ml1_titulo: 'Pandas Avanzado: MultiIndex', ml1_desc: 'Crear y manipular MultiIndex. .xs() cross-section. Resetear index. Ordenar MultiIndex.', ml2_titulo: 'Pandas Avanzado: Window functions', ml2_desc: '.rolling(), .expanding(), .ewm(). Cálculo de medias móviles. Señales de trading.' },
    { ing_b1: 'Vocab: Technical specifications', ing_b2: 'Gramática: Articles (a/an/the)', ing_b3: 'Writing: Process documentation', ml1_titulo: 'Pandas: Categorías y optimización', ml1_desc: 'Categorical dtype para ahorrar memoria. .memory_usage(). Chunked reading con chunksize.', ml2_titulo: 'Proyecto mini: Análisis de dataset real', ml2_desc: 'Descargar dataset de Kaggle. EDA completo: limpieza, estadísticas, visualizaciones.' },
    { ing_b1: 'Reading: Industry reports', ing_b2: 'Gramática: Prepositions of time/place', ing_b3: 'Listening: Interview preparation', ml1_titulo: 'Visualización con Matplotlib básico', ml1_desc: 'plt.plot(), plt.bar(), plt.scatter(). Subplots. Labels, títulos, leyendas.', ml2_titulo: 'Matplotlib avanzado y estilos', ml2_desc: 'fig, ax API. Colormaps. Anotaciones. Guardar figuras en alta resolución.' },
    { ing_b1: 'Technical vocab: Database terms', ing_b2: 'Gramática: Quantifiers (much/many)', ing_b3: 'Speaking: Describing charts', ml1_titulo: 'Seaborn para análisis de datos', ml1_desc: 'sns.heatmap(), sns.boxplot(), sns.violinplot(), sns.pairplot(). Temas y paletas.', ml2_titulo: 'EDA profesional con Pandas + Seaborn', ml2_desc: 'Flujo completo de EDA: distribuciones, correlaciones, outliers, feature engineering.' },
    { ing_b1: 'Reading: SQL documentation', ing_b2: 'Gramática: Connectors (however, therefore)', ing_b3: 'Writing: Analysis conclusions', ml1_titulo: 'Parcial 2: Pandas + Visualización', ml1_desc: 'Examen práctico completo: EDA de dataset con groupby, pivot, merge + visualizaciones.', ml2_titulo: 'Repaso de errores del Parcial 2', ml2_desc: 'Revisar feedback de la IA. Documentar lecciones aprendidas.' },
    { ing_b1: 'Vocab: Professional communication', ing_b2: 'Gramática: Present Perfect Continuous', ing_b3: 'Listening: Tech podcast', ml1_titulo: 'Decoradores y generadores en Python', ml1_desc: '@decorator. Generadores con yield. Itertools. Context managers con __enter__/__exit__.', ml2_titulo: 'Testing en Python', ml2_desc: 'unittest, pytest. Fixtures. Mocking. Test-driven development básico.' },
    { ing_b1: 'Technical reading: Data pipelines', ing_b2: 'Gramática: Phrasal verbs (set up, log in)', ing_b3: 'Speaking: Technical presentation', ml1_titulo: 'Git y GitHub para Data Science', ml1_desc: 'git init, add, commit, push, pull, branch, merge. .gitignore para notebooks. GitHub repos.', ml2_titulo: 'Jupyter Notebooks avanzado', ml2_desc: 'Magic commands. Widgets interactivos. Exportar a HTML/PDF. nbconvert.' },
    { ing_b1: 'Vocab review: All technical terms', ing_b2: 'Gramática review: All tenses', ing_b3: 'Writing: Self-assessment report', ml1_titulo: 'Parcial 3: Python Completo', ml1_desc: 'Examen integral de Python: POO + Funciones + Pandas + Visualización + Git.', ml2_titulo: 'Revisión y cierre de Punto Fijo 1', ml2_desc: 'Mapa de fortalezas y debilidades. Plan de refuerzo para Punto Fijo 2.' },
  ];
  const idx = Math.min(dayInPhase, temas.length) - 1;
  return temas[Math.max(0, idx)];
}

function getPF2Content(dayInPhase: number): DayContent {
  const temas: DayContent[] = [
    { ing_b1: 'Vocab: Database terminology', ing_b2: 'Gramática: Passive voice advanced', ing_b3: 'Listening: SQL tutorial video', ml1_titulo: 'SQL Fundamentos: SELECT, WHERE, ORDER BY', ml1_desc: 'Consultas básicas. Operadores de comparación. LIKE, BETWEEN, IN. NULL handling con IS NULL.', ml2_titulo: 'SQL: Funciones de agregación', ml2_desc: 'COUNT, SUM, AVG, MIN, MAX. GROUP BY con HAVING. DISTINCT.' },
    { ing_b1: 'Technical reading: RDBMS concepts', ing_b2: 'Gramática: Conditional Type 3', ing_b3: 'Speaking: Explaining queries', ml1_titulo: 'SQL: JOINs completos', ml1_desc: 'INNER JOIN, LEFT JOIN, RIGHT JOIN, FULL OUTER JOIN. CROSS JOIN. Self JOIN. Multiple JOINs.', ml2_titulo: 'SQL: Subqueries y queries anidados', ml2_desc: 'Subquery en WHERE, FROM, SELECT. EXISTS, NOT EXISTS. Correlated subqueries.' },
    { ing_b1: 'Vocab: Business intelligence', ing_b2: 'Gramática: Wish clauses', ing_b3: 'Writing: Query documentation', ml1_titulo: 'SQL: CTEs con WITH', ml1_desc: 'Common Table Expressions. CTEs recursivos. Legibilidad vs subqueries. Múltiples CTEs encadenados.', ml2_titulo: 'SQL: CASE WHEN y lógica condicional', ml2_desc: 'CASE simple y searched. COALESCE, NULLIF, CAST. Pivoteo manual con CASE.' },
    { ing_b1: 'Reading: Power BI documentation', ing_b2: 'Gramática: Used to / Would', ing_b3: 'Listening: BI demo', ml1_titulo: 'SQL: Window Functions ROW_NUMBER, RANK', ml1_desc: 'OVER(PARTITION BY ... ORDER BY ...). ROW_NUMBER(), RANK(), DENSE_RANK(). NTILE().', ml2_titulo: 'SQL: Window Functions LAG, LEAD, SUM', ml2_desc: 'LAG(), LEAD() para comparar filas. SUM() OVER, AVG() OVER. ROWS BETWEEN.' },
    { ing_b1: 'Technical vocab: Dashboard metrics', ing_b2: 'Gramática: Causative (have/get)', ing_b3: 'Speaking: Presenting a dashboard', ml1_titulo: 'Parcial SQL: Queries complejas', ml1_desc: 'Examen práctico: CTEs + JOINs + Window Functions sobre dataset de ventas/producción.', ml2_titulo: 'Repaso de errores SQL', ml2_desc: 'Revisión de feedback IA. Optimización de queries con EXPLAIN.' },
    { ing_b1: 'Reading: Visualization best practices', ing_b2: 'Gramática: Inversion for emphasis', ing_b3: 'Writing: Dashboard report', ml1_titulo: 'Power BI: Conexión de datos y modelo', ml1_desc: 'Importar CSV/Excel. Relaciones entre tablas. Modelo estrella. Power Query Editor.', ml2_titulo: 'Power BI: DAX y medidas', ml2_desc: 'CALCULATE, FILTER, ALL, RELATED. Medidas vs columnas calculadas. Time intelligence.' },
    { ing_b1: 'Vocab: KPIs and metrics', ing_b2: 'Gramática: Cleft sentences', ing_b3: 'Listening: Industry analysis', ml1_titulo: 'Power BI: Visualizaciones avanzadas', ml1_desc: 'Gráficos de línea, barras, mapas. Slicers y filtros. Drill-through. Bookmarks. Tooltips.', ml2_titulo: 'Power BI: Publicación y compartir', ml2_desc: 'Publicar en servicio. Dashboards interactivos. Scheduled refresh. Row-level security.' },
    { ing_b1: 'Technical reading: Data warehousing', ing_b2: 'Gramática: Mixed conditionals', ing_b3: 'Speaking: Data storytelling', ml1_titulo: 'Integración Python + SQL + BI', ml1_desc: 'sqlite3, sqlalchemy con Pandas. pd.read_sql(). Crear pipelines Python que alimenten Power BI.', ml2_titulo: 'Proyecto mini: Dashboard de datos', ml2_desc: 'Crear dashboard completo: SQL para extraer, Pandas para transformar, Power BI/Matplotlib para visualizar.' },
    { ing_b1: 'Vocab: Analytics terminology', ing_b2: 'Gramática: Emphasis & focus', ing_b3: 'Writing: Analysis presentation', ml1_titulo: 'SQL Avanzado: Optimización', ml1_desc: 'Índices, EXPLAIN ANALYZE. Query plan reading. Normalización vs denormalización. Particiones.', ml2_titulo: 'SQL Avanzado: Procedimientos y funciones', ml2_desc: 'Stored procedures básicos. User-defined functions. Triggers. Transacciones.' },
    { ing_b1: 'Reading: BigQuery documentation', ing_b2: 'Gramática: Complex sentences', ing_b3: 'Listening: Google Cloud webinar', ml1_titulo: 'Google BigQuery Intro', ml1_desc: 'Console de BigQuery. Datasets públicos. Syntax específico. STRUCT y ARRAY. UNNEST.', ml2_titulo: 'BigQuery: Queries a escala', ml2_desc: 'Partitioned tables. Clustering. Billing por bytes escaneados. Materialized views.' },
    { ing_b1: 'Technical vocab: Cloud platforms', ing_b2: 'Gramática: Formal register', ing_b3: 'Speaking: Cloud services pitch', ml1_titulo: 'Parcial SQL + BI Completo', ml1_desc: 'Examen integral: SQL avanzado + Window Functions + BigQuery + Dashboard.', ml2_titulo: 'Repaso y cierre de Punto Fijo 2', ml2_desc: 'Mapa de fortalezas SQL/BI. Plan para Punto Fijo 3.' },
    { ing_b1: 'Vocab review: SQL & BI terms', ing_b2: 'Gramática review: Advanced structures', ing_b3: 'Writing: Progress report', ml1_titulo: 'Kaggle: Intro to SQL', ml1_desc: 'Completar módulo de Kaggle SQL. Ejercicios con BigQuery.', ml2_titulo: 'Kaggle: Advanced SQL', ml2_desc: 'Completar módulo avanzado. JOINs, subqueries, analytic functions en BigQuery.' },
    { ing_b1: 'Reading: Industry SQL standards', ing_b2: 'Gramática: Cohesion and coherence', ing_b3: 'Listening: SQL podcast', ml1_titulo: 'SQL: Práctica intensiva con LeetCode', ml1_desc: 'Resolver 10 problemas de SQL de dificultad media en LeetCode/HackerRank.', ml2_titulo: 'SQL: Casos de estudio reales', ml2_desc: 'Analizar queries de producción. Optimizar queries lentas. Best practices.' },
    { ing_b1: 'Technical reading: ETL processes', ing_b2: 'Gramática: Discourse markers', ing_b3: 'Speaking: Job interview Q&A', ml1_titulo: 'Revisión final Punto Fijo 2', ml1_desc: 'Revisar todos los temas de SQL, BigQuery y Power BI. Cerrar deuda técnica.', ml2_titulo: 'Preparación para Punto Fijo 3', ml2_desc: 'Configurar GitHub repo. Planificar Proyecto 1. Revisar requisitos de medallas GCP.' },
  ];
  const idx = Math.min(dayInPhase, temas.length) - 1;
  return temas[Math.max(0, idx)];
}

function getPF3Content(dayInPhase: number): DayContent {
  const temas: DayContent[] = [
    { ing_b1: 'Vocab: Project management', ing_b2: 'Gramática: Linking expressions', ing_b3: 'Writing: README.md in English', ml1_titulo: 'Proyecto 1: Diseño y planificación', ml1_desc: 'Definir scope: SQL + Pandas + IsolationForest. Crear repo GitHub con estructura profesional.', ml2_titulo: 'Proyecto 1: Recolección de datos', ml2_desc: 'Identificar dataset. SQL queries de extracción. Pandas para carga y primera limpieza.' },
    { ing_b1: 'Technical reading: Anomaly detection', ing_b2: 'Gramática: Hedging language', ing_b3: 'Listening: GitHub tutorial', ml1_titulo: 'Proyecto 1: EDA completo', ml1_desc: 'Análisis exploratorio profundo con Pandas + Seaborn. Estadísticas descriptivas. Correlaciones.', ml2_titulo: 'Proyecto 1: Feature engineering', ml2_desc: 'Crear features relevantes para detección de anomalías. Normalización. Encoding.' },
    { ing_b1: 'Vocab: Statistical terms', ing_b2: 'Gramática: Academic writing style', ing_b3: 'Speaking: Explaining methodology', ml1_titulo: 'IsolationForest: Teoría', ml1_desc: 'Cómo funciona: árboles de aislamiento, anomaly score, contamination parameter.', ml2_titulo: 'IsolationForest: Implementación', ml2_desc: 'sklearn.ensemble.IsolationForest. Fit, predict, decision_function. Visualización de anomalías.' },
    { ing_b1: 'Reading: GCP documentation', ing_b2: 'Gramática: Paraphrasing techniques', ing_b3: 'Writing: Technical blog post', ml1_titulo: 'Proyecto 1: Integración y testing', ml1_desc: 'Unir SQL + Pandas + IsolationForest en pipeline reproducible. Testing.', ml2_titulo: 'Proyecto 1: Visualización de resultados', ml2_desc: 'Crear gráficos de anomalías detectadas. Dashboard de resumen. Markdown report.' },
    { ing_b1: 'Technical vocab: Cloud certifications', ing_b2: 'Gramática: Modals of deduction', ing_b3: 'Listening: GCP skills boost', ml1_titulo: 'Proyecto 1: GitHub push final', ml1_desc: 'Commits limpios. README profesional. Screenshots. License. Deploy notebook en Colab/Kaggle.', ml2_titulo: 'Proyecto 1: Documentación', ml2_desc: 'Escribir report completo del proyecto. Conclusiones y mejoras futuras.' },
    { ing_b1: 'Reading: AI/GenAI articles', ing_b2: 'Gramática: Formal emails', ing_b3: 'Speaking: Project presentation', ml1_titulo: 'Google Cloud: BigQuery Badge', ml1_desc: 'Completar lab de Google Cloud Skills Boost: BigQuery. Obtener medalla.', ml2_titulo: 'Google Cloud: BigQuery ML', ml2_desc: 'Crear modelo simple en BigQuery ML. CREATE MODEL. Evaluación.' },
    { ing_b1: 'Vocab: AI and ML terms', ing_b2: 'Gramática: Concession (although, despite)', ing_b3: 'Writing: Skill assessment', ml1_titulo: 'Google Cloud: Intro to GenAI Badge', ml1_desc: 'Completar lab de Intro to Generative AI. Concepts, LLMs, prompting.', ml2_titulo: 'Google Cloud: Responsible AI', ml2_desc: 'Completar módulo de Responsible AI. Ética, bias, fairness.' },
    { ing_b1: 'Technical reading: ML papers', ing_b2: 'Gramática: Nominal clauses', ing_b3: 'Listening: AI conference talk', ml1_titulo: 'Parcial Proyecto 1', ml1_desc: 'Evaluación completa del Proyecto 1: código, documentación, resultados, presentación.', ml2_titulo: 'Cierre Punto Fijo 3', ml2_desc: 'Verificar medallas GCP obtenidas. Actualizar portfolio. Preparar Punto Fijo 4.' },
    { ing_b1: 'Vocab: Research methodology', ing_b2: 'Gramática: Subjunctive mood', ing_b3: 'Speaking: Research discussion', ml1_titulo: 'Refuerzo: Temas débiles de PF1-PF3', ml1_desc: 'Revisar deuda técnica acumulada. Resolver ejercicios pendientes.', ml2_titulo: 'Preparación para ML Clásico', ml2_desc: 'Revisar fundamentos matemáticos: álgebra lineal, cálculo, probabilidad básica.' },
    { ing_b1: 'Reading: Scikit-learn docs', ing_b2: 'Gramática: Emphasis structures', ing_b3: 'Writing: Study plan update', ml1_titulo: 'Matemáticas para ML: Álgebra Lineal', ml1_desc: 'Vectores, matrices, producto punto. np.linalg. Eigenvalues conceptual.', ml2_titulo: 'Matemáticas para ML: Estadística', ml2_desc: 'Distribuciones, media, varianza, desviación estándar. Distribución normal. P-values.' },
    { ing_b1: 'Technical vocab: Evaluation metrics', ing_b2: 'Gramática: Inversion for emphasis', ing_b3: 'Listening: ML crash course', ml1_titulo: 'Matemáticas para ML: Probabilidad', ml1_desc: 'Bayes theorem. Probabilidad condicional. Likelihood. Prior y posterior.', ml2_titulo: 'Matemáticas para ML: Cálculo', ml2_desc: 'Derivadas parciales conceptual. Gradiente. Gradient descent intuición.' },
    { ing_b1: 'Reading: XGBoost paper', ing_b2: 'Gramática: Complex nominalization', ing_b3: 'Speaking: Explaining algorithms', ml1_titulo: 'Revisión final de PF3 + Medallas', ml1_desc: 'Asegurar que todas las medallas GCP están obtenidas. Portfolio actualizado.', ml2_titulo: 'Transición a Punto Fijo 4', ml2_desc: 'Planificar los 28 días de ML Clásico. Instalar scikit-learn, xgboost.' },
    { ing_b1: 'Vocab review: Technical + academic', ing_b2: 'Gramática review: All advanced', ing_b3: 'Writing: Monthly report', ml1_titulo: 'Buffer: Refuerzo general', ml1_desc: 'Día de recuperación. Resolver cualquier deuda técnica pendiente.', ml2_titulo: 'Buffer: Práctica libre', ml2_desc: 'Resolver ejercicios adicionales en Kaggle o LeetCode.' },
    { ing_b1: 'Reading: Data science career paths', ing_b2: 'Gramática: Review of all structures', ing_b3: 'Listening: Career advice podcast', ml1_titulo: 'Preparación final para PF4', ml1_desc: 'Repasar toda la base Python/Pandas/SQL antes de entrar a ML.', ml2_titulo: 'Configurar entorno ML', ml2_desc: 'Instalar sklearn, xgboost, lightgbm. Verificar Jupyter. Descargar datasets.' },
  ];
  const idx = Math.min(dayInPhase, temas.length) - 1;
  return temas[Math.max(0, idx)];
}

function getGenericMLContent(dayInPhase: number, totalDays: number): DayContent {
  const week = Math.ceil(dayInPhase / 7);
  const dayOfWeek = ((dayInPhase - 1) % 7) + 1;

  const mlTopics: Record<number, { ml1_titulo: string; ml1_desc: string; ml2_titulo: string; ml2_desc: string }> = {
    1: { ml1_titulo: 'Regresión Lineal Simple', ml1_desc: 'Teoría de mínimos cuadrados. sklearn LinearRegression. Coeficientes e intercepto.', ml2_titulo: 'Regresión Lineal: Evaluación', ml2_desc: 'MSE, RMSE, MAE, R². Train/test split. Overfitting vs underfitting.' },
    2: { ml1_titulo: 'Regresión Lineal Múltiple', ml1_desc: 'Múltiples features. Multicolinealidad. VIF. Feature selection.', ml2_titulo: 'Regresión Polinómica', ml2_desc: 'PolynomialFeatures. Grado óptimo. Regularización intro.' },
    3: { ml1_titulo: 'Regresión Logística', ml1_desc: 'Clasificación binaria. Sigmoid. Decision boundary. LogisticRegression.', ml2_titulo: 'Métricas de clasificación', ml2_desc: 'Accuracy, Precision, Recall, F1-Score. Confusion Matrix. classification_report.' },
    4: { ml1_titulo: 'Árboles de Decisión', ml1_desc: 'DecisionTreeClassifier/Regressor. Gini vs Entropy. max_depth, min_samples.', ml2_titulo: 'Visualización y poda de árboles', ml2_desc: 'plot_tree(). Feature importance. Pruning. Overfitting en árboles.' },
    5: { ml1_titulo: 'Random Forest', ml1_desc: 'Ensemble: Bagging + Random subspace. RandomForestClassifier. n_estimators.', ml2_titulo: 'Random Forest: Tuning', ml2_desc: 'GridSearchCV, RandomizedSearchCV. Cross-validation. Feature importance ranking.' },
    6: { ml1_titulo: 'XGBoost Fundamentos', ml1_desc: 'Gradient Boosting intuición. XGBClassifier/XGBRegressor. Learning rate, n_estimators.', ml2_titulo: 'XGBoost Avanzado', ml2_desc: 'Regularización L1/L2. Early stopping. Feature importance. SHAP values.' },
    7: { ml1_titulo: 'Pipelines de ML', ml1_desc: 'sklearn Pipeline. ColumnTransformer. Preprocessing sin data leakage. make_pipeline.', ml2_titulo: 'Cross-Validation profundo', ml2_desc: 'KFold, StratifiedKFold. cross_val_score. Nested CV. Leakage prevention.' },
    8: { ml1_titulo: 'Parcial ML Semana 1-2', ml1_desc: 'Evaluación: Regresión + Clasificación + Métricas + Pipelines.', ml2_titulo: 'Repaso de errores ML', ml2_desc: 'Revisión de feedback IA. Refuerzo de conceptos débiles.' },
    9: { ml1_titulo: 'Preprocesamiento avanzado', ml1_desc: 'StandardScaler, MinMaxScaler, RobustScaler. OneHotEncoder, LabelEncoder. Imputers.', ml2_titulo: 'Feature Engineering avanzado', ml2_desc: 'Binning, log transform, interaction features. Target encoding. Temporal features.' },
    10: { ml1_titulo: 'ROC-AUC y curvas PR', ml1_desc: 'ROC curve, AUC. Precision-Recall curve. Threshold tuning. Class imbalance.', ml2_titulo: 'Manejo de clases desbalanceadas', ml2_desc: 'SMOTE, class_weight, undersampling. BalancedRandomForest. Métricas apropiadas.' },
    11: { ml1_titulo: 'SVM (Support Vector Machines)', ml1_desc: 'Hiperplano separador. Kernel trick: linear, rbf, poly. C y gamma.', ml2_titulo: 'KNN y Naive Bayes', ml2_desc: 'KNeighborsClassifier. Distance metrics. GaussianNB, MultinomialNB.' },
    12: { ml1_titulo: 'Clustering: K-Means', ml1_desc: 'Algoritmo K-Means. Elbow method. Silhouette score. MiniBatchKMeans.', ml2_titulo: 'Clustering: DBSCAN y jerárquico', ml2_desc: 'DBSCAN: eps, min_samples. Dendrogramas. Comparación de métodos.' },
    13: { ml1_titulo: 'Reducción de dimensionalidad: PCA', ml1_desc: 'Principal Component Analysis. Varianza explicada. Scree plot. Biplot.', ml2_titulo: 'PCA aplicado + t-SNE', ml2_desc: 'PCA para visualización y compresión. t-SNE para 2D. UMAP intro.' },
    14: { ml1_titulo: 'Parcial ML Semana 3-4', ml1_desc: 'Evaluación completa: XGBoost + Pipelines + Métricas + Feature Engineering.', ml2_titulo: 'Repaso y refuerzo ML', ml2_desc: 'Cerrar deuda técnica. Preparar para Proyecto 2.' },
    15: { ml1_titulo: 'Google ML Crash Course: Conceptos', ml1_desc: 'Completar módulos conceptuales del ML Crash Course de Google.', ml2_titulo: 'Google ML Crash Course: TensorFlow', ml2_desc: 'Completar módulos prácticos. Obtener badge.' },
    16: { ml1_titulo: 'Model Explainability', ml1_desc: 'SHAP values profundo. LIME. Partial Dependence Plots. Feature importance global vs local.', ml2_titulo: 'MLflow y experiment tracking', ml2_desc: 'MLflow tracking. Log parameters, metrics, artifacts. Model registry.' },
    17: { ml1_titulo: 'AutoML y eficiencia', ml1_desc: 'auto-sklearn, TPOT conceptual. Optuna para hyperparameter tuning. Bayesian optimization.', ml2_titulo: 'Deployment concepts', ml2_desc: 'Model serialization: joblib, pickle. API con FastAPI/Flask. Docker basics.' },
    18: { ml1_titulo: 'Time Series forecasting', ml1_desc: 'Pandas time series. Stationarity. Decomposition. Simple forecasting methods.', ml2_titulo: 'ARIMA y Prophet', ml2_desc: 'ARIMA(p,d,q). pmdarima auto_arima. Facebook Prophet. Forecasting evaluation.' },
    19: { ml1_titulo: 'NLP Fundamentos', ml1_desc: 'Tokenización, stopwords, stemming, lemmatización. Bag of Words, TF-IDF.', ml2_titulo: 'NLP: Clasificación de texto', ml2_desc: 'Text classification con sklearn. CountVectorizer, TfidfVectorizer. Sentiment analysis.' },
    20: { ml1_titulo: 'Parcial ML Final de PF4', ml1_desc: 'Evaluación integral de ML Clásico: todo lo visto en 28 días.', ml2_titulo: 'Cierre de Punto Fijo 4', ml2_desc: 'Verificar badges de Google. Actualizar skills. Planificar Proyecto 2.' },
  };

  const topicIdx = Math.min(week * 2 + (dayOfWeek > 3 ? 1 : 0), Object.keys(mlTopics).length);
  const topic = mlTopics[Math.max(1, Math.min(topicIdx, 20))];

  return {
    ing_b1: `Technical English: ML Week ${week} vocabulary`,
    ing_b2: `Grammar: Advanced structures Week ${week}`,
    ing_b3: `Practice: ML concepts in English`,
    ml1_titulo: topic?.ml1_titulo || `ML Avanzado: Tema del día ${dayInPhase}`,
    ml1_desc: topic?.ml1_desc || 'Contenido de Machine Learning avanzado.',
    ml2_titulo: topic?.ml2_titulo || `ML Práctica: Ejercicio del día ${dayInPhase}`,
    ml2_desc: topic?.ml2_desc || 'Práctica de Machine Learning.',
  };
}

function getPF5Content(dayInPhase: number): DayContent {
  if (dayInPhase <= 7) {
    return {
      ing_b1: `Technical English: Project documentation Day ${dayInPhase}`, ing_b2: `Grammar: Academic writing Week ${Math.ceil(dayInPhase/7)}`, ing_b3: 'Practice: Writing project README',
      ml1_titulo: 'Proyecto 2: Diseño XGBoost Mantenimiento Predictivo', ml1_desc: `Día ${dayInPhase}: ${dayInPhase <= 2 ? 'Definir problema, dataset, métricas de éxito' : dayInPhase <= 4 ? 'EDA y Feature Engineering del dataset' : 'Implementar pipeline XGBoost con cross-validation'}`,
      ml2_titulo: 'Proyecto 2: Implementación', ml2_desc: `Día ${dayInPhase}: ${dayInPhase <= 2 ? 'Cargar y limpiar datos' : dayInPhase <= 4 ? 'Entrenar modelo base y evaluar' : 'Optimizar hiperparámetros'}`
    };
  } else if (dayInPhase <= 14) {
    return {
      ing_b1: `Technical English: Presentation skills`, ing_b2: `Grammar: Formal presentation language`, ing_b3: 'Practice: Project pitch in English',
      ml1_titulo: 'Proyecto 2: XGBoost Tuning y SHAP', ml1_desc: 'Optimización avanzada. SHAP values para explicabilidad. ROC-AUC y matrices de confusión.',
      ml2_titulo: 'Proyecto 2: Dashboard Streamlit', ml2_desc: `Día ${dayInPhase - 7}: ${dayInPhase <= 10 ? 'Crear app Streamlit básica con inputs' : dayInPhase <= 12 ? 'Agregar visualizaciones interactivas' : 'Deploy en share.streamlit.io'}`
    };
  }
  return {
    ing_b1: 'Technical English: Portfolio review', ing_b2: 'Grammar: Interview preparation', ing_b3: 'Practice: Mock technical interview',
    ml1_titulo: 'Proyecto 2: Finalización y deploy', ml1_desc: 'Pulir código, documentación. Deploy final en Streamlit Cloud.',
    ml2_titulo: 'Parcial Proyecto 2 + Cierre PF5', ml2_desc: 'Evaluación completa del proyecto. Verificar deploy. Actualizar GitHub.'
  };
}

function getPF6Content(dayInPhase: number): DayContent {
  const week = Math.ceil(dayInPhase / 7);
  if (week <= 4) {
    return {
      ing_b1: `English B2: Advanced ${week <= 2 ? 'reading comprehension' : 'writing skills'}`, ing_b2: `Grammar: ${week <= 2 ? 'Complex structures' : 'Error correction'}`, ing_b3: `Practice: ${week <= 2 ? 'Technical article analysis' : 'Essay writing'}`,
      ml1_titulo: `Proyecto 3: Clasificador Litológico Semana ${week}`, ml1_desc: week <= 2 ? 'Diseño del clasificador. Datos geológicos. Feature engineering para litología.' : 'Simulación Montecarlo P10/P50/P90. Distribuciones de probabilidad.',
      ml2_titulo: `Proyecto 3: Implementación Semana ${week}`, ml2_desc: week <= 2 ? 'Entrenar clasificador multi-clase. Métricas por clase. Confusion matrix.' : 'Integrar Montecarlo. Generar reportes P10/P50/P90. Visualización.'
    };
  } else if (week <= 8) {
    return {
      ing_b1: `English B2: ${week <= 6 ? 'Listening advanced' : 'Speaking fluency'}`, ing_b2: `Grammar: ${week <= 6 ? 'Reported speech & conditionals' : 'Formal register'}`, ing_b3: `Practice: ${week <= 6 ? 'TED talk analysis' : 'Debate preparation'}`,
      ml1_titulo: `Redes Neuronales: TensorFlow/Keras Semana ${week - 4}`, ml1_desc: week <= 6 ? 'Sequential API. Dense layers. Activation functions. Compile y fit.' : 'CNN para imágenes. Transfer learning. Fine-tuning.',
      ml2_titulo: `Deep Learning Práctica Semana ${week - 4}`, ml2_desc: week <= 6 ? 'Clasificación de dígitos MNIST. Evaluación. Kaggle notebook.' : 'Proyecto Kaggle con CNN. Submission. Leaderboard.'
    };
  } else if (week <= 12) {
    return {
      ing_b1: `English B2: ${week <= 10 ? 'Academic vocabulary' : 'Professional communication'}`, ing_b2: `Grammar: ${week <= 10 ? 'Subjunctive & hypothetical' : 'Idioms & collocations'}`, ing_b3: `Practice: ${week <= 10 ? 'Research paper reading' : 'Job interview simulation'}`,
      ml1_titulo: `Omdena Experience Semana ${week - 8}`, ml1_desc: 'Participar en proyecto real de Omdena. Colaboración en equipo. Git workflow.',
      ml2_titulo: `Portfolio Building Semana ${week - 8}`, ml2_desc: 'Actualizar portfolio. LinkedIn profile. GitHub README. Contribuciones open source.'
    };
  }
  return {
    ing_b1: 'English B2: Interview intensive', ing_b2: 'Grammar: Final review all structures', ing_b3: 'Practice: Full mock interview',
    ml1_titulo: `Simulacro de Entrevista Técnica #${Math.max(1, week - 12)}`, ml1_desc: 'Simulacro completo: coding + system design + ML theory + behavioral.',
    ml2_titulo: 'Preparación final para vacantes', ml2_desc: 'Revisar CV. Preparar cover letter. Identificar vacantes target SLB/remoto LATAM.'
  };
}

function getDayContent(dia: number): DayContent {
  if (dia <= 21) return getPF1Content(dia);
  if (dia <= 35) return getPF2Content(dia - 21);
  if (dia <= 49) return getPF3Content(dia - 35);
  if (dia <= 77) return getGenericMLContent(dia - 49, 28);
  if (dia <= 98) return getPF5Content(dia - 77);
  return getPF6Content(dia - 98);
}

export function generateAllStudyDays(): StudyDay[] {
  const days: StudyDay[] = [];

  for (let i = 1; i <= 199; i++) {
    const fecha = addDays(FECHA_INICIO, i - 1);
    const dayOfWeek = fecha.getDay(); // 0=Dom, 1=Lun... 6=Sab
    const content = getDayContent(i);
    const slb = SLB_ROTACION[dayOfWeek];

    days.push({
      dia_numero: i,
      fecha: formatDate(fecha),
      punto_fijo_fase: getPuntoFijo(i),
      completado_dia: false,
      ing_b1_titulo: content.ing_b1,
      ing_b1_estado: 'pendiente',
      ing_b2_titulo: content.ing_b2,
      ing_b2_estado: 'pendiente',
      ing_b3_titulo: content.ing_b3,
      ing_b3_estado: 'pendiente',
      ml_parte1_titulo: content.ml1_titulo,
      ml_parte1_desc: content.ml1_desc,
      ml_parte1_estado: 'pendiente',
      ml_parte2_titulo: content.ml2_titulo,
      ml_parte2_desc: content.ml2_desc,
      ml_parte2_estado: 'pendiente',
      slb_titulo: slb?.titulo || 'SLB: Práctica General',
      slb_desc: slb?.desc || 'Revisar temas anteriores de SLB.',
      slb_estado: 'pendiente',
      notas_dia: null,
    });
  }

  return days;
}

export function getCurrentDayNumber(): number {
  const today = new Date();
  const diffMs = today.getTime() - FECHA_INICIO.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, Math.min(diffDays, 199));
}

export function isEnglishClassDay(fecha: string): { isClass: boolean; horario?: string } {
  const date = new Date(fecha + 'T12:00:00');
  const day = date.getDay();
  if (day === 2) return { isClass: true, horario: 'Martes 2:00 PM - 4:00 PM (Salida 12:00 PM)' };
  if (day === 5) return { isClass: true, horario: 'Viernes 10:30 AM - 12:30 PM (Salida 8:30 AM)' };
  return { isClass: false };
}

export function getEnglishClassAlerts(days: StudyDay[]): { dia: StudyDay; horario: string; hoursUntil: number }[] {
  const now = new Date();
  const alerts: { dia: StudyDay; horario: string; hoursUntil: number }[] = [];

  for (const day of days) {
    const classInfo = isEnglishClassDay(day.fecha);
    if (classInfo.isClass && classInfo.horario) {
      const classDate = new Date(day.fecha + 'T12:00:00');
      const hoursUntil = (classDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      if (hoursUntil > 0 && hoursUntil <= 24) {
        alerts.push({ dia: day, horario: classInfo.horario, hoursUntil });
      }
    }
  }
  return alerts;
}
