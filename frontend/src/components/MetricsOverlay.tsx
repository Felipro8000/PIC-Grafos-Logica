import React from 'react';
import { RouteResponse } from '../types';
import {
  TrendingUp,
  Compass,
  CheckCircle2,
  X,
  Zap,
} from 'lucide-react';

interface MetricsOverlayProps {
  routeData: RouteResponse;
  onClose: () => void;
}

export const MetricsOverlay: React.FC<MetricsOverlayProps> = ({
  routeData,
  onClose,
}) => {
  const { static_route, dynamic_route, comparison, context_applied } = routeData;

  const hasTimeSavings = comparison.time_difference_seconds > 0;
  const isDifferentRoute =
    static_route.distance_meters !== dynamic_route.distance_meters ||
    static_route.estimated_time_seconds !== dynamic_route.estimated_time_seconds;

  return (
    <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 text-slate-100 w-full md:w-[420px] max-h-[85vh] overflow-y-auto">
      {/* Cabecera del Panel */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Comparativa de Rutas
            </h3>
            <p className="text-[11px] text-slate-400">
              {context_applied.dia_semana.toUpperCase()} {context_applied.hora_dia}:00 h · Clima:{' '}
              {context_applied.clima}
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

      {/* Banner Principal de Ahorro / Veredicto */}
      <div
        className={`p-3.5 rounded-xl border flex items-center justify-between ${
          hasTimeSavings
            ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
            : 'bg-slate-950/60 border-slate-800 text-slate-300'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`p-2 rounded-lg ${
              hasTimeSavings ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
            }`}
          >
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider opacity-80">
              Veredicto del Modelo
            </div>
            <div className="text-sm font-extrabold text-white">
              {hasTimeSavings
                ? `Ahorro de ${comparison.time_difference_minutes} min (${comparison.time_saved_percent}%)`
                : 'Tiempos equivalentes'}
            </div>
          </div>
        </div>

        {hasTimeSavings && (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300">
            Más Rápida
          </span>
        )}
      </div>

      {/* Tarjetas Comparativas Lado a Lado */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* 1. Ruta Dinámica (ML + Dijkstra) */}
        <div className="bg-slate-950/70 border border-emerald-500/40 rounded-xl p-3 flex flex-col gap-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Ruta Dinámica (ML)
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-extrabold text-white font-mono">
              {dynamic_route.estimated_time_minutes}{' '}
              <span className="text-xs font-normal text-slate-400">min</span>
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {dynamic_route.distance_km} km ({dynamic_route.num_steps} tramos)
            </span>
          </div>
          <div className="text-[10px] text-emerald-300/80 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40 mt-1">
            Minimiza tiempo real estimado
          </div>
        </div>

        {/* 2. Ruta Estática (Distancia Mínima) */}
        <div className="bg-slate-950/70 border border-blue-500/30 rounded-xl p-3 flex flex-col gap-2 relative overflow-hidden">
          <div className="flex items-center gap-1.5 text-blue-400 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            Ruta Estática
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-extrabold text-white font-mono">
              {static_route.estimated_time_minutes}{' '}
              <span className="text-xs font-normal text-slate-400">min</span>
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {static_route.distance_km} km ({static_route.num_steps} tramos)
            </span>
          </div>
          <div className="text-[10px] text-blue-300/80 bg-blue-950/40 px-2 py-0.5 rounded border border-blue-800/40 mt-1">
            Minimiza distancia física
          </div>
        </div>
      </div>

      {/* Diferencial de Distancia */}
      {isDifferentRoute && comparison.distance_difference_meters !== 0 && (
        <div className="text-[11px] text-slate-400 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60 flex items-center justify-between">
          <span>Diferencia de recorrido:</span>
          <span className="font-mono text-slate-200 font-medium">
            {comparison.distance_difference_meters > 0
              ? `+${comparison.distance_difference_meters} m más de recorrido`
              : `${comparison.distance_difference_meters} m`}
          </span>
        </div>
      )}

      {/* Insights y Explicación del Algoritmo */}
      <div className="flex flex-col gap-2 border-t border-slate-800 pt-3">
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-emerald-400" />
          Análisis del Comportamiento
        </span>
        <div className="flex flex-col gap-1.5">
          {comparison.insights.map((insight, idx) => (
            <div
              key={idx}
              className="text-xs text-slate-300 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/80 flex items-start gap-2 leading-relaxed"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>{insight}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Leyenda de Mapa */}
      <div className="border-t border-slate-800 pt-2 flex items-center justify-around text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-1 bg-emerald-500 rounded"></span> Ruta Dinámica (Verde)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-1 bg-blue-500 rounded border-dashed"></span> Ruta Estática (Azul)
        </span>
      </div>
    </div>
  );
};
