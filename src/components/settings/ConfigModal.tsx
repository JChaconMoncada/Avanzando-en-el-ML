'use client';

import { useState, useEffect } from 'react';
import { Settings, Eye, EyeOff, X, Trash2, CheckCircle2, XCircle, Save, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { isSupabaseConfigured, resetSupabaseClient, resetUserXP } from '@/lib/supabase';
import { isGeminiConfigured, resetGeminiClient } from '@/lib/gemini';

interface ConfigState {
  supabaseUrl: string;
  supabaseKey: string;
  geminiKey: string;
}

export default function ConfigModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<ConfigState>({
    supabaseUrl: '',
    supabaseKey: '',
    geminiKey: '',
  });
  const [showSupabaseKey, setShowSupabaseKey] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [supabaseStatus, setSupabaseStatus] = useState(false);
  const [geminiStatus, setGeminiStatus] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConfig({
        supabaseUrl: localStorage.getItem('jmh_supabase_url') || '',
        supabaseKey: localStorage.getItem('jmh_supabase_key') || '',
        geminiKey: localStorage.getItem('jmh_gemini_key') || '',
      });
      setSupabaseStatus(isSupabaseConfigured());
      setGeminiStatus(isGeminiConfigured());
      setSaveStatus('idle');
      setShowClearConfirm(false);
    }
  }, [isOpen]);

  const handleSave = () => {
    try {
      if (config.supabaseUrl.trim()) {
        localStorage.setItem('jmh_supabase_url', config.supabaseUrl.trim());
      } else {
        localStorage.removeItem('jmh_supabase_url');
      }

      if (config.supabaseKey.trim()) {
        localStorage.setItem('jmh_supabase_key', config.supabaseKey.trim());
      } else {
        localStorage.removeItem('jmh_supabase_key');
      }

      if (config.geminiKey.trim()) {
        localStorage.setItem('jmh_gemini_key', config.geminiKey.trim());
      } else {
        localStorage.removeItem('jmh_gemini_key');
      }

      resetSupabaseClient();
      resetGeminiClient();

      setSupabaseStatus(isSupabaseConfigured());
      setGeminiStatus(isGeminiConfigured());
      setSaveStatus('saved');

      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleClearData = () => {
    localStorage.removeItem('jmh_supabase_url');
    localStorage.removeItem('jmh_supabase_key');
    localStorage.removeItem('jmh_gemini_key');

    setConfig({ supabaseUrl: '', supabaseKey: '', geminiKey: '' });

    resetSupabaseClient();
    resetGeminiClient();

    setSupabaseStatus(false);
    setGeminiStatus(false);
    setShowClearConfirm(false);
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  const StatusDot = ({ active }: { active: boolean }) => (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ${
        active
          ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50'
          : 'bg-red-400 shadow-sm shadow-red-400/50'
      }`}
    />
  );

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/90 text-slate-400 transition-all hover:border-slate-700 hover:bg-slate-800 hover:text-white cursor-pointer"
        aria-label="Abrir configuración"
      >
        <Settings className="h-5 w-5" />
      </button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/50"
            >
              {/* Header */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600">
                    <Settings className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      Configuración
                    </h2>
                    <p className="text-xs text-slate-400">
                      Claves de API y conexiones
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-white cursor-pointer"
                  aria-label="Cerrar configuración"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Connection Status */}
              <div className="mb-6 flex gap-4 rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                <div className="flex items-center gap-2">
                  <StatusDot active={supabaseStatus} />
                  <span className="text-sm text-slate-300">Supabase</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusDot active={geminiStatus} />
                  <span className="text-sm text-slate-300">Gemini</span>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                {/* Supabase URL */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">
                    Supabase URL
                  </label>
                  <input
                    type="text"
                    value={config.supabaseUrl}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        supabaseUrl: e.target.value,
                      }))
                    }
                    placeholder="https://xxxxx.supabase.co"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
                  />
                </div>

                {/* Supabase Anon Key */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">
                    Supabase Anon Key
                  </label>
                  <div className="relative">
                    <input
                      type={showSupabaseKey ? 'text' : 'password'}
                      value={config.supabaseKey}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          supabaseKey: e.target.value,
                        }))
                      }
                      placeholder="eyJhbGciOiJIUzI1NiIs..."
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 pr-12 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSupabaseKey(!showSupabaseKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                      aria-label={showSupabaseKey ? 'Ocultar clave' : 'Mostrar clave'}
                    >
                      {showSupabaseKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Gemini API Key */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">
                    Gemini API Key
                  </label>
                  <div className="relative">
                    <input
                      type={showGeminiKey ? 'text' : 'password'}
                      value={config.geminiKey}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          geminiKey: e.target.value,
                        }))
                      }
                      placeholder="AIzaSy..."
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 pr-12 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGeminiKey(!showGeminiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                      aria-label={showGeminiKey ? 'Ocultar clave' : 'Mostrar clave'}
                    >
                      {showGeminiKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                    Modelo activo: <span className="text-cyan-400 font-mono font-medium">gemini-3.8-flash</span>.<br />
                    Las claves deben comenzar con <span className="text-amber-400 font-mono">AIzaSy...</span> (obtenla gratis en{' '}
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 underline hover:text-cyan-300"
                    >
                      Google AI Studio
                    </a>
                    ).
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-col gap-3">
                {/* Save Button */}
                <button
                  onClick={handleSave}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-cyan-500/25 cursor-pointer"
                >
                  {saveStatus === 'saved' ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      ¡Configuración Guardada!
                    </>
                  ) : saveStatus === 'error' ? (
                    <>
                      <XCircle className="h-4 w-4" />
                      Error al Guardar
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Guardar Configuración
                    </>
                  )}
                </button>

                {/* Reset XP Button */}
                <button
                  type="button"
                  onClick={async () => {
                    await resetUserXP();
                    window.location.reload();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-400 hover:bg-amber-500/20 transition-colors cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Calibrar / Reiniciar EXP a 0
                </button>

                {/* Clear Data */}
                {!showClearConfirm ? (
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm text-slate-400 transition-colors hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                    Limpiar Datos Locales
                  </button>
                ) : (
                  <div className="flex gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3">
                    <p className="flex-1 text-xs text-red-300">
                      ¿Eliminar todas las claves guardadas? Esta acción no se
                      puede deshacer.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleClearData}
                        className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 cursor-pointer"
                      >
                        Sí, eliminar
                      </button>
                      <button
                        onClick={() => setShowClearConfirm(false)}
                        className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
