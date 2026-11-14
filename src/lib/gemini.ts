'use client';

import { GoogleGenerativeAI, GenerativeModel, Part } from '@google/generative-ai';
import type { GeminiEvalResult, CategoriaEval, UserStats, DeudaTecnica } from './types';
import { CURSOS_RESPALDO } from './types';

let genAI: GoogleGenerativeAI | null = null;
let model: GenerativeModel | null = null;

function getApiKey(): string | null {
  const envKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (envKey) return envKey;
  if (typeof window !== 'undefined') {
    return localStorage.getItem('jmh_gemini_key');
  }
  return null;
}

function getModel(): GenerativeModel | null {
  const key = getApiKey();
  if (!key) return null;
  if (!genAI || !model) {
    genAI = new GoogleGenerativeAI(key);
    model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  }
  return model;
}

export function isGeminiConfigured(): boolean {
  return getApiKey() !== null;
}

export function resetGeminiClient(): void {
  genAI = null;
  model = null;
}

// ==================== EVALUADOR TÉCNICO ESTRICTO ====================

const SYSTEM_PROMPT_EVALUADOR = `Eres un Evaluador Técnico Senior de Schlumberger (SLB) y Líder de Ciencia de Datos con 15 años de experiencia en la industria petrolera y tech.
Tu estudiante es Jesús Chacón, ingeniero en formación que se prepara intensivamente para conseguir un puesto en SLB o como Data/ML Engineer remoto en LATAM para 2027.

REGLAS ESTRICTAS DE EVALUACIÓN:
1. NO seas complaciente. Si el código usa ciclos for lentos cuando debía usar vectorización en Pandas, señálalo SIN rodeos.
2. Si la consulta SQL es ineficiente o no usa CTEs/Window Functions cuando corresponde, marca error crítico.
3. En problemas SLB: si confunde TVD con MD, diámetro interno con espesor (ID = OD - 2t), o no conoce la fórmula de presión hidrostática (P = 0.052 × MW × TVD), es error grave.
4. En Machine Learning: data leakage, no usar pipelines, no reportar métricas correctas (Precision, Recall, F1, ROC-AUC) son errores críticos.
5. Evalúa tanto la corrección como la eficiencia y las buenas prácticas industriales.

DEBES responder SIEMPRE en formato JSON válido con esta estructura exacta:
{
  "puntaje": <número 0-100>,
  "veredicto": "<APROBADO CON EXCELENCIA | APROBADO CON OBSERVACIONES | REPROBADO - DEUDA TÉCNICA>",
  "lo_que_estuvo_bien": ["item1", "item2"],
  "errores_criticos": ["error1", "error2"],
  "temas_a_reforzar": ["tema1", "tema2"],
  "solucion_optima_explicada": "Explicación detallada con código/fórmula correcta",
  "xp_cambio": <+100 si puntaje>=85, +35 si 70-84, -25 si <70>
}

REGLAS DE PUNTAJE:
- 90-100: APROBADO CON EXCELENCIA (código/respuesta impecable, eficiente, con buenas prácticas)
- 70-89: APROBADO CON OBSERVACIONES (funcional pero con áreas de mejora)
- 0-69: REPROBADO - DEUDA TÉCNICA (errores graves que demuestran falta de comprensión)`;

export async function evaluarEntrega(
  categoria: CategoriaEval,
  enunciado: string,
  entrega: string,
  tipo: 'ejercicio_diario' | 'parcial_codigo' | 'simulacro_slb' | 'practica_ingles'
): Promise<GeminiEvalResult> {
  const m = getModel();
  if (!m) throw new Error('Gemini no está configurado. Agrega tu API Key.');

  const prompt = `${SYSTEM_PROMPT_EVALUADOR}

TIPO DE EVALUACIÓN: ${tipo}
CATEGORÍA: ${categoria}
ENUNCIADO/RETO:
${enunciado}

ENTREGA DEL ESTUDIANTE JESÚS:
${entrega}

Evalúa rigurosamente. Responde SOLO el JSON, sin markdown ni texto adicional.`;

  const result = await m.generateContent(prompt);
  const text = result.response.text();
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try {
    const parsed = JSON.parse(cleaned) as GeminiEvalResult;
    if (parsed.puntaje >= 85) parsed.xp_cambio = 100;
    else if (parsed.puntaje >= 70) parsed.xp_cambio = 35;
    else parsed.xp_cambio = -25;

    if (parsed.puntaje >= 90) parsed.veredicto = 'APROBADO CON EXCELENCIA';
    else if (parsed.puntaje >= 70) parsed.veredicto = 'APROBADO CON OBSERVACIONES';
    else parsed.veredicto = 'REPROBADO - DEUDA TÉCNICA';

    return parsed;
  } catch {
    return {
      puntaje: 0,
      veredicto: 'REPROBADO - DEUDA TÉCNICA',
      lo_que_estuvo_bien: [],
      errores_criticos: ['Error al parsear la respuesta del evaluador'],
      temas_a_reforzar: [categoria],
      solucion_optima_explicada: text,
      xp_cambio: -25,
    };
  }
}

