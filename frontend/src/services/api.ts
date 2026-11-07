import {
  HealthResponse,
  PresetLocation,
  ModelMetricsResponse,
  Coordinate,
  ContextParams,
  RouteResponse,
  DeliveryWaypoint,
  DeliveryTourResponse
} from '../types';

// En desarrollo usamos el proxy '/api' de Vite o la variable VITE_API_URL
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const api = {
  async getHealth(): Promise<HealthResponse> {
    const res = await fetch(`${BASE_URL}/health`);
    if (!res.ok) throw new Error('No se pudo conectar con el backend');
    return res.json();
  },

  async getPresets(): Promise<PresetLocation[]> {
    const res = await fetch(`${BASE_URL}/presets`);
    if (!res.ok) throw new Error('Error al obtener lugares predefinidos');
    return res.json();
  },

  async getModelMetrics(): Promise<ModelMetricsResponse> {
    const res = await fetch(`${BASE_URL}/model/metrics`);
    if (!res.ok) throw new Error('Error al obtener métricas del modelo');
    return res.json();
  },

  async calculateRoute(
    origin: Coordinate,
    destination: Coordinate,
    context: ContextParams
  ): Promise<RouteResponse> {
    const res = await fetch(`${BASE_URL}/route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin, destination, context }),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Error al calcular la ruta');
    }
    return res.json();
  },

  async calculateDeliveryTour(
    depot: DeliveryWaypoint,
    stops: DeliveryWaypoint[],
    context: ContextParams,
    returnToDepot: boolean = true
  ): Promise<DeliveryTourResponse> {
    const res = await fetch(`${BASE_URL}/delivery-tour`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        depot,
        stops,
        context,
        return_to_depot: returnToDepot,
      }),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Error al calcular la ronda de entregas');
    }
    return res.json();
  },
};

