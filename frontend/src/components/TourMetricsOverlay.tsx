import React from 'react';
import { DeliveryTourResponse } from '../types';
import {
  Layers,
  Clock,
  Compass,
  CheckCircle,
  X,
  ArrowRight,
} from 'lucide-react';

interface TourMetricsOverlayProps {
  tourData: DeliveryTourResponse;
  onClose: () => void;
}

export const TourMetricsOverlay: React.FC<TourMetricsOverlayProps> = ({
  tourData,
  onClose,
}) => {
  const {
    ordered_stops,
    legs,
    total_distance_km,
    total_time_minutes,
    context_applied,
  } = tourData;

  return (
    <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 text-slate-100 w-full md:w-[420px] max-h-[85vh] overflow-y-auto">
      {/* Cabecera */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Itinerario Optimizado (TSP)
            </h3>
            <p className="text-[11px] text-slate-400">
              {context_applied.dia_semana.toUpperCase()} {context_applied.hora_dia}:00 h · {context_applied.clima}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors"
          title="Cerrar resultados"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tarjetas de Totales */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-slate-950/70 border border-purple-500/30 rounded-xl p-3 flex flex-col gap-1">
          <span className="text-[11px] text-purple-400 font-bold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Tiempo Total Estimado
          </span>
          <span className="text-xl font-extrabold text-white font-mono">
            {total_time_minutes} <span className="text-xs font-normal text-slate-400">min</span>
          </span>
          <span className="text-[10px] text-slate-400">Con tráfico y clima aplicados</span>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex flex-col gap-1">
          <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-purple-400" />
            Distancia Total
          </span>
          <span className="text-xl font-extrabold text-white font-mono">
            {total_distance_km} <span className="text-xs font-normal text-slate-400">km</span>
          </span>
          <span className="text-[10px] text-slate-400">{legs.length} tramos recorridos</span>
        </div>
      </div>

      {/* Secuencia Ordenada de Visitas */}
      <div className="flex flex-col gap-2 border-t border-slate-800 pt-3">
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-purple-400" />
            Orden de Visita Óptimo
          </span>
          <span className="text-[10px] text-purple-300 font-normal">
            Vecino Más Cercano
          </span>
        </span>

        <div className="flex flex-col gap-1.5">
          {ordered_stops.map((stop, idx) => {
            const isDepot = idx === 0 || idx === ordered_stops.length - 1;
            return (
              <div
                key={`ordered-${stop.id}-${idx}`}
                className="flex items-center gap-2.5 bg-slate-950/50 border border-slate-800/80 px-3 py-2 rounded-xl text-xs"
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                    isDepot
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                  }`}
                >
                  {isDepot ? '★' : stop.orden}
                </span>
                <div className="flex-1 overflow-hidden">
                  <div className="font-semibold text-slate-200 truncate">
                    {stop.nombre}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {stop.lat.toFixed(4)}, {stop.lon.toFixed(4)}
                  </div>
                </div>
                {isDepot && (
                  <span className="text-[9px] uppercase tracking-wider bg-amber-950/60 text-amber-300 border border-amber-800 px-1.5 py-0.5 rounded">
                    Depósito
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Detalle Pierna por Pierna */}
      <div className="flex flex-col gap-2 border-t border-slate-800 pt-3">
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Tramos del Recorrido
        </span>
        <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
          {legs.map((leg, idx) => (
            <div
              key={`leg-${idx}`}
              className="bg-slate-950/40 border border-slate-800/60 p-2 rounded-lg text-xs flex items-center justify-between"
            >
              <div className="flex items-center gap-1.5 truncate max-w-[220px]">
                <span className="text-slate-400">{leg.from_name.split('(')[0].trim()}</span>
                <ArrowRight className="w-3 h-3 text-purple-400 shrink-0" />
                <span className="text-slate-200 font-medium truncate">
                  {leg.to_name.split('(')[0].trim()}
                </span>
              </div>
              <div className="text-right font-mono text-[11px] text-slate-300 shrink-0">
                {(leg.distance_meters / 1000).toFixed(1)} km · {(leg.time_seconds / 60).toFixed(1)} min
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