// ==================== EVALUADOR CON VISIÓN (para fotos de cálculos) ====================

export async function evaluarConImagen(
  categoria: CategoriaEval,
  enunciado: string,
  imageBase64: string,
  mimeType: string
): Promise<GeminiEvalResult> {
  const m = getModel();
  if (!m) throw new Error('Gemini no está configurado.');

  const imagePart: Part = {
    inlineData: { data: imageBase64, mimeType },
  };

  const prompt = `${SYSTEM_PROMPT_EVALUADOR}

TIPO DE EVALUACIÓN: simulacro_slb
CATEGORÍA: ${categoria}
ENUNCIADO/RETO:
${enunciado}

El estudiante Jesús ha subido una FOTO de sus cálculos hechos a mano en su cuaderno.
Analiza el procedimiento paso a paso visible en la imagen.
Verifica si las fórmulas, operaciones y resultado final son correctos.
Responde SOLO el JSON, sin markdown ni texto adicional.`;

  const result = await m.generateContent([prompt, imagePart]);
  const text = result.response.text();
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try {
    const parsed = JSON.parse(cleaned) as GeminiEvalResult;
    if (parsed.puntaje >= 85) parsed.xp_cambio = 100;
    else if (parsed.puntaje >= 70) parsed.xp_cambio = 35;
    else parsed.xp_cambio = -25;
    return parsed;
  } catch {
    return {
      puntaje: 0,
      veredicto: 'REPROBADO - DEUDA TÉCNICA',
      lo_que_estuvo_bien: [],
      errores_criticos: ['Error al analizar la imagen'],
      temas_a_reforzar: [categoria],
      solucion_optima_explicada: text,
      xp_cambio: -25,
    };
  }
}

// ==================== GENERADOR DE EJERCICIOS ====================

export async function generarEjercicio(
  categoria: CategoriaEval,
  nivel: string,
  contexto?: string
): Promise<string> {
  const m = getModel();
  if (!m) throw new Error('Gemini no está configurado.');

  const prompt = `Eres un instructor técnico de ${categoria} generando un ejercicio para Jesús Chacón, estudiante de ingeniería preparándose para SLB y Data/ML Engineering.

NIVEL ACTUAL: ${nivel}
${contexto ? `CONTEXTO ADICIONAL: ${contexto}` : ''}

Genera UN ejercicio práctico de dificultad progresiva. El ejercicio debe:
1. Tener un enunciado claro y completo
2. Incluir datos de ejemplo si aplica (datasets ficticios pero realistas)
3. Especificar exactamente qué debe entregar Jesús
4. Para código: especificar que debe usar las mejores prácticas (vectorización en Pandas, CTEs en SQL, pipelines en ML)
5. Para SLB: incluir datos numéricos reales de la industria petrolera

Responde SOLO el enunciado del ejercicio, listo para que Jesús lo resuelva.`;

  const result = await m.generateContent(prompt);
  return result.response.text();
}

// ==================== GENERADOR DE PROBLEMAS SLB ====================

export async function generarProblemaSLB(
  subtema: string,
  modoExamen: boolean
): Promise<string> {
  const m = getModel();
  if (!m) throw new Error('Gemini no está configurado.');

  const prompt = `Eres un instructor de Schlumberger (SLB) creando un problema de evaluación técnica.
SUBTEMA: ${subtema}
MODO: ${modoExamen ? 'EXAMEN SHL VERIFY (respuesta rápida, una sola respuesta correcta, formato opción múltiple A/B/C/D)' : 'PRÁCTICA (problema abierto detallado con datos para resolver paso a paso)'}

Genera el problema con datos numéricos realistas de la industria petrolera/mecánica.
Para tuberías: usa valores reales de OD (ej: 9-5/8", 7", 5-1/2") y espesores.
Para hidrostática: usa densidades de lodo reales (ppg) y profundidades TVD reales.
Para engranajes: usa números de dientes realistas.
Para circuitos: usa valores de resistencia y voltaje prácticos.

${modoExamen ? 'Formato: Pregunta + 4 opciones (A, B, C, D) + indica cuál es la correcta al final marcada como [RESPUESTA: X]' : 'Formato: Enunciado completo con todos los datos necesarios para resolver.'}`;

  const result = await m.generateContent(prompt);
  return result.response.text();
}

