'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  FileCode2,
  Upload,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  BookOpen,
  GraduationCap,
  Sparkles,
  X,
  FileText,
} from 'lucide-react';
import type { CategoriaEval, GeminiEvalResult } from '@/lib/types';
import { evaluarEntrega, generarEjercicio, isGeminiConfigured } from '@/lib/gemini';
import { saveEvalResult, addXP } from '@/lib/supabase';

type ExerciseMode = 'diario' | 'parcial';

interface UploadedFile {
  name: string;
  content: string;
  type: string;
}

const CATEGORIAS: { value: CategoriaEval; label: string; icon: string }[] = [
  { value: 'Python/Pandas', label: 'Python / Pandas', icon: '🐍' },
  { value: 'SQL/BI', label: 'SQL / BI', icon: '🗄️' },
  { value: 'Machine Learning', label: 'Machine Learning', icon: '🤖' },
];

function extractNotebookCode(raw: string): string {
  try {
    const nb = JSON.parse(raw);
    const cells: Array<{ cell_type: string; source: string[] }> = nb.cells || [];
    return cells
      .filter((c) => c.cell_type === 'code')
      .map((c) => (Array.isArray(c.source) ? c.source.join('') : String(c.source)))
      .join('\n\n');
  } catch {
    return raw;
  }
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error(`Error reading ${file.name}`));
    reader.readAsText(file);
  });
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 90
      ? 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10'
      : score >= 70
        ? 'text-cyan-400 border-cyan-500/50 bg-cyan-500/10'
        : score >= 50
          ? 'text-amber-400 border-amber-500/50 bg-amber-500/10'
          : 'text-red-400 border-red-500/50 bg-red-500/10';

  return (
    <div className={`inline-flex items-center justify-center w-24 h-24 rounded-2xl border-2 ${color}`}>
      <span className="text-4xl font-black">{score}</span>
    </div>
  );
}

