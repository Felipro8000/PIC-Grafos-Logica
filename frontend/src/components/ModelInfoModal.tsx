import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ModelMetricsResponse } from '../types';
import {
  Brain,
  Sparkles,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  X,
  Bot,
  Database,
  Cpu,
  HelpCircle,
} from 'lucide-react';

interface ModelInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ModelInfoModal: React.FC<ModelInfoModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'metrics' | 'ai'>('metrics');
  const [metrics, setMetrics] = useState<ModelMetricsResponse | null>(null);

  useEffect(() => {
    if (isOpen && !metrics) {
      api
        .getModelMetrics()
        .then((data) => setMetrics(data))
        .catch((err) => console.error('Error al obtener métricas:', err));
    }
  }, [isOpen, metrics]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Auditoría del Modelo & Uso de IA
              </h2>
              <p className="text-xs text-slate-400">
                Información técnica y metodológica para la evaluación docente
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pestañas de Navegación */}
        <div className="flex border-b border-slate-800 bg-slate-900/50 px-6">
          <button
            onClick={() => setActiveTab('metrics')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'metrics'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Métricas del Modelo (ML)
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'ai'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bot className="w-4 h-4" />
            Sección de Uso de IA
          </button>
        </div>

        {/* Contenido con Scroll */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-300 leading-relaxed">
          {activeTab === 'metrics' ? (
            <>
              {/* Resumen del Modelo */}
              <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl flex items-start gap-3">
                <Cpu className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-slate-100 text-sm mb-1">
                    Random Forest Regressor (Regresión de Tiempos de Viaje)
                  </h3>
                  <p className="text-slate-400">
                    Entrenado con 50.000 viajes sintéticos sobre la red vial de Rosario (13.190 nodos y 30.166 aristas). 
                    Predice la duración real en segundos de cada tramo en función de su longitud, la hora pico, el día de la semana, condiciones climáticas (lluvia/tormenta) y feriados.
                  </p>
                </div>
              </div>

              {/* Tarjetas de Métricas Estadísticas */}
              {metrics && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-950/80 border border-emerald-500/30 p-3.5 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Coeficiente R²
                    </span>
                    <span className="text-2xl font-extrabold text-emerald-400 font-mono">
                      {metrics.r2.toFixed(4)}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      Ajuste excelente (&gt; 90% varianza explicada)
                    </span>
                  </div>

                  <div className="bg-slate-950/80 border border-blue-500/30 p-3.5 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Error Medio (MAE)
                    </span>
                    <span className="text-2xl font-extrabold text-blue-400 font-mono">
                      {metrics.mae} <span className="text-xs font-normal">s</span>
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      Desvío promedio por tramo de calle
                    </span>
                  </div>

                  <div className="bg-slate-950/80 border border-purple-500/30 p-3.5 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Error Cuadrático (RMSE)
                    </span>
                    <span className="text-2xl font-extrabold text-purple-400 font-mono">
                      {metrics.rmse} <span className="text-xs font-normal">s</span>
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      Penalización de errores extremos
                    </span>
                  </div>
                </div>
              )}

              {/* Importancia de Variables (Feature Importances) */}
              {metrics && metrics.feature_importances && (
                <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
                  <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-400" />
                    Importancia de Variables (Feature Importances)
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(metrics.feature_importances)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 6)
                      .map(([feat, val]) => (
                        <div key={feat} className="flex flex-col gap-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="font-mono text-slate-300">{feat}</span>
                            <span className="font-mono text-emerald-400">{(val * 100).toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full"
                              style={{ width: `${Math.max(3, val * 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Integración con Grafos */}
              <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-2">
                <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  Conexión Modelo ML ➔ Algoritmos de Grafos
                </h4>
                <p className="text-slate-400">
                  La salida de regresión del modelo (<code className="text-emerald-400">tiempo_real_viaje</code>) se asigna dinámicamente como atributo <code className="text-emerald-400">weight</code> en cada arista del grafo NetworkX.
                  Dijkstra opera sobre este peso minimizando segundos reales, mientras que la ruta estática minimiza metros (<code className="text-blue-400">length</code>).
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Sección de Uso de IA Obligatoria */}
              <div className="space-y-4">
                <div className="bg-purple-950/30 border border-purple-800/40 p-4 rounded-xl">
                  <h3 className="font-bold text-purple-300 text-sm mb-1 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    Declaración y Documentación del Uso de Inteligencia Artificial
                  </h3>
                  <p className="text-slate-300 text-xs">
                    Siguiendo las pautas del enunciado, detallamos las herramientas empleadas, las áreas donde se aplicó asistencia asistida y los puntos críticos resueltos manualmente por el grupo.
                  </p>
                </div>

                {/* 1. Herramientas usadas */}
                <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-2">
                  <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    1. Herramientas Utilizadas
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
                    <li><strong className="text-slate-200">Antigravity / Gemini / Claude:</strong> Asistencia en estructuración del código, generación de scripts de datos sintéticos y maquetación de componentes React con Tailwind y Leaflet.</li>
                    <li><strong className="text-slate-200">OSMnx & OpenStreetMap:</strong> Para descarga automatizada de la red vial geográfica de Rosario.</li>
                  </ul>
                </div>

                {/* 2. Para qué partes se usó y para cuáles no */}
                <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-2">
                  <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    2. Alcance del Uso de IA
                  </h4>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                      <span className="text-emerald-400 font-bold block mb-1">Dónde SÍ se utilizó:</span>
                      <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                        <li>Generación de reglas sintéticas del dataset urbano.</li>
                        <li>Esqueleto inicial de componentes React y Tailwind.</li>
                        <li>Vectorización de inferencia batch con NumPy/Pandas.</li>
                        <li>Configuración del proxy de Vite y schemas Pydantic.</li>
                      </ul>
                    </div>
                    <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                      <span className="text-amber-400 font-bold block mb-1">Dónde NO se utilizó:</span>
                      <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                        <li>Elección del problema y modelado matemático del grafo.</li>
                        <li>Definición de las métricas de validación (R², MAE, RMSE).</li>
                        <li>Diseño de la heurística de Vecino Más Cercano para TSP.</li>
                        <li>Validación lógica de que el depósito sea nodo base y no parada numerada.</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* 3. Ejemplos concretos de prompts */}
                <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-2">
                  <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-purple-400" />
                    3. Ejemplos Concretos de Prompts Útiles
                  </h4>
                  <div className="space-y-2 text-[11px]">
                    <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 font-mono text-slate-300">
                      "Cómo estructurar una API en FastAPI para que mantenga en memoria RAM un grafo de NetworkX y aplique Dijkstra sobre pesos predichos por Random Forest sin demoras por request?"
                    </div>
                    <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 font-mono text-slate-300">
                      "Proponer una implementación en React-Leaflet con custom DivIcons para diferenciar el origen, el destino y los pines numerados de una ronda de entregas."
                    </div>
                  </div>
                </div>

                {/* 4. Errores de la IA y corrección del grupo */}
                <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-2">
                  <h4 className="font-bold text-amber-400 text-xs uppercase tracking-wider flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    4. Errores Detectados en la IA y Cómo se Corrigieron
                  </h4>
                  <ul className="list-disc list-inside space-y-1.5 text-slate-400 text-[11px]">
                    <li>
                      <strong className="text-slate-200">Servidores Overpass caídos:</strong> La IA propuso inicialmente un mirror alternativo (<code className="text-slate-300">overpass.kumi.systems</code>) que estaba fuera de servicio y bloqueaba la descarga. Lo detectamos mediante pruebas de red y reconfiguramos al endpoint oficial con timeout controlado.
                    </li>
                    <li>
                      <strong className="text-slate-200">Contabilización del depósito como parada:</strong> La IA había numerado el depósito de salida y llegada como "Parada #1" y "Parada #5". Detectamos que conceptualmente el depósito es una base logística de partida y no una entrega, por lo que corregimos la lógica para que los clientes comiencen estrictamente desde el 1.
                    </li>
                  </ul>
                </div>

                {/* 5. Reflexión breve */}
                <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-2">
                  <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    5. Reflexión Breve del Grupo
                  </h4>
                  <p className="text-slate-300 text-[11px]">
                    La IA aceleró fuertemente la escritura de código repetitivo (maquetado CSS, llamadas asíncronas y formateo de datos). Sin embargo, sin un entendimiento claro de Teoría de Grafos, proyecciones geográficas y formulación de problemas (Dijkstra vs. TSP), el sistema hubiera contenido inconsistencias lógicas. La IA funcionó como un copiloto técnico guiado por el criterio del equipo.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Pie del Modal */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/70 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors"
          >
            Cerrar Ventana
          </button>
        </div>
      </div>
    </div>
  );
};
