'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Timer,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lightbulb,
  Camera,
  Upload,
  Send,
  Loader2,
  HelpCircle,
  Zap,
  Gauge,
  Flame,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { generarProblemaSLB, evaluarEntrega, evaluarConImagen, isGeminiConfigured } from '@/lib/gemini';
import { saveEvalResult } from '@/lib/supabase';
import type { GeminiEvalResult } from '@/lib/types';

const SLB_SUBTEMAS = [
  { id: 'tuberias', nombre: 'Tuberías & Fracciones de Pulgada (ID = OD - 2t)', formula: 'ID = OD - 2t' },
  { id: 'engranajes', nombre: 'Trenes de Engranajes, Idler Gear & Correas en 8', formula: 'Ratio = N1/N2 = D1/D2' },
  { id: 'shl_tablas', nombre: 'Tablas Numéricas y Financieras SHL Verify', formula: 'Análisis Rápido sin Calculadora' },
  { id: 'poleas', nombre: 'Poleas (T = W/N), Palancas & Rampas', formula: 'T = W / N' },
  { id: 'circuitos', nombre: 'Circuitos Eléctricos, Ley de Ohm & Joule', formula: 'V = IR | Q = I²Rt' },
  { id: 'hidrostatica', nombre: 'Presión Hidrostática, Pascal & Caudales', formula: 'P = 0.052 × MW × TVD' },
  { id: 'simulacro_semanal', nombre: 'Simulacro Semanal Completo SLB', formula: 'Multitema Técnico' },
];

