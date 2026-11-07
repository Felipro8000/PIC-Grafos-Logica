import React, { useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import { Coordinate, DeliveryWaypoint } from '../types';

// Centrado en el corazón geográfico de Rosario
const ROSARIO_CENTER: [number, number] = [-32.952, -60.655];

// Generador de iconos HTML con estilos modernos para evitar problemas de assets en Leaflet
const createCustomIcon = (color: string, label: string, size: number = 32) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        background-color: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: ${size > 30 ? '14px' : '11px'};
        border: 2px solid white;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      ">
        ${label}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
};

const originIcon = createCustomIcon('#10b981', 'O', 34); // Verde Esmeralda
const destIcon = createCustomIcon('#ef4444', 'D', 34);   // Rojo
const depotIcon = createCustomIcon('#f59e0b', '🏠', 36);  // Ámbar

// Subcomponente para capturar clics en el mapa
const MapEventsHandler: React.FC<{ onMapClick?: (coord: Coordinate) => void }> = ({
  onMapClick,
}) => {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick({ lat: e.latlng.lat, lon: e.latlng.lng });
      }
    },
  });
  return null;
};

// Subcomponente para ajustar automáticamente la vista cuando cambian las coordenadas de la ruta
const AutoBounds: React.FC<{ coords: [number, number][] }> = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (coords && coords.length > 1) {
      const bounds = L.latLngBounds(coords.map((c) => [c[0], c[1]]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [coords, map]);
  return null;
};

interface MapViewerProps {
  origin?: Coordinate | null;
  destination?: Coordinate | null;
  stops?: DeliveryWaypoint[];
  staticCoords?: [number, number][];
  dynamicCoords?: [number, number][];
  tourCoords?: [number, number][];
  onMapClick?: (coord: Coordinate) => void;
  mode?: 'route' | 'tour';
}

export const MapViewer: React.FC<MapViewerProps> = ({
  origin,
  destination,
  stops = [],
  staticCoords = [],
  dynamicCoords = [],
  tourCoords = [],
  onMapClick,
  mode = 'route',
}) => {
  // Lista de coordenadas activas para enfocar el mapa
  const activeRouteCoords =
    mode === 'tour' && tourCoords.length > 0
      ? tourCoords
      : dynamicCoords.length > 0
      ? dynamicCoords
      : staticCoords;

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={ROSARIO_CENTER}
        zoom={13}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        {/* Capa de OpenStreetMap (100% gratuita, libre y sin API keys) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapEventsHandler onMapClick={onMapClick} />
        <AutoBounds coords={activeRouteCoords} />

        {/* 1. Trazado de Ruta Estática (Azul / Grisáceo) */}
        {mode === 'route' && staticCoords.length > 0 && (
          <Polyline
            positions={staticCoords}
            pathOptions={{
              color: '#3b82f6',
              weight: 4,
              opacity: 0.7,
              dashArray: '8, 8',
            }}
          >
            <Popup>
              <div className="text-slate-800 text-xs">
                <strong>Ruta Estática (Distancia Mínima)</strong>
                <p>Calculada según la distancia geográfica más corta.</p>
              </div>
            </Popup>
          </Polyline>
        )}

        {/* 2. Trazado de Ruta Dinámica (Verde Esmeralda - Optimizada con ML) */}
        {mode === 'route' && dynamicCoords.length > 0 && (
          <Polyline
            positions={dynamicCoords}
            pathOptions={{
              color: '#10b981',
              weight: 6,
              opacity: 0.9,
            }}
          >
            <Popup>
              <div className="text-slate-800 text-xs">
                <strong className="text-emerald-700">Ruta Dinámica (Optimizada con ML)</strong>
                <p>Calculada minimizando el tiempo real predicho por el modelo.</p>
              </div>
            </Popup>
          </Polyline>
        )}

        {/* 3. Trazado de Ronda de Entregas TSP (Púrpura / Índigo) */}
        {mode === 'tour' && tourCoords.length > 0 && (
          <Polyline
            positions={tourCoords}
            pathOptions={{
              color: '#8b5cf6',
              weight: 5,
              opacity: 0.9,
            }}
          >
            <Popup>
              <div className="text-slate-800 text-xs">
                <strong className="text-purple-700">Circuito de Entregas Optimizado</strong>
                <p>Itinerario óptimo calculado mediante heurística TSP sobre pesos dinámicos.</p>
              </div>
            </Popup>
          </Polyline>
        )}

        {/* Marcador de Origen (solo visible en modo Punto a Punto) */}
        {mode === 'route' && origin && (
          <Marker position={[origin.lat, origin.lon]} icon={originIcon}>
            <Popup>
              <div className="text-slate-800 text-xs">
                <strong className="text-emerald-700">Punto de Origen</strong>
                <p>Lat: {origin.lat.toFixed(4)}, Lon: {origin.lon.toFixed(4)}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Marcador de Destino (solo visible en modo Punto a Punto) */}
        {mode === 'route' && destination && (
          <Marker position={[destination.lat, destination.lon]} icon={destIcon}>
            <Popup>
              <div className="text-slate-800 text-xs">
                <strong className="text-red-700">Punto de Destino</strong>
                <p>Lat: {destination.lat.toFixed(4)}, Lon: {destination.lon.toFixed(4)}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Marcadores de la Ronda de Entregas con número secuencial */}
        {mode === 'tour' &&
          stops.map((stop, idx) => {
            const isDepot = idx === 0 || stop.id === 'deposito';
            const icon = isDepot
              ? depotIcon
              : createCustomIcon('#8b5cf6', String(stop.orden || idx + 1), 32);

            return (
              <Marker
                key={`${stop.id}-${idx}`}
                position={[stop.lat, stop.lon]}
                icon={icon}
              >
                <Popup>
                  <div className="text-slate-800 text-xs">
                    <strong className="text-purple-700">
                      {isDepot ? 'Depósito Central' : `Parada #${stop.orden || idx + 1}`}
                    </strong>
                    <p className="font-medium">{stop.nombre}</p>
                    <p>Lat: {stop.lat.toFixed(4)}, Lon: {stop.lon.toFixed(4)}</p>
                  </div>
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>
    </div>
  );
};

