import React from 'react';
import { DeliveryWaypoint, PresetLocation, ContextParams } from '../types';
import {
  Layers,
  MapPin,
  Trash2,
  Play,
  RotateCcw,
  Warehouse,
  CornerDownRight,
  Clock,
} from 'lucide-react';

interface DeliveryTourPanelProps {
  depot: DeliveryWaypoint;
  stops: DeliveryWaypoint[];
  presets: PresetLocation[];
  context: ContextParams;
  returnToDepot: boolean;
  loading: boolean;
  onSelectDepot: (depot: DeliveryWaypoint) => void;
  onAddStop: (stop: DeliveryWaypoint) => void;
  onRemoveStop: (id: string) => void;
  onClearStops: () => void;
  onToggleReturnToDepot: (val: boolean) => void;
  onContextChange: (newContext: ContextParams) => void;
  onCalculateTour: () => void;
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

export const DeliveryTourPanel: React.FC<DeliveryTourPanelProps> = ({
  depot,
  stops,
  presets,
  context,
  returnToDepot,
  loading,
  onSelectDepot,
  onAddStop,
  onRemoveStop,
  onClearStops,
  onToggleReturnToDepot,
  onContextChange,
  onCalculateTour,
}) => {
  return (
    <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 text-slate-100 max-h-[85vh] overflow-y-auto w-full md:w-96">
      {/* Título de Sección */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">
              Ronda de Entregas
            </h2>
            <p className="text-[11px] text-slate-400">Optimización Multi-Parada</p>
          </div>
        </div>

        {stops.length > 0 && (
          <button
            onClick={onClearStops}
            className="text-[11px] text-slate-400 hover:text-red-400 flex items-center gap-1 transition-colors"
            title="Limpiar todas las paradas"
          >
            <RotateCcw className="w-3 h-3" />
            Limpiar
          </button>
        )}
      </div>

      {/* 1. Selección de Depósito Central */}
      <div className="bg-slate-950/70 border border-amber-500/30 rounded-xl p-3 flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
            <Warehouse className="w-3.5 h-3.5 text-amber-400" />
            Depósito / Base de Salida
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            {depot.lat.toFixed(4)}, {depot.lon.toFixed(4)}
          </span>
        </div>
        <select
          className="w-full bg-slate-900 border border-slate-700/80 rounded-lg text-xs py-1.5 px-2 text-slate-200 focus:outline-none focus:border-amber-500 transition-colors"
          value={depot.id}
          onChange={(e) => {
            const selected = presets.find((p) => p.id === e.target.value);
            if (selected) {
              onSelectDepot({
                id: selected.id,
                nombre: selected.nombre,
                lat: selected.lat,
                lon: selected.lon,
              });
            }
          }}
        >
          {presets.map((p) => (
            <option key={`depot-${p.id}`} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* 2. Lista de Paradas de Entrega */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-purple-400" />
            Paradas a Visitar ({stops.length})
          </span>
          <span className="text-[10px] text-slate-400 italic">
            Clic en mapa para sumar
          </span>
        </div>

        {/* Desplegable para agregar preset rápidamente como parada */}
        <div className="flex gap-1.5">
          <select
            id="preset-stop-select"
            defaultValue=""
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg text-xs py-1.5 px-2 text-slate-300 focus:outline-none focus:border-purple-500"
            onChange={(e) => {
              const selected = presets.find((p) => p.id === e.target.value);
              if (selected) {
                onAddStop({
                  id: `stop-${Date.now()}-${selected.id}`,
                  nombre: selected.nombre.split('(')[0].trim(),
                  lat: selected.lat,
                  lon: selected.lon,
                  orden: stops.length + 1,
                });
                e.target.value = '';
              }
            }}
          >
            <option value="" disabled>
              + Agregar lugar de Rosario...
            </option>
            {presets
              .filter((p) => p.id !== depot.id)
              .map((p) => (
                <option key={`stop-opt-${p.id}`} value={p.id}>
                  {p.nombre}
                </option>
              ))}
          </select>
        </div>

        {/* Listado con scroll de paradas */}
        <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
          {stops.length === 0 ? (
            <div className="text-xs text-slate-500 bg-slate-950/40 border border-dashed border-slate-800 rounded-xl p-3 text-center">
              Aún no agregaste paradas. Hacé clic en el mapa de Rosario o elegí un lugar del menú.
            </div>
          ) : (
            stops.map((stop, index) => (
              <div
                key={stop.id}
                className="flex items-center justify-between bg-slate-950/60 border border-slate-800/80 px-2.5 py-1.5 rounded-lg text-xs"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="w-5 h-5 rounded-full bg-purple-600/30 text-purple-300 border border-purple-500/40 flex items-center justify-center font-bold text-[10px] shrink-0">
                    {index + 1}
                  </span>
                  <span className="truncate text-slate-200" title={stop.nombre}>
                    {stop.nombre}
                  </span>
                </div>
                <button
                  onClick={() => onRemoveStop(stop.id)}
                  className="text-slate-500 hover:text-red-400 p-1 transition-colors shrink-0"
                  title="Eliminar parada"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Toggle para retorno al depósito */}
        <label className="flex items-center justify-between text-xs cursor-pointer py-1 text-slate-300">
          <span className="flex items-center gap-1.5">
            <CornerDownRight className="w-3.5 h-3.5 text-amber-400" />
            Regresar al depósito al finalizar
          </span>
          <input
            type="checkbox"
            checked={returnToDepot}
            onChange={(e) => onToggleReturnToDepot(e.target.checked)}
            className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-purple-600 focus:ring-purple-500 cursor-pointer"
          />
        </label>
      </div>

      {/* 3. Condiciones Climáticas y Horarias para el Modelo */}
      <div className="border-t border-slate-800 pt-3 flex flex-col gap-3">
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-purple-400" />
          Condiciones de Tráfico y Clima
        </span>

        {/* Slider Hora */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Hora de inicio de la ronda:</span>
            <span className="font-mono font-bold text-purple-400">
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
            className="w-full accent-purple-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
          />
        </div>

        {/* Día y Clima Compacto */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Día:</label>
            <select
              value={context.dia_semana}
              onChange={(e) => onContextChange({ ...context, dia_semana: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-1 px-2 text-slate-200"
            >
              {DIAS_SEMANA.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Clima:</label>
            <select
              value={context.clima}
              onChange={(e) => onContextChange({ ...context, clima: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-1 px-2 text-slate-200"
            >
              <option value="soleado">Soleado ☀️</option>
              <option value="lluvia">Lluvia 🌧️</option>
              <option value="tormenta">Tormenta ⛈️</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Botón de Ejecución de Ronda con Dijkstra */}
      <button
        type="button"
        disabled={stops.length === 0 || loading}
        onClick={onCalculateTour}
        className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all ${
          stops.length === 0 || loading
            ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
            : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/40 hover:shadow-purple-900/60 border border-purple-400/30 active:scale-[0.98]'
        }`}
      >
        {loading ? (
          <>
            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Calculando circuito con Dijkstra...</span>
          </>
        ) : (
          <>
            <Play className="w-4 h-4 fill-current" />
            <span>Optimizar Ronda ({stops.length} paradas)</span>
          </>
        )}
      </button>
    </div>
  );
};
