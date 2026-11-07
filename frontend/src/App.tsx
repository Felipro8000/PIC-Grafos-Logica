import React, { useState, useEffect } from 'react';
import { MapViewer } from './components/MapViewer';
import { api } from './services/api';
import {
  HealthResponse,
  PresetLocation,
  Coordinate,
  DeliveryWaypoint,
} from './types';
import {
  Truck,
  Activity,
  Layers,
  MapPin,
  RefreshCw,
  Navigation,
} from 'lucide-react';

export const App: React.FC = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [presets, setPresets] = useState<PresetLocation[]>([]);
  const [mode, setMode] = useState<'route' | 'tour'>('route');

  // Coordenadas seleccionadas para el MVP base
  const [origin, setOrigin] = useState<Coordinate | null>({
    lat: -32.9477,
    lon: -60.6304,
  }); // Monumento a la Bandera
  const [destination, setDestination] = useState<Coordinate | null>({
    lat: -32.9389,
    lon: -60.6698,
  }); // Terminal de Ómnibus
  const [stops, setStops] = useState<DeliveryWaypoint[]>([]);

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
      } else if (!destination) {
        setDestination(coord);
      } else {
        // Reiniciar ciclo de selección
        setOrigin(coord);
        setDestination(null);
      }
    } else {
      // Modo ronda: agregar parada
      const newStop: DeliveryWaypoint = {
        id: `stop-${Date.now()}`,
        nombre: `Punto #${stops.length + 1}`,
        lat: coord.lat,
        lon: coord.lon,
        orden: stops.length + 1,
      };
      setStops([...stops, newStop]);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 font-sans select-none">
      {/* 1. Header Superior */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between z-30 shadow-md">
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
              Predicción de Demanda & Algoritmos de Grafos (Dijkstra + TSP)
            </p>
          </div>
        </div>

        {/* Selector de Modo (Punto a Punto vs Ronda) */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setMode('route')}
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
            onClick={() => setMode('tour')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === 'tour'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Ronda de Entregas (TSP)</span>
          </button>
        </div>

        {/* Indicador de Estado del Backend */}
        <div className="flex items-center space-x-3">
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

      {/* 2. Área Principal: Mapa Interactivo con Paneles Flotantes */}
      <div className="relative flex-1 w-full h-[calc(100vh-4rem)]">
        <MapViewer
          origin={origin}
          destination={destination}
          stops={stops}
          onMapClick={handleMapClick}
          mode={mode}
        />

        {/* Tarjeta flotante de ayuda / instrucciones rápidas */}
        <div className="absolute top-4 left-4 z-20 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-4 rounded-2xl shadow-2xl max-w-sm">
          <div className="flex items-center space-x-2 mb-2 text-emerald-400">
            <Activity className="w-4 h-4" />
            <h2 className="text-xs font-bold uppercase tracking-wider">
              Modo Interactivo: {mode === 'route' ? 'Punto a Punto' : 'Ronda TSP'}
            </h2>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed mb-3">
            {mode === 'route'
              ? 'Haz clic en el mapa para marcar el Origen (verde) y luego el Destino (rojo). El sistema proyectará los nodos más cercanos sobre la red vial de Rosario.'
              : 'Haz clic en el mapa para añadir paradas de entrega. El algoritmo calculará la secuencia óptima de visita.'}
          </p>

          {/* Presets rápidos de Rosario */}
          {presets.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Lugares emblemáticos de Rosario:
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                {presets.slice(0, 6).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      if (mode === 'route') {
                        if (!origin) setOrigin({ lat: p.lat, lon: p.lon });
                        else setDestination({ lat: p.lat, lon: p.lon });
                      } else {
                        setStops([
                          ...stops,
                          {
                            id: p.id,
                            nombre: p.nombre,
                            lat: p.lat,
                            lon: p.lon,
                            orden: stops.length + 1,
                          },
                        ]);
                      }
                    }}
                    className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-md border border-slate-700/60 transition-colors truncate max-w-[160px]"
                    title={p.descripcion}
                  >
                    {p.nombre.split('(')[0]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
