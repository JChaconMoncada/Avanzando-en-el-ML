'use client';

import { useState, useRef } from 'react';
import { CalendarPlus, Upload, CheckCircle2, AlertTriangle, X, FileText, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ParsedEvent {
  uid: string;
  summary: string;
  description: string;
  dtstart: string;
  dateFormatted: string;
  matchedDay: number | null;
}

interface ImportResult {
  total: number;
  matched: number;
  imported: number;
}

function parseICSDate(raw: string): Date | null {
  if (!raw) return null;
  const cleaned = raw.replace(/^.*?:/, '').trim();

  // Format: YYYYMMDD or YYYYMMDDTHHmmssZ or YYYYMMDDTHHmmss
  const match = cleaned.match(
    /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})Z?)?$/
  );
  if (!match) return null;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1;
  const day = parseInt(match[3], 10);
  const hours = match[4] ? parseInt(match[4], 10) : 0;
  const minutes = match[5] ? parseInt(match[5], 10) : 0;
  const seconds = match[6] ? parseInt(match[6], 10) : 0;

  return new Date(year, month, day, hours, minutes, seconds);
}

function formatDate(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function extractField(block: string, field: string): string {
  const lines = block.split(/\r?\n/);
  let result = '';
  let capturing = false;

  for (const line of lines) {
    if (line.startsWith(`${field}:`) || line.startsWith(`${field};`)) {
      const colonIdx = line.indexOf(':');
      result = colonIdx !== -1 ? line.substring(colonIdx + 1).trim() : '';
      capturing = true;
      continue;
    }
    if (capturing) {
      if (line.startsWith(' ') || line.startsWith('\t')) {
        result += line.substring(1);
      } else {
        capturing = false;
      }
    }
  }

  return result
    .replace(/\\n/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\\\/g, '\\')
    .trim();
}

function parseICSText(text: string): ParsedEvent[] {
  const events: ParsedEvent[] = [];
  const blocks = text.split('BEGIN:VEVENT');

  for (let i = 1; i < blocks.length; i++) {
    const endIdx = blocks[i].indexOf('END:VEVENT');
    if (endIdx === -1) continue;

    const block = blocks[i].substring(0, endIdx);

    const summary = extractField(block, 'SUMMARY');
    const description = extractField(block, 'DESCRIPTION');
    const dtstart = extractField(block, 'DTSTART');
    const uid = extractField(block, 'UID') || `event-${i}`;

    const date = parseICSDate(dtstart);

    events.push({
      uid,
      summary: summary || '(Sin título)',
      description: description || '',
      dtstart,
      dateFormatted: date ? formatDate(date) : 'Fecha inválida',
      matchedDay: null,
    });
  }

  return events;
}

function matchEventsToStudyDays(
  events: ParsedEvent[],
  startDate: Date
): ParsedEvent[] {
  return events.map((event) => {
    const date = parseICSDate(event.dtstart);
    if (!date) return { ...event, matchedDay: null };

    const diffTime = date.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const dayNumber = diffDays + 1;

    return {
      ...event,
      matchedDay: dayNumber > 0 ? dayNumber : null,
    };
  });
}

const PLAN_START_DATE = new Date(2026, 10, 14);

export default function ICSImporter() {
  const [isOpen, setIsOpen] = useState(false);
  const [events, setEvents] = useState<ParsedEvent[]>([]);
  const [fileName, setFileName] = useState('');
  const [parseError, setParseError] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const planStartDate = PLAN_START_DATE;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParseError('');
    setImportResult(null);
    setFileName(file.name);

    if (!file.name.endsWith('.ics')) {
      setParseError('El archivo debe tener extensión .ics');
      setEvents([]);
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;

        if (!text.includes('BEGIN:VCALENDAR')) {
          setParseError(
            'Archivo ICS inválido: no contiene un bloque VCALENDAR'
          );
          setEvents([]);
          return;
        }

        const parsed = parseICSText(text);

        if (parsed.length === 0) {
          setParseError('No se encontraron eventos (VEVENT) en el archivo');
          setEvents([]);
          return;
        }

        const matched = matchEventsToStudyDays(parsed, planStartDate);
        setEvents(matched);
      } catch {
        setParseError(
          'Error al procesar el archivo ICS. Verifica que el formato sea correcto.'
        );
        setEvents([]);
      }
    };

    reader.onerror = () => {
      setParseError('Error al leer el archivo');
      setEvents([]);
    };

    reader.readAsText(file);
  };

  const handleImport = async () => {
    const matchedEvents = events.filter((e) => e.matchedDay !== null);
    if (matchedEvents.length === 0) return;

    setIsImporting(true);
    setProgress(0);

    try {
      const { getSupabase, updateStudyDay } = await import('@/lib/supabase');
      const sb = getSupabase();

      let importedCount = 0;

      for (let i = 0; i < matchedEvents.length; i++) {
        const event = matchedEvents[i];
        if (!event.matchedDay) continue;

        if (sb) {
          const { error } = await sb
            .from('study_days')
            .update({
              notas_dia: `${event.summary || ''}\n${event.description || ''}`.trim(),
            })
            .eq('dia_numero', event.matchedDay);

          if (!error) importedCount++;
        } else {
          await updateStudyDay(event.matchedDay, {
            notas_dia: `${event.summary || ''}\n${event.description || ''}`.trim(),
          });
          importedCount++;
        }

        setProgress(Math.round(((i + 1) / matchedEvents.length) * 100));
      }

      setImportResult({
        total: events.length,
        matched: matchedEvents.length,
        imported: importedCount,
      });
    } catch {
      setParseError('Error al importar eventos a Supabase. Verifica la conexión.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setEvents([]);
    setFileName('');
    setParseError('');
    setImportResult(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const matchedCount = events.filter((e) => e.matchedDay !== null).length;
  const unmatchedCount = events.length - matchedCount;

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-2 text-sm text-slate-300 transition-all hover:border-cyan-500/50 hover:bg-slate-800 hover:text-white cursor-pointer"
      >
        <span>📅</span>
        <span>Importar .ICS</span>
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
              onClick={() => {
                if (!isImporting) setIsOpen(false);
              }}
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/50"
            >
              {/* Header */}
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-lg">
                    📅
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      Importar Calendario ICS
                    </h2>
                    <p className="text-xs text-slate-400">
                      Sincroniza eventos con tu plan de estudio
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (!isImporting) setIsOpen(false);
                  }}
                  disabled={isImporting}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-white disabled:opacity-50 cursor-pointer"
                  aria-label="Cerrar importador"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* File Input */}
              {!importResult && (
                <div className="mb-5">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".ics"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="ics-file-input"
                  />
                  <label
                    htmlFor="ics-file-input"
                    className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-slate-700 bg-slate-950/50 p-6 transition-colors hover:border-cyan-500/50 hover:bg-slate-950"
                  >
                    <Upload className="h-8 w-8 text-slate-500" />
                    <div className="text-center">
                      <p className="text-sm font-medium text-slate-300">
                        {fileName || 'Seleccionar archivo .ics'}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Arrastra o haz clic para seleccionar
                      </p>
                    </div>
                  </label>
                </div>
              )}

              {/* Parse Error */}
              {parseError && (
                <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
                  <p className="text-sm text-red-300">{parseError}</p>
                </div>
              )}

              {/* Event Preview */}
              {events.length > 0 && !importResult && (
                <>
                  {/* Summary Bar */}
                  <div className="mb-3 flex items-center justify-between rounded-lg bg-slate-950/50 px-3 py-2">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-cyan-400" />
                      <span className="text-sm text-slate-300">
                        {events.length} evento{events.length !== 1 ? 's' : ''}{' '}
                        encontrado{events.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-emerald-400">
                        ✓ {matchedCount} asignado{matchedCount !== 1 ? 's' : ''}
                      </span>
                      {unmatchedCount > 0 && (
                        <span className="text-amber-400">
                          ⚠ {unmatchedCount} sin asignar
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Event List */}
                  <div className="mb-4 max-h-64 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/30 scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-slate-700">
                    {events.map((event, idx) => (
                      <div
                        key={event.uid + idx}
                        className={`flex items-start gap-3 border-b border-slate-800/50 px-4 py-3 last:border-b-0 ${
                          event.matchedDay === null ? 'opacity-50' : ''
                        }`}
                      >
                        <div
                          className={`mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                            event.matchedDay !== null
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-slate-700/50 text-slate-500'
                          }`}
                        >
                          {event.matchedDay !== null ? '✓' : '–'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {event.summary}
                          </p>
                          <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
                            <span>{event.dateFormatted}</span>
                            {event.matchedDay !== null && (
                              <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-cyan-300">
                                Día {event.matchedDay}
                              </span>
                            )}
                          </div>
                          {event.description && (
                            <p className="mt-1 text-xs text-slate-500 truncate">
                              {event.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Progress Bar */}
                  {isImporting && (
                    <div className="mb-4">
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Importando eventos...
                        </span>
                        <span className="text-cyan-400">{progress}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Import Button */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleImport}
                      disabled={isImporting || matchedCount === 0}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-cyan-500/25 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <CalendarPlus className="h-4 w-4" />
                      Confirmar Importación ({matchedCount} evento
                      {matchedCount !== 1 ? 's' : ''})
                    </button>
                    <button
                      onClick={handleReset}
                      disabled={isImporting}
                      className="flex items-center justify-center gap-1 rounded-xl border border-slate-700 px-4 py-3 text-sm text-slate-400 transition-colors hover:bg-slate-800 hover:text-white disabled:opacity-40 cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </>
              )}

              {/* Import Result */}
              {importResult && (
                <div className="text-center">
                  <div className="mb-4 flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
                      <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                    </div>
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-white">
                    ¡Importación Completa!
                  </h3>
                  <div className="mb-5 space-y-1 text-sm text-slate-400">
                    <p>
                      Total de eventos:{' '}
                      <span className="text-white">{importResult.total}</span>
                    </p>
                    <p>
                      Asignados a días:{' '}
                      <span className="text-cyan-400">{importResult.matched}</span>
                    </p>
                    <p>
                      Importados exitosamente:{' '}
                      <span className="text-emerald-400">
                        {importResult.imported}
                      </span>
                    </p>
                    {importResult.imported < importResult.matched && (
                      <p className="text-amber-400">
                        ⚠{' '}
                        {importResult.matched - importResult.imported} evento
                        {importResult.matched - importResult.imported !== 1
                          ? 's'
                          : ''}{' '}
                        no se pudieron importar
                      </p>
                    )}
                  </div>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => {
                        handleReset();
                      }}
                      className="rounded-xl border border-slate-700 px-6 py-2.5 text-sm text-slate-300 transition-colors hover:bg-slate-800 hover:text-white cursor-pointer"
                    >
                      Importar otro archivo
                    </button>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-cyan-500/25 cursor-pointer"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
