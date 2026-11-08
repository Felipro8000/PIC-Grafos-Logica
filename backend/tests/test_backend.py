import os
import sys
import time

# Agregar directorio raíz al sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from backend.src.main import health_check, get_presets, get_model_metrics, calculate_route, calculate_delivery_tour
from backend.src.graph_service import graph_service
from backend.src.ml_service import ml_service
from backend.src.schemas import (
    Coordinate, ContextParams, RouteRequest,
    DeliveryWaypoint, DeliveryTourRequest
)

def test_1_graph_loading():
    print("\n--- TEST 1: Carga y dimensiones del grafo ---")
    start = time.time()
    n_nodes = graph_service.G.number_of_nodes()
    n_edges = graph_service.G.number_of_edges()
    elapsed = time.time() - start
    print(f"Nodos: {n_nodes}, Aristas: {n_edges}. Tiempo de verificación: {elapsed:.4f}s")
    assert n_nodes > 10000, "El grafo debe tener más de 10.000 nodos"
    assert n_edges > 20000, "El grafo debe tener más de 20.000 aristas"
    assert graph_service.kdtree is not None, "El índice espacial cKDTree debe estar inicializado"
    print("TEST 1 PASÓ EXITOSAMENTE.")

def test_2_ml_inference():
    print("\n--- TEST 2: Inferencia de Machine Learning y pesos dinámicos ---")
    metrics = ml_service.get_metrics()
    print(f"Métricas del modelo: R²={metrics['r2']}, MAE={metrics['mae']}s, RMSE={metrics['rmse']}s")
    assert metrics['r2'] > 0.85, "El R² del modelo debe ser superior a 0.85"

    ctx_clear = ContextParams(hora_dia=14, dia_semana="lunes", clima="soleado", es_feriado=False)
    ctx_rain = ContextParams(hora_dia=18, dia_semana="viernes", clima="tormenta", es_feriado=False)

    sample_lengths = graph_service.edge_lengths[:500]
    times_clear = ml_service.predict_travel_times_batch(sample_lengths, ctx_clear)
    times_rain = ml_service.predict_travel_times_batch(sample_lengths, ctx_rain)

    mean_clear = times_clear.mean()
    mean_rain = times_rain.mean()
    print(f"Tiempo promedio tramos (14h Soleado): {mean_clear:.2f}s")
    print(f"Tiempo promedio tramos (18h Tormenta Viernes): {mean_rain:.2f}s")
    assert mean_rain > mean_clear, "Las condiciones adversas deben predecir mayor tiempo de viaje promedio"
    print("TEST 2 PASÓ EXITOSAMENTE.")

def test_3_api_health_and_presets():
    print("\n--- TEST 3: Endpoints /api/health y /api/presets ---")
    health = health_check()
    assert health["status"] == "online"
    assert health["graph_loaded"] is True
    assert health["model_loaded"] is True
    print(f"Health response: {health}")

    presets = get_presets()
    assert len(presets) >= 5
    print(f"Presets disponibles ({len(presets)}): {[p['nombre'] for p in presets[:3]]}...")
    print("TEST 3 PASÓ EXITOSAMENTE.")

def test_4_route_calculation():
    print("\n--- TEST 4: Cálculo de ruta punto a punto (/api/route) ---")
    # Monumento a la Bandera -> Terminal de Ómnibus
    req = RouteRequest(
        origin=Coordinate(lat=-32.9477, lon=-60.6304),
        destination=Coordinate(lat=-32.9389, lon=-60.6698),
        context=ContextParams(
            hora_dia=18,
            dia_semana="viernes",
            clima="tormenta",
            es_feriado=False
        )
    )
    res = calculate_route(req)
    static = res.static_route
    dynamic = res.dynamic_route
    comp = res.comparison

    print(f"Ruta Estática:  {static.distance_km} km, {static.estimated_time_minutes} min, {len(static.coordinates)} puntos")
    print(f"Ruta Dinámica: {dynamic.distance_km} km, {dynamic.estimated_time_minutes} min, {len(dynamic.coordinates)} puntos")
    print(f"Comparativa: Ahorro de tiempo: {comp.time_difference_minutes} min. Insights: {comp.insights}")

    assert len(static.coordinates) > 0
    assert len(dynamic.coordinates) > 0
    first_coord = dynamic.coordinates[0]
    assert -34.0 < first_coord[0] < -32.0, "Latitud debe estar en rango de Rosario"
    assert -61.5 < first_coord[1] < -60.0, "Longitud debe estar en rango de Rosario"
    print("TEST 4 PASÓ EXITOSAMENTE.")

def test_5_delivery_tour():
    print("\n--- TEST 5: Ronda de entregas multi-parada (/api/delivery-tour) ---")
    req = DeliveryTourRequest(
        depot=DeliveryWaypoint(id="deposito", nombre="Centro de Distribución", lat=-32.9250, lon=-60.6700),
        stops=[
            DeliveryWaypoint(id="stop1", nombre="Cliente Monumento", lat=-32.9477, lon=-60.6304),
            DeliveryWaypoint(id="stop2", nombre="Cliente Pellegrini", lat=-32.9555, lon=-60.6508),
            DeliveryWaypoint(id="stop3", nombre="Cliente Pichincha", lat=-32.9348, lon=-60.6534)
        ],
        context=ContextParams(
            hora_dia=18,
            dia_semana="lunes",
            clima="lluvia",
            es_feriado=False
        ),
        return_to_depot=True
    )
    res = calculate_delivery_tour(req)
    print(f"Paradas ordenadas: {[s.nombre + ' (Orden: ' + str(s.orden) + ')' for s in res.ordered_stops]}")
    print(f"Distancia total del tour: {res.total_distance_km} km, Tiempo total: {res.total_time_minutes} min")
    assert len(res.ordered_stops) == 5  # depot + 3 stops + return to depot
    assert len(res.legs) == 4
    assert len(res.coordinates_full) > 0
    # Verificar que el depósito inicial y final no tengan número
    assert res.ordered_stops[0].orden is None
    assert res.ordered_stops[-1].orden is None
    # Verificar que las 3 paradas clientes comiencen desde 1
    assert [s.orden for s in res.ordered_stops[1:4]] == [1, 2, 3]
    assert [s.id for s in res.ordered_stops] == [
        "deposito",
        "stop1",
        "stop2",
        "stop3",
        "deposito"
    ]
    print("TEST 5 PASÓ EXITOSAMENTE.")

if __name__ == "__main__":
    test_1_graph_loading()
    test_2_ml_inference()
    test_3_api_health_and_presets()
    test_4_route_calculation()
    test_5_delivery_tour()
    print("\n==========================================")
    print("¡TODOS LOS TESTS DE LA FASE 2 PASARON OK!")
    print("==========================================")
