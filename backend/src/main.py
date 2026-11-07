import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict

from .schemas import (
    RouteRequest, RouteResponse,
    DeliveryTourRequest, DeliveryTourResponse,
    ModelMetricsResponse
)
from .presets import PRESET_LOCATIONS
from .ml_service import ml_service
from .graph_service import graph_service

app = FastAPI(
    title="API de Ruteo de Última Milla",
    description="API para optimización de logística urbana en Rosario integrando Machine Learning y Algoritmos de Grafos (Dijkstra y TSP).",
    version="1.0.0"
)

# Configuración de CORS para permitir peticiones desde React/Vite (localhost:5173 u otros orígenes)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health", summary="Estado del sistema")
def health_check():
    return {
        "status": "online",
        "service": "Ruteo de Última Milla - Rosario",
        "graph_loaded": graph_service.G is not None,
        "nodes_count": graph_service.G.number_of_nodes() if graph_service.G is not None else 0,
        "edges_count": graph_service.G.number_of_edges() if graph_service.G is not None else 0,
        "model_loaded": ml_service.model is not None
    }

@app.get("/api/presets", summary="Obtener puntos de interés predefinidos de Rosario")
def get_presets() -> List[Dict]:
    """Retorna lugares emblemáticos de Rosario para facilitar pruebas rápidas en la web."""
    return PRESET_LOCATIONS

@app.get("/api/model/metrics", summary="Obtener métricas y detalles del modelo de Machine Learning")
def get_model_metrics() -> Dict:
    """Devuelve MAE, RMSE, R² y la importancia de cada variable para la auditoría de los docentes."""
    metrics = ml_service.get_metrics()
    if not metrics or metrics.get("r2", 0) == 0:
        raise HTTPException(status_code=503, detail="El modelo aún se encuentra entrenando o no está disponible.")
    return metrics

@app.post("/api/route", response_model=RouteResponse, summary="Calcular y comparar ruta estática vs dinámica")
def calculate_route(request: RouteRequest):
    """
    Calcula simultáneamente:
    1. Ruta estática (camino mínimo por distancia física).
    2. Ruta dinámica (camino mínimo por tiempo predicho con Random Forest según clima, hora y feriado).
    """
    try:
        return graph_service.compute_route(
            origin=request.origin,
            destination=request.destination,
            context=request.context
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al calcular la ruta: {str(e)}")

@app.post("/api/delivery-tour", response_model=DeliveryTourResponse, summary="Calcular ronda de entregas (multi-parada)")
def calculate_delivery_tour(request: DeliveryTourRequest):
    """
    Resuelve el problema de la ronda de entregas (TSP) ordenando los puntos de parada
    mediante pesos dinámicos de tiempo y retornando la secuencia óptima paso a paso.
    """
    try:
        if not request.stops:
            raise HTTPException(status_code=400, detail="Debe proporcionar al menos un punto de entrega.")
        return graph_service.compute_delivery_tour(
            depot=request.depot,
            stops=request.stops,
            context=request.context,
            return_to_depot=request.return_to_depot
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al calcular la ronda de entregas: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.src.main:app", host="0.0.0.0", port=8000, reload=True)
