export interface Coordinate {
  lat: number;
  lon: number;
}

export interface ContextParams {
  hora_dia: number;
  dia_semana: string;
  clima: string;
  es_feriado: boolean;
}

export interface RouteLeg {
  route_type: 'estatica' | 'dinamica';
  coordinates: [number, number][]; // [lat, lon]
  distance_meters: number;
  distance_km: number;
  estimated_time_seconds: number;
  estimated_time_minutes: number;
  num_steps: number;
}

export interface RouteComparison {
  time_difference_seconds: number;
  time_difference_minutes: number;
  time_saved_percent: number;
  distance_difference_meters: number;
  faster_route: 'dinamica' | 'estatica' | 'igual';
  insights: string[];
}

export interface RouteResponse {
  static_route: RouteLeg;
  dynamic_route: RouteLeg;
  comparison: RouteComparison;
  context_applied: ContextParams;
}

export interface DeliveryWaypoint {
  id: string;
  nombre: string;
  lat: number;
  lon: number;
  orden?: number;
}

export interface DeliveryTourLeg {
  from_id: string;
  to_id: string;
  from_name: string;
  to_name: string;
  coordinates: [number, number][];
  distance_meters: number;
  time_seconds: number;
}

export interface DeliveryTourResponse {
  ordered_stops: DeliveryWaypoint[];
  legs: DeliveryTourLeg[];
  total_distance_meters: number;
  total_distance_km: number;
  total_time_seconds: number;
  total_time_minutes: number;
  coordinates_full: [number, number][];
  context_applied: ContextParams;
}

export interface ModelMetricsResponse {
  mae: number;
  rmse: number;
  r2: number;
  n_train: number;
  n_test: number;
  features: string[];
  feature_importances: Record<string, number>;
  descripcion: string;
}

export interface PresetLocation {
  id: string;
  nombre: string;
  descripcion: string;
  lat: number;
  lon: number;
  categoria: 'deposito' | 'entrega';
}

export interface HealthResponse {
  status: string;
  service: string;
  graph_loaded: boolean;
  nodes_count: number;
  edges_count: number;
  model_loaded: boolean;
}