export default function SLBTrainer() {
  const [subtema, setSubtema] = useState(SLB_SUBTEMAS[0].id);
  const [modoExamen, setModoExamen] = useState(false);
  const [duracionTipo, setDuracionTipo] = useState<'90s' | '20m'>('90s');
  const [tiempoRestante, setTiempoRestante] = useState<number>(90);
  const [timerActivo, setTimerActivo] = useState(false);

  const [enunciado, setEnunciado] = useState('');
  const [respuestaTexto, setRespuestaTexto] = useState('');
  const [imagenBase64, setImagenBase64] = useState<string | null>(null);
  const [imagenMime, setImagenMime] = useState<string>('image/jpeg');
  const [imagenPreview, setImagenPreview] = useState<string | null>(null);

  const [generando, setGenerando] = useState(false);
  const [evaluando, setEvaluando] = useState(false);
  const [resultado, setResultado] = useState<GeminiEvalResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerActivo && tiempoRestante > 0) {
      interval = setInterval(() => {
        setTiempoRestante((prev) => {
          if (prev <= 1) {
            setTimerActivo(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActivo, tiempoRestante]);

  const handleIniciarTimer = (duracion: '90s' | '20m') => {
    setDuracionTipo(duracion);
    const secs = duracion === '90s' ? 90 : 20 * 60;
    setTiempoRestante(secs);
    setTimerActivo(true);
  };

  const handlePausarTimer = () => {
    setTimerActivo(!timerActivo);
  };

  const handleReiniciarTimer = () => {
    setTimerActivo(false);
    setTiempoRestante(duracionTipo === '90s' ? 90 : 20 * 60);
  };

  const formatTiempo = (segundos: number) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleGenerarProblema = async () => {
    if (!isGeminiConfigured()) {
      setErrorMsg('Configura tu API Key de Gemini en Configuración para generar problemas.');
      return;
    }
    setErrorMsg(null);
    setGenerando(true);
    setResultado(null);
    setRespuestaTexto('');
    setImagenBase64(null);
    setImagenPreview(null);

    const subtemaObj = SLB_SUBTEMAS.find((s) => s.id === subtema);
    const subtemaStr = subtemaObj ? `${subtemaObj.nombre} (${subtemaObj.formula})` : subtema;

    try {
      const problema = await generarProblemaSLB(subtemaStr, modoExamen);
      setEnunciado(problema);
      if (modoExamen) {
        handleIniciarTimer(subtema === 'simulacro_semanal' ? '20m' : '90s');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al generar el problema con Gemini.');
    } finally {
      setGenerando(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Por favor selecciona un archivo de imagen válido (.png, .jpg, .jpeg)');
      return;
    }

    setImagenMime(file.type);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImagenPreview(result);
      const base64Data = result.split(',')[1];
      setImagenBase64(base64Data);
    };
    reader.readAsDataURL(file);
  };

  const handleEvaluar = async () => {
    if (!enunciado) {
      setErrorMsg('Primero genera un problema para evaluar.');
      return;
    }
    if (!respuestaTexto && !imagenBase64) {
      setErrorMsg('Escribe tu respuesta o sube una foto de tu cuaderno con los cálculos.');
      return;
    }

    setEvaluando(true);
    setErrorMsg(null);
    setTimerActivo(false);

    try {
      let res: GeminiEvalResult;
      if (imagenBase64) {
        res = await evaluarConImagen('SLB Técnico', enunciado, imagenBase64, imagenMime);
      } else {
        res = await evaluarEntrega(
          'SLB Técnico',
          enunciado,
          respuestaTexto,
          modoExamen ? 'simulacro_slb' : 'ejercicio_diario'
        );
      }

      setResultado(res);

      await saveEvalResult(
        1,
        modoExamen ? 'simulacro_slb' : 'ejercicio_diario',
        'SLB Técnico',
        enunciado,
        respuestaTexto || '[Foto del cuaderno adjunta]',
        res,
        imagenBase64 ? 'foto_cuaderno.jpg' : undefined
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al evaluar con la IA de SLB.');
    } finally {
      setEvaluando(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Zap className="w-4 h-4" />
              Entrenador Industrial Schlumberger (SLB)
            </div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              Simulador SHL Verify & Práctica de Campo
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Preparación estricta para evaluación técnica en sitio: Tuberías, Engranajes, Poleas, Hidrostática y Circuitos.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                setModoExamen(false);
                setTimerActivo(false);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                !modoExamen
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              🟢 Modo Práctica (Sin Reloj)
            </button>
            <button
              onClick={() => {
                setModoExamen(true);
                setTiempoRestante(subtema === 'simulacro_semanal' ? 1200 : 90);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                modoExamen
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              🔴 Modo Examen SHL (Con Reloj)
            </button>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-800/80">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Área Técnica / Tema de Rotación:
            </label>
            <select
              value={subtema}
              onChange={(e) => setSubtema(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
            >
              {SLB_SUBTEMAS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleGenerarProblema}
              disabled={generando}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-medium py-2.5 px-4 rounded-xl text-sm transition-all shadow-lg shadow-cyan-900/20"
            >
              {generando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generando Problema...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  Generar Problema Técnico
                </>
              )}
            </button>
          </div>
        </div>

        {/* Countdown Timer Display (if Modo Examen) */}
        {modoExamen && (
          <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-red-900/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-lg ${
                  tiempoRestante <= 15 ? 'bg-red-500/20 text-red-400 animate-bounce' : 'bg-slate-800 text-slate-300'
                }`}
              >
                <Timer className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                  Cronómetro SHL Verify
                </div>
                <div
                  className={`text-2xl font-mono font-bold ${
                    tiempoRestante <= 15 ? 'text-red-400' : 'text-white'
                  }`}
                >
                  {formatTiempo(tiempoRestante)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePausarTimer}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition-colors"
              >
                {timerActivo ? 'Pausar' : 'Reanudar'}
              </button>
              <button
                onClick={handleReiniciarTimer}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Reiniciar reloj"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Workspace: Problem Statement & Solution Input */}
      {enunciado && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Problem statement & Technical Context */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <Gauge className="w-4 h-4" />
                  Enunciado del Problema
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {modoExamen ? 'SHL Verify Format' : 'Problema de Campo'}
                </span>
              </div>
              <div className="prose prose-invert max-w-none text-slate-200 text-sm whitespace-pre-wrap leading-relaxed font-sans bg-slate-950 p-4 rounded-xl border border-slate-800/80 max-h-[460px] overflow-y-auto">
                {enunciado}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
              <span>Fórmulas clave aplicables según el subtema seleccionado</span>
              <span className="text-cyan-400 font-mono">
                {SLB_SUBTEMAS.find((s) => s.id === subtema)?.formula}
              </span>
            </div>
          </div>

          {/* Right: Answer Submission (Text or Image of Notebook) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Send className="w-4 h-4 text-cyan-400" />
                  Tu Solución / Procedimiento
                </span>
                <span className="text-xs text-slate-400">
                  Texto o Foto de Cuaderno
                </span>
              </div>

              {/* Text answer input */}
              <textarea
                value={respuestaTexto}
                onChange={(e) => setRespuestaTexto(e.target.value)}
                placeholder="Escribe tu respuesta final, opciones seleccionadas (A, B, C, D) o el desglose paso a paso de tus cálculos..."
                rows={6}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors font-mono resize-none"
              />

              {/* Notebook Image Upload */}
              <div className="mt-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/png,image/jpeg,image/jpg"
                  className="hidden"
                />

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
                  >
                    <Camera className="w-4 h-4 text-cyan-400" />
                    {imagenPreview ? 'Cambiar Foto del Cuaderno' : 'Subir Foto de Cuaderno (Visión IA)'}
                  </button>

                  {imagenPreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setImagenPreview(null);
                        setImagenBase64(null);
                      }}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Quitar foto
                    </button>
                  )}
                </div>

                {imagenPreview && (
                  <div className="mt-3 relative rounded-xl overflow-hidden border border-cyan-500/30 max-h-40 w-fit">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagenPreview}
                      alt="Cálculos en cuaderno"
                      className="h-40 object-contain rounded-xl"
                    />
                    <div className="absolute top-2 right-2 bg-slate-950/80 px-2 py-0.5 rounded text-[10px] text-cyan-400 font-medium">
                      Listo para Gemini Visión
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-slate-800/80">
              <button
                onClick={handleEvaluar}
                disabled={evaluando}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 disabled:opacity-50 text-white font-medium py-3 px-6 rounded-xl text-sm transition-all shadow-lg shadow-emerald-950/40"
              >
                {evaluando ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Evaluador Senior SLB Analizando...
                  </>
                ) : (
                  <>
                    <Award className="w-4 h-4" />
                    Enviar y Recibir Evaluación Rigurosa
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results Display */}
      <AnimatePresence>
        {resultado && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6"
          >
            {/* Header: Score & Verdict */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div className="flex items-center gap-4">
                <div
                  className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center border font-bold ${
                    resultado.puntaje >= 85
                      ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-400'
                      : resultado.puntaje >= 70
                      ? 'bg-amber-950/60 border-amber-500/50 text-amber-400'
                      : 'bg-red-950/60 border-red-500/50 text-red-400'
                  }`}
                >
                  <span className="text-3xl leading-none">{resultado.puntaje}</span>
                  <span className="text-[10px] text-slate-400 mt-1">/ 100</span>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                    Veredicto del Evaluador SLB
                  </div>
                  <h3
                    className={`text-xl font-bold mt-0.5 ${
                      resultado.puntaje >= 85
                        ? 'text-emerald-400'
                        : resultado.puntaje >= 70
                        ? 'text-amber-400'
                        : 'text-red-400'
                    }`}
                  >
                    {resultado.veredicto}
                  </h3>
                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-cyan-400" />
                    Impacto en Perfil:
                    <span
                      className={`font-semibold ${
                        resultado.xp_cambio > 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {resultado.xp_cambio > 0 ? `+${resultado.xp_cambio}` : resultado.xp_cambio} XP
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleGenerarProblema}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium py-2.5 px-4 rounded-xl border border-slate-700 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Siguiente Problema SLB
              </button>
            </div>

            {/* Detail lists */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Positives */}
              <div className="bg-slate-950/80 border border-emerald-900/40 rounded-xl p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Aciertos y Buenas Prácticas
                </div>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {resultado.lo_que_estuvo_bien.length > 0 ? (
                    resultado.lo_que_estuvo_bien.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-slate-500 italic">Sin aciertos destacados</li>
                  )}
                </ul>
              </div>

              {/* Critical Errors */}
              <div className="bg-slate-950/80 border border-red-900/40 rounded-xl p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">
                  <XCircle className="w-4 h-4" />
                  Errores Críticos Señalados
                </div>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {resultado.errores_criticos.length > 0 ? (
                    resultado.errores_criticos.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-red-400 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-slate-500 italic">Sin errores críticos detectados</li>
                  )}
                </ul>
              </div>

              {/* Topics to Reinforce */}
              <div className="bg-slate-950/80 border border-amber-900/40 rounded-xl p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  Temas a Reforzar (Deuda)
                </div>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {resultado.temas_a_reforzar.length > 0 ? (
                    resultado.temas_a_reforzar.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-slate-500 italic">¡Tema dominado con éxito!</li>
                  )}
                </ul>
              </div>
            </div>

            {/* Optimal Solution & Step-by-Step Explanation */}
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2">
                <Lightbulb className="w-4 h-4" />
                Solución Óptima y Procedimiento de Campo Explicado
              </div>
              <div className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-sans">
                {resultado.solucion_optima_explicada}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
