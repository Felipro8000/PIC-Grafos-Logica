import React from 'react';
import { ContextParams, Coordinate, PresetLocation } from '../types';
import {
  Sun,
  CloudRain,
  CloudLightning,
  Clock,
  Calendar,
  Flag,
  Navigation,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface ControlPanelProps {
  origin: Coordinate | null;
  destination: Coordinate | null;
  context: ContextParams;
  presets: PresetLocation[];
  loading: boolean;
  onContextChange: (newContext: ContextParams) => void;
  onCalculateRoute: () => void;
  onSelectPreset: (type: 'origin' | 'destination', preset: PresetLocation) => void;
  onResetPoints: () => void;
}

const DIAS_SEMANA = [
  { id: 'lunes', label: 'Lunes' },
  { id: 'martes', label: 'Martes' },
  { id: 'miércoles', label: 'Miércoles' },
  { id: 'jueves', label: 'Jueves' },
  { id: 'viernes', label: 'Viernes' },
  { id: 'sábado', label: 'Sábado' },
  { id: 'domingo', label: 'Domingo' },
];

export const ControlPanel: React.FC<ControlPanelProps> = ({
  origin,
  destination,
  context,
  presets,
  loading,
  onContextChange,
  onCalculateRoute,
  onSelectPreset,
  onResetPoints,
}) => {
  const isPeakHour =
    !context.es_feriado &&
    !['sábado', 'domingo'].includes(context.dia_semana) &&
    ((context.hora_dia >= 7 && context.hora_dia <= 9) ||
      (context.hora_dia >= 17 && context.hora_dia <= 19));

  return (
    <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 text-slate-100 max-h-[85vh] overflow-y-auto w-full md:w-96">
      {/* Título de Sección */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">
              Simulador de Ruteo
            </h2>
            <p className="text-[11px] text-slate-400">Punto a Punto · Rosario</p>
          </div>
        </div>

        {(origin || destination) && (
          <button
            onClick={onResetPoints}
            className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
            title="Limpiar puntos marcados"
          >
            <RotateCcw className="w-3 h-3" />
            Limpiar
          </button>
        )}
      </div>

      {/* 1. Selección de Origen y Destino */}
      <div className="flex flex-col gap-3">
        {/* Origen */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/30"></span>
              Punto de Origen
            </span>
            {origin && (
              <span className="text-[10px] font-mono text-slate-400">
                {origin.lat.toFixed(4)}, {origin.lon.toFixed(4)}
              </span>
            )}
          </div>
          <select
            className="w-full bg-slate-900 border border-slate-700/80 rounded-lg text-xs py-1.5 px-2 text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
            value={
              presets.find((p) => p.lat === origin?.lat && p.lon === origin?.lon)?.id ||
              'custom'
            }
            onChange={(e) => {
              const selected = presets.find((p) => p.id === e.target.value);
              if (selected) onSelectPreset('origin', selected);
            }}
          >
            <option value="custom" disabled>
              {origin ? 'Coordenada en mapa seleccionada' : 'Seleccionar origen o clic en mapa...'}
            </option>
            {presets.map((p) => (
              <option key={`orig-${p.id}`} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Destino */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-400 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-red-500/30"></span>
              Punto de Destino
            </span>
            {destination && (
              <span className="text-[10px] font-mono text-slate-400">
                {destination.lat.toFixed(4)}, {destination.lon.toFixed(4)}
              </span>
            )}
          </div>
          <select
            className="w-full bg-slate-900 border border-slate-700/80 rounded-lg text-xs py-1.5 px-2 text-slate-200 focus:outline-none focus:border-red-500 transition-colors"
            value={
              presets.find((p) => p.lat === destination?.lat && p.lon === destination?.lon)?.id ||
              'custom'
            }
            onChange={(e) => {
              const selected = presets.find((p) => p.id === e.target.value);
              if (selected) onSelectPreset('destination', selected);
            }}
          >
            <option value="custom" disabled>
              {destination ? 'Coordenada en mapa seleccionada' : 'Seleccionar destino o clic en mapa...'}
            </option>
            {presets.map((p) => (
              <option key={`dest-${p.id}`} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Contexto Temporal y Meteorológico */}
      <div className="border-t border-slate-800 pt-3 flex flex-col gap-3.5">
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          Condiciones de Simulación
        </span>

        {/* Slider de Hora del Día */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Hora del viaje:</span>
            <span className="font-mono font-bold text-emerald-400">
              {String(context.hora_dia).padStart(2, '0')}:00 h
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={23}
            value={context.hora_dia}
            onChange={(e) =>
              onContextChange({ ...context, hora_dia: parseInt(e.target.value, 10) })
            }
            className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
          />
          {isPeakHour && (
            <span className="text-[10px] text-amber-400 flex items-center gap-1 font-medium mt-0.5">
              ⚠️ Horario Pico de congestión en Rosario
            </span>
          )}
        </div>

        {/* Día de la Semana */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" />
            Día de la semana:
          </label>
          <select
            value={context.dia_semana}
            onChange={(e) => onContextChange({ ...context, dia_semana: e.target.value })}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg text-xs py-1.5 px-2 text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            {DIAS_SEMANA.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        {/* Clima */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-slate-400">Condición climática:</span>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => onContextChange({ ...context, clima: 'soleado' })}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium border transition-all ${
                context.clima === 'soleado'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              Soleado
            </button>
            <button
              type="button"
              onClick={() => onContextChange({ ...context, clima: 'lluvia' })}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium border transition-all ${
                context.clima === 'lluvia'
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-sm'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <CloudRain className="w-3.5 h-3.5" />
              Lluvia
            </button>
            <button
              type="button"
              onClick={() => onContextChange({ ...context, clima: 'tormenta' })}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium border transition-all ${
                context.clima === 'tormenta'
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-sm'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <CloudLightning className="w-3.5 h-3.5" />
              Tormenta
            </button>
          </div>
        </div>

        {/* Feriado Switch */}
        <label className="flex items-center justify-between text-xs cursor-pointer py-1">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Flag className="w-3.5 h-3.5 text-slate-400" />
            ¿Es día feriado?
          </span>
          <input
            type="checkbox"
            checked={context.es_feriado}
            onChange={(e) =>
              onContextChange({ ...context, es_feriado: e.target.checked })
            }
            className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
          />
        </label>
      </div>

      {/* 3. Botón de Acción Principal */}
      <button
        type="button"
        disabled={!origin || !destination || loading}
        onClick={onCalculateRoute}
        className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all ${
          !origin || !destination || loading
            ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30 hover:shadow-emerald-900/50 border border-emerald-400/30 active:scale-[0.98]'
        }`}
      >
        {loading ? (
          <>
            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Calculando Dijkstra y ML...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            <span>Calcular Rutas y Comparar</span>
          </>
        )}
      </button>

      {(!origin || !destination) && (
        <p className="text-[11px] text-slate-500 text-center italic">
          Definí origen y destino para ejecutar la optimización.
        </p>
      )}
    </div>
  );
};