function VeredictoBadge({ veredicto }: { veredicto: string }) {
  const lower = veredicto.toLowerCase();
  let colorClass = 'text-slate-300 bg-slate-700/50';
  if (lower.includes('excelente') || lower.includes('aprobado') || lower.includes('dominado')) {
    colorClass = 'text-emerald-300 bg-emerald-500/20 border border-emerald-500/30';
  } else if (lower.includes('bien') || lower.includes('bueno') || lower.includes('competente')) {
    colorClass = 'text-cyan-300 bg-cyan-500/20 border border-cyan-500/30';
  } else if (lower.includes('regular') || lower.includes('mejorar') || lower.includes('reforzar')) {
    colorClass = 'text-amber-300 bg-amber-500/20 border border-amber-500/30';
  } else if (lower.includes('insuficiente') || lower.includes('reprobado') || lower.includes('débil')) {
    colorClass = 'text-red-300 bg-red-500/20 border border-red-500/30';
  }

  return (
    <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold ${colorClass}`}>
      {veredicto}
    </span>
  );
}

export default function ExerciseTab() {
  const [categoria, setCategoria] = useState<CategoriaEval>('Python/Pandas');
  const [mode, setMode] = useState<ExerciseMode>('diario');
  const [exerciseText, setExerciseText] = useState<string>('');
  const [codeAnswer, setCodeAnswer] = useState<string>('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [result, setResult] = useState<GeminiEvalResult | null>(null);
  const [loading, setLoading] = useState<'generate' | 'evaluate' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerateExercise = useCallback(async () => {
    setLoading('generate');
    setError(null);
    setResult(null);
    setCodeAnswer('');
    setUploadedFiles([]);
    try {
      const tipo = mode === 'parcial' ? 'parcial' : 'ejercicio';
      const exercise = await generarEjercicio(categoria, tipo);
      setExerciseText(exercise);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar ejercicio');
    } finally {
      setLoading(null);
    }
  }, [categoria, mode]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles: UploadedFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        let content = await readFileAsText(file);
        if (file.name.endsWith('.ipynb')) {
          content = extractNotebookCode(content);
        }
        newFiles.push({ name: file.name, content, type: file.type });
      } catch {
        setError(`Error leyendo archivo: ${file.name}`);
      }
    }
    setUploadedFiles((prev) => [...prev, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const removeFile = useCallback((index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleEvaluate = useCallback(async () => {
    setLoading('evaluate');
    setError(null);
    try {
      const allCode = [
        codeAnswer,
        ...uploadedFiles.map((f) => `// --- ${f.name} ---\n${f.content}`),
      ]
        .filter(Boolean)
        .join('\n\n');

      if (!allCode.trim()) {
        setError('Escribe o sube tu solución antes de evaluar.');
        setLoading(null);
        return;
      }

      const evalResult = await evaluarEntrega(
        categoria,
        exerciseText,
        allCode,
        mode === 'parcial' ? 'parcial_codigo' : 'ejercicio_diario'
      );
      setResult(evalResult);

      await saveEvalResult(
        1,
        mode === 'parcial' ? 'parcial_codigo' : 'ejercicio_diario',
        categoria,
        exerciseText,
        allCode,
        evalResult,
        uploadedFiles.length > 0 ? uploadedFiles[0].name : undefined
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al evaluar entrega');
    } finally {
      setLoading(null);
    }
  }, [codeAnswer, uploadedFiles, exerciseText, categoria, mode]);

  const handleReset = useCallback(() => {
    setExerciseText('');
    setCodeAnswer('');
    setUploadedFiles([]);
    setResult(null);
    setError(null);
  }, []);

  const geminiReady = isGeminiConfigured();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
          <FileCode2 className="w-6 h-6 text-cyan-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Ejercicios Diarios y Parciales de Código</h2>
          <p className="text-sm text-slate-400">Practica, entrega y recibe evaluación con IA</p>
        </div>
      </div>

      {/* Mode + Category Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mode selector */}
        <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-4">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Tipo de Evaluación
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setMode('diario')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === 'diario'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-800/60 text-slate-400 border border-slate-700 hover:bg-slate-800 hover:text-slate-300'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Ejercicio del Día
            </button>
            <button
              onClick={() => setMode('parcial')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === 'parcial'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-slate-800/60 text-slate-400 border border-slate-700 hover:bg-slate-800 hover:text-slate-300'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              Parcial Semanal
            </button>
          </div>
        </div>

        {/* Category selector */}
        <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-4">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Categoría
          </label>
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value as CategoriaEval)}
            className="w-full bg-slate-800/80 border border-slate-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 appearance-none cursor-pointer"
          >
            {CATEGORIAS.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.icon} {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Generate Button */}
      {!exerciseText && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <button
            onClick={handleGenerateExercise}
            disabled={loading === 'generate' || !geminiReady}
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-all shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30"
          >
            {loading === 'generate' ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generando {mode === 'parcial' ? 'parcial' : 'ejercicio'}…
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                {mode === 'parcial'
                  ? 'Rendir Parcial de Código de la Semana'
                  : 'Generar Ejercicio del Día'}
              </>
            )}
          </button>
          {!geminiReady && (
            <p className="text-xs text-amber-400 mt-2 text-center">
              ⚠️ Configura tu API Key de Gemini para usar esta función
            </p>
          )}
        </motion.div>
      )}

      {/* Exercise Display */}
      <AnimatePresence mode="wait">
        {exerciseText && (
          <motion.div
            key="exercise"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-slate-900/90 rounded-xl border border-slate-800 overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-800/40">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-semibold text-white">
                  {mode === 'parcial' ? '📝 Parcial Semanal' : '📋 Ejercicio del Día'} — {categoria}
                </span>
              </div>
              {result && (
                <button
                  onClick={handleReset}
                  className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Cerrar
                </button>
              )}
            </div>
            <div className="p-5">
              <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap text-slate-300 leading-relaxed">
                {exerciseText}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Code Input Area */}
      {exerciseText && !result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Code textarea */}
          <div className="bg-slate-900/90 rounded-xl border border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-800/40">
              <span className="text-sm font-medium text-slate-300">Tu Solución</span>
              <span className="text-xs text-slate-500">
                {codeAnswer.split('\n').length} líneas
              </span>
            </div>
            <textarea
              value={codeAnswer}
              onChange={(e) => setCodeAnswer(e.target.value)}
              placeholder="Escribe tu código aquí..."
              rows={16}
              className="w-full bg-slate-950 text-emerald-300 placeholder-slate-600 font-mono text-sm p-5 focus:outline-none resize-y min-h-[200px] leading-relaxed"
              spellCheck={false}
            />
          </div>

          {/* File upload */}
          <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-300">Archivos adjuntos</span>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg border border-slate-700 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                Subir archivos
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".py,.ipynb,.sql,.csv,.txt"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {uploadedFiles.length > 0 ? (
              <div className="space-y-2">
                {uploadedFiles.map((file, idx) => (
                  <div
                    key={`${file.name}-${idx}`}
                    className="flex items-center justify-between px-3 py-2 bg-slate-800/60 rounded-lg border border-slate-700/50"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-cyan-400" />
                      <span className="text-sm text-slate-300">{file.name}</span>
                      <span className="text-xs text-slate-500">
                        ({(file.content.length / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <button
                      onClick={() => removeFile(idx)}
                      className="p-1 hover:bg-slate-700 rounded transition-colors"
                    >
                      <X className="w-3.5 h-3.5 text-slate-500 hover:text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-2">
                Acepta: .py, .ipynb, .sql, .csv, .txt — Los notebooks (.ipynb) se parsean automáticamente
              </p>
            )}
          </div>

          {/* Evaluate button */}
          <button
            onClick={handleEvaluate}
            disabled={loading === 'evaluate' || (!codeAnswer.trim() && uploadedFiles.length === 0)}
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
          >
            {loading === 'evaluate' ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Evaluando con IA…
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Evaluar Entrega
              </>
            )}
          </button>
        </motion.div>
      )}

      {/* Error display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3"
          >
            <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-300">Error</p>
              <p className="text-xs text-red-400/80 mt-1">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result Display */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Score + Verdict */}
            <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <ScoreBadge score={result.puntaje} />
                <div className="text-center sm:text-left space-y-2">
                  <VeredictoBadge veredicto={result.veredicto} />
                  <p className="text-sm text-slate-400">
                    {mode === 'parcial' ? 'Parcial Semanal' : 'Ejercicio Diario'} — {categoria}
                  </p>
                </div>
              </div>
            </div>

            {/* Aciertos */}
            {result.lo_que_estuvo_bien && result.lo_que_estuvo_bien.length > 0 && (
              <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-semibold text-emerald-300">Aciertos</h3>
                </div>
                <ul className="space-y-2">
                  {result.lo_que_estuvo_bien.map((item: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-emerald-200/80">
                      <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Errores */}
            {result.errores_criticos && result.errores_criticos.length > 0 && (
              <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <XCircle className="w-4 h-4 text-red-400" />
                  <h3 className="text-sm font-semibold text-red-300">Errores</h3>
                </div>
                <ul className="space-y-2">
                  {result.errores_criticos.map((item: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-red-200/80">
                      <span className="text-red-500 mt-0.5 shrink-0">✗</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Temas a reforzar */}
            {result.temas_a_reforzar && result.temas_a_reforzar.length > 0 && (
              <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-semibold text-amber-300">Temas a Reforzar</h3>
                </div>
                <ul className="space-y-2">
                  {result.temas_a_reforzar.map((item: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-amber-200/80">
                      <span className="text-amber-500 mt-0.5 shrink-0">⚠</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Solution explanation */}
            {result.solucion_optima_explicada && (
              <div className="bg-slate-900/90 rounded-xl border border-slate-800 overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-800 bg-slate-800/40">
                  <BookOpen className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm font-semibold text-blue-300">Solución Explicada</h3>
                </div>
                <div className="p-5">
                  <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap text-slate-300 leading-relaxed">
                    {result.solucion_optima_explicada}
                  </div>
                </div>
              </div>
            )}

            {/* Reset / new exercise buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setResult(null);
                  setCodeAnswer('');
                  setUploadedFiles([]);
                }}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium py-3 px-5 rounded-xl border border-slate-700 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Subir nueva versión corregida
              </button>
              <button
                onClick={handleReset}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium py-3 px-5 rounded-xl transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Pedir otro ejercicio
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
