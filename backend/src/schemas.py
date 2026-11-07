from typing import List, Dict, Optional
from pydantic import BaseModel, Field

class Coordinate(BaseModel):
    lat: float = Field(..., description="Latitud en grados decimales", ge=-90.0, le=90.0)
    lon: float = Field(..., description="Longitud en grados decimales", ge=-180.0, le=180.0)

class ContextParams(BaseModel):
    hora_dia: int = Field(18, ge=0, le=23, description="Hora de inicio del viaje (0 a 23)")
    dia_semana: str = Field("lunes", description="Día de la semana: lunes, martes, miércoles, jueves, viernes, sábado, domingo")
    clima: str = Field("lluvia", description="Condición meteorológica: soleado, lluvia, tormenta")
    es_feriado: bool = Field(False, description="Indica si la fecha corresponde a un día feriado")

class RouteRequest(BaseModel):
    origin: Coordinate
    destination: Coordinate
    context: ContextParams

class RouteLeg(BaseModel):
    route_type: str = Field(..., description="Tipo de ruta: 'estatica' o 'dinamica'")
    coordinates: List[List[float]] = Field(..., description="Lista de puntos [latitud, longitud] para trazar en Leaflet")
    distance_meters: float
    distance_km: float
    estimated_time_seconds: float
    estimated_time_minutes: float
    num_steps: int

class RouteComparison(BaseModel):
    time_difference_seconds: float
    time_difference_minutes: float
    time_saved_percent: float
    distance_difference_meters: float
    faster_route: str
    insights: List[str]

class RouteResponse(BaseModel):
    static_route: RouteLeg
    dynamic_route: RouteLeg
    comparison: RouteComparison
    context_applied: ContextParams

class DeliveryWaypoint(BaseModel):
    id: str
    nombre: Optional[str] = "Punto de entrega"
    lat: float
    lon: float
    orden: Optional[int] = None

class DeliveryTourRequest(BaseModel):
    depot: DeliveryWaypoint
    stops: List[DeliveryWaypoint]
    context: ContextParams
    return_to_depot: bool = True

class DeliveryTourLeg(BaseModel):
    from_id: str
    to_id: str
    from_name: str
    to_name: str
    coordinates: List[List[float]]
    distance_meters: float
    time_seconds: float

class DeliveryTourResponse(BaseModel):
    ordered_stops: List[DeliveryWaypoint]
    legs: List[DeliveryTourLeg]
    total_distance_meters: float
    total_distance_km: float
    total_time_seconds: float
    total_time_minutes: float
    coordinates_full: List[List[float]]
    context_applied: ContextParams

class ModelMetricsResponse(BaseModel):
    mae: float
    rmse: float
    r2: float
    n_train: int
    n_test: int
    features: List[str]
    feature_importances: Dict[str, float]
    descripcion: str