// ==================== MENSAJE EMOTIVO MOTIVADOR ====================

export async function generarMensajeMotivador(
  progreso: number,
  xp: number,
  rango: string,
  racha: number
): Promise<string> {
  const m = getModel();
  if (!m) return `¡Vas al ${progreso.toFixed(1)}%, Jesús! Cada bloque te acerca a tu meta. 💪`;

  const prompt = `Eres el mentor personal de Jesús Chacón, un joven ingeniero venezolano que está en una ruta intensiva de 199 días para conseguir un puesto en Schlumberger (SLB) o como Data/ML Engineer remoto en LATAM.

DATOS ACTUALES:
- Progreso: ${progreso.toFixed(1)}%
- XP Total: ${xp}
- Rango: ${rango}
- Racha de días: ${racha}

Genera un mensaje emotivo, realista y motivador en español (máximo 3 oraciones).
- Recuérdale que cada bloque dominado lo aleja del desempleo y lo acerca a su vacante soñada.
- Sé empático con su situación (Venezuela, búsqueda de estabilidad económica).
- Usa un tono entre coach deportivo y mentor técnico.
- NO uses emojis excesivos (máximo 2).
- Si el progreso es bajo (<10%), anímalo a no rendirse.
- Si está por encima del 50%, felicítalo por la disciplina.
- Si la racha es alta (>7 días), destaca su constancia.`;

  const result = await m.generateContent(prompt);
  return result.response.text();
}

// ==================== PANEL DE RESCATE (No Entendí) ====================

export async function explicarTema(
  tema: string,
  categoria: string,
  contexto?: string
): Promise<string> {
  const m = getModel();
  if (!m) throw new Error('Gemini no está configurado.');

  const cursos = CURSOS_RESPALDO[categoria];
  const cursosTexto = cursos ? cursos.opciones.join('\n') : 'Sin cursos de respaldo específicos';

  const prompt = `Jesús Chacón marcó "No entendí" en el siguiente tema. Actúa como su tutor personal y explícale TODO paso a paso.

TEMA: ${tema}
CATEGORÍA: ${categoria}
${contexto ? `CONTEXTO: ${contexto}` : ''}

INSTRUCCIONES:
1. Explica el concepto desde cero, como si Jesús nunca lo hubiera visto.
2. Usa ejemplos con código Python/SQL real si es de datos, o con fórmulas y números si es SLB.
3. Incluye un ejemplo resuelto completo.
4. Al final, indica en qué sección de sus cursos de respaldo puede reforzar:

CURSOS DE RESPALDO DE JESÚS:
${cursosTexto}

Sé claro, directo y práctico. Jesús necesita ENTENDER, no memorizar.`;

  const result = await m.generateContent(prompt);
  return result.response.text();
}

// ==================== CHAT CONTEXTUAL ====================

export async function chatConMentor(
  mensajeUsuario: string,
  stats: UserStats | null,
  deudas: DeudaTecnica[],
  diaActual: number
): Promise<string> {
  const m = getModel();
  if (!m) throw new Error('Gemini no está configurado.');

  const deudasPendientes = deudas.filter(d => !d.resuelto).map(d => `- ${d.categoria}: ${d.tema}`).join('\n');

  const prompt = `Eres el Mentor IA personal de Jesús Chacón en su ruta de 199 días hacia SLB y Data/ML Engineering.

CONTEXTO ACTUAL DE JESÚS:
- Día actual del calendario: ${diaActual} de 199
- XP Total: ${stats?.xp_total || 0}
- Rango: ${stats?.rango_actual || 'Sin rango'}
- Promedio de parciales: ${stats?.promedio_general || 0}/100
- Progreso: ${stats?.progreso_porcentaje || 0}%
- Skills: Python/Pandas ${stats?.skill_python_pandas || 0}/100, SQL/BI ${stats?.skill_sql_bi || 0}/100, ML ${stats?.skill_ml_xgboost || 0}/100, SLB ${stats?.skill_slb_tecnico || 0}/100, Inglés ${stats?.skill_ingles_b2 || 0}/100
${deudasPendientes ? `\nDEUDA TÉCNICA PENDIENTE:\n${deudasPendientes}` : '\nSin deuda técnica pendiente.'}

MENSAJE DE JESÚS:
${mensajeUsuario}

Responde como mentor técnico experto. Si pregunta algo de código, da ejemplos reales. Si pregunta sobre SLB, usa fórmulas y datos reales de la industria. Sé directo y útil.`;

  const result = await m.generateContent(prompt);
  return result.response.text();
}
