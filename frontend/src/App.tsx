import React, { useState, useEffect } from 'react';
import { MapViewer } from './components/MapViewer';
import { ControlPanel } from './components/ControlPanel';
import { MetricsOverlay } from './components/MetricsOverlay';
import { DeliveryTourPanel } from './components/DeliveryTourPanel';
import { TourMetricsOverlay } from './components/TourMetricsOverlay';
import { ModelInfoModal } from './components/ModelInfoModal';
import { api } from './services/api';
import {
  HealthResponse,
  PresetLocation,
  Coordinate,
  DeliveryWaypoint,
  ContextParams,
  RouteResponse,
  DeliveryTourResponse,
} from './types';
import {
  Truck,
  Layers,
  RefreshCw,
  Navigation,
  AlertTriangle,
  Brain,
} from 'lucide-react';

export const App: React.FC = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [presets, setPresets] = useState<PresetLocation[]>([]);
  const [mode, setMode] = useState<'route' | 'tour'>('route');

  // Parámetros de contexto para el modelo de ML
  const [context, setContext] = useState<ContextParams>({
    hora_dia: 18,
    dia_semana: 'viernes',
    clima: 'lluvia',
    es_feriado: false,
  });

  // Coordenadas seleccionadas para el modo Punto a Punto
  const [origin, setOrigin] = useState<Coordinate | null>({
    lat: -32.9477,
    lon: -60.6304,
  }); // Monumento a la Bandera
  const [destination, setDestination] = useState<Coordinate | null>({
    lat: -32.9389,
    lon: -60.6698,
  }); // Terminal de Ómnibus

  // Estado del modal de información del modelo e IA
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [routeResult, setRouteResult] = useState<RouteResponse | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);

  // Estado del modo Ronda de Entregas con Dijkstra
  const [depot, setDepot] = useState<DeliveryWaypoint>({
    id: 'centro_distribucion',
    nombre: 'Centro de Distribución (Depósito Norte)',
    lat: -32.9250,
    lon: -60.6700,
  });
  const [stops, setStops] = useState<DeliveryWaypoint[]>([
    {
      id: 'pichincha',
      nombre: 'Pichincha (Oroño y Güemes)',
      lat: -32.9348,
      lon: -60.6534,
      orden: 1,
    },
    {
      id: 'pellegrini',
      nombre: 'Av. Pellegrini y Corrientes',
      lat: -32.9555,
      lon: -60.6508,
      orden: 2,
    },
    {
      id: 'monumento',
      nombre: 'Monumento a la Bandera',
      lat: -32.9477,
      lon: -60.6304,
      orden: 3,
    },
  ]);
  const [returnToDepot, setReturnToDepot] = useState(true);
  const [loadingTour, setLoadingTour] = useState(false);
  const [tourResult, setTourResult] = useState<DeliveryTourResponse | null>(null);

  // Comprobar estado del backend al montar el componente
  const checkBackendHealth = async () => {
    try {
      setBackendError(null);
      const data = await api.getHealth();
      setHealth(data);
    } catch (err: any) {
      setBackendError(err.message || 'Error de conexión');
      setHealth(null);
    }
  };

  // Cargar presets de Rosario
  const loadPresets = async () => {
    try {
      const data = await api.getPresets();
      setPresets(data);
    } catch (err) {
      console.error('Error al cargar presets:', err);
    }
  };

  useEffect(() => {
    checkBackendHealth();
    loadPresets();
    const interval = setInterval(checkBackendHealth, 15000); // Polling cada 15 segundos
    return () => clearInterval(interval);
  }, []);

  const handleMapClick = (coord: Coordinate) => {
    if (mode === 'route') {
      if (!origin) {
        setOrigin(coord);
        setRouteResult(null);
      } else if (!destination) {
        setDestination(coord);
        setRouteResult(null);
      } else {
        // Reiniciar ciclo de selección
        setOrigin(coord);
        setDestination(null);
        setRouteResult(null);
      }
    } else {
      // Modo ronda: agregar parada
      const newStop: DeliveryWaypoint = {
        id: `stop-${Date.now()}`,
        nombre: `Cliente en (${coord.lat.toFixed(3)}, ${coord.lon.toFixed(3)})`,
        lat: coord.lat,
        lon: coord.lon,
        orden: stops.length + 1,
      };
      setStops([...stops, newStop]);
      setTourResult(null);
    }
  };

  const handleSelectPreset = (type: 'origin' | 'destination', preset: PresetLocation) => {
    setRouteResult(null);
    if (type === 'origin') {
      setOrigin({ lat: preset.lat, lon: preset.lon });
    } else {
      setDestination({ lat: preset.lat, lon: preset.lon });
    }
  };

  const handleResetPoints = () => {
    setOrigin(null);
    setDestination(null);
    setRouteResult(null);
    setRouteError(null);
  };

  const handleCalculateRoute = async () => {
    if (!origin || !destination) return;
    setLoadingRoute(true);
    setRouteError(null);
    try {
      const result = await api.calculateRoute(origin, destination, context);
      setRouteResult(result);
    } catch (err: any) {
      setRouteError(err.message || 'Error al calcular la ruta');
      setRouteResult(null);
    } finally {
      setLoadingRoute(false);
    }
  };

  const handleCalculateTour = async () => {
    if (stops.length === 0) return;
    setLoadingTour(true);
    setRouteError(null);
    try {
      const result = await api.calculateDeliveryTour(
        depot,
        stops,
        context,
        returnToDepot
      );
      setTourResult(result);
    } catch (err: any) {
      setRouteError(err.message || 'Error al calcular la ronda de entregas');
      setTourResult(null);
    } finally {
      setLoadingTour(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 font-sans select-none overflow-hidden">
      {/* 1. Header Superior */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between z-30 shadow-md shrink-0">
        <div className="flex items-center space-x-3">
          <div className="bg-emerald-600 p-2.5 rounded-xl shadow-lg shadow-emerald-900/40">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
              Ruteo de Última Milla
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-slate-700">
                Rosario
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Predicción de Demanda & Algoritmos de Grafos (Dijkstra)
            </p>
          </div>
        </div>

        {/* Selector de Modo (Punto a Punto vs Ronda) */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => {
              setMode('route');
              setRouteResult(null);
              setTourResult(null);
            }}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === 'route'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Punto a Punto</span>
          </button>
          <button
            onClick={() => {
              setMode('tour');
              setRouteResult(null);
              setTourResult(null);
            }}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === 'tour'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Ronda de Entregas</span>
          </button>
        </div>

        {/* Indicador de Estado del Backend y Botón de Auditoría */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 px-3 py-1.5 rounded-full text-xs font-semibold transition-all shadow-sm active:scale-95"
            title="Ver métricas del modelo y reporte de IA"
          >
            <Brain className="w-3.5 h-3.5 text-emerald-400" />
            <span>Modelo & IA</span>
          </button>

          {health?.status === 'online' ? (
            <div className="flex items-center space-x-2 bg-emerald-950/60 border border-emerald-800/80 px-3 py-1.5 rounded-full">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-medium text-emerald-300">
                Backend Conectado ({health.nodes_count.toLocaleString()} nodos)
              </span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 bg-red-950/60 border border-red-800/80 px-3 py-1.5 rounded-full">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500"></span>
              <span className="text-xs font-medium text-red-300">
                {backendError ? 'Backend Desconectado' : 'Conectando...'}
              </span>
              <button
                onClick={checkBackendHealth}
                className="text-red-400 hover:text-white p-0.5"
                title="Reintentar conexión"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* 2. Área Principal: Mapa con Paneles Flotantes Superpuestos */}
      <div className="relative flex-1 w-full h-[calc(100vh-4rem)]">
        <MapViewer
          origin={origin}
          destination={destination}
          stops={tourResult ? tourResult.ordered_stops : [depot, ...stops]}
          staticCoords={routeResult?.static_route.coordinates}
          dynamicCoords={routeResult?.dynamic_route.coordinates}
          tourCoords={tourResult?.coordinates_full}
          onMapClick={handleMapClick}
          mode={mode}
        />

        {/* Panel Izquierdo: Modo Punto a Punto */}
        {mode === 'route' && (
          <div className="absolute top-4 left-4 z-20">
            <ControlPanel
              origin={origin}
              destination={destination}
              context={context}
              presets={presets}
              loading={loadingRoute}
              onContextChange={setContext}
              onCalculateRoute={handleCalculateRoute}
              onSelectPreset={handleSelectPreset}
              onResetPoints={handleResetPoints}
            />
          </div>
        )}

        {/* Panel Izquierdo: Modo Ronda de Entregas con Dijkstra */}
        {mode === 'tour' && (
          <div className="absolute top-4 left-4 z-20">
            <DeliveryTourPanel
              depot={depot}
              stops={stops}
              presets={presets}
              context={context}
              returnToDepot={returnToDepot}
              loading={loadingTour}
              onSelectDepot={setDepot}
              onAddStop={(newStop) => {
                setStops([...stops, newStop]);
                setTourResult(null);
              }}
              onRemoveStop={(id) => {
                setStops(stops.filter((s) => s.id !== id));
                setTourResult(null);
              }}
              onClearStops={() => {
                setStops([]);
                setTourResult(null);
              }}
              onToggleReturnToDepot={setReturnToDepot}
              onContextChange={setContext}
              onCalculateTour={handleCalculateTour}
            />
          </div>
        )}

        {/* Panel Derecho: Métricas de Punto a Punto */}
        {mode === 'route' && routeResult && (
          <div className="absolute top-4 right-4 z-20">
            <MetricsOverlay
              routeData={routeResult}
              onClose={() => setRouteResult(null)}
            />
          </div>
        )}

        {/* Panel Derecho: Métricas de Ronda con Dijkstra */}
        {mode === 'tour' && tourResult && (
          <div className="absolute top-4 right-4 z-20">
            <TourMetricsOverlay
              tourData={tourResult}
              onClose={() => setTourResult(null)}
            />
          </div>
        )}

        {/* Notificación de Error Flotante si falla el cálculo */}
        {routeError && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 bg-red-950/90 border border-red-800 text-red-200 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs backdrop-blur-md">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{routeError}</span>
            <button
              onClick={() => setRouteError(null)}
              className="ml-2 text-red-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}
        {/* Modal de Auditoría del Modelo ML y Documentación de IA */}
        <ModelInfoModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </div>
    </div>
  );
};

export default App;
