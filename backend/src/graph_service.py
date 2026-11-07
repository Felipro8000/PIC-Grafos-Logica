import os
import joblib
import numpy as np
import networkx as nx
from typing import List, Tuple, Dict, Optional
from scipy.spatial import cKDTree

from .schemas import (
    Coordinate, ContextParams, RouteLeg, RouteComparison, RouteResponse,
    DeliveryWaypoint, DeliveryTourLeg, DeliveryTourResponse
)
from .ml_service import ml_service

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
GRAPH_PATH = os.path.join(DATA_DIR, "grafo_rosario.pkl")

class GraphService:
    def __init__(self):
        self.G = None
        self.kdtree = None
        self.node_ids: List[int] = []
        self.node_coords: np.ndarray = np.empty((0, 2))
        self.edge_keys: List[Tuple] = []
        self.edge_lengths: np.ndarray = np.empty(0)
        self.edge_names: List[str] = []
        self.current_context_hash: Optional[str] = None
        self._load_graph()

    def _load_graph(self):
        if not os.path.exists(GRAPH_PATH):
            print(f"[GraphService] AVISO: {GRAPH_PATH} no encontrado aún.")
            return

        print(f"[GraphService] Cargando grafo desde {GRAPH_PATH}...")
        self.G = joblib.load(GRAPH_PATH)
        print(f"[GraphService] Grafo cargado: {self.G.number_of_nodes()} nodos, {self.G.number_of_edges()} aristas.")

        # Construir índice espacial cKDTree para búsquedas de nodo más cercano en microsegundos
        nodes_list = []
        coords_list = []
        for node_id, data in self.G.nodes(data=True):
            lat = data.get('y')
            lon = data.get('x')
            if lat is not None and lon is not None:
                nodes_list.append(node_id)
                coords_list.append([lat, lon])

        self.node_ids = nodes_list
        self.node_coords = np.array(coords_list)
        if len(self.node_coords) > 0:
            self.kdtree = cKDTree(self.node_coords)

        # Indexar aristas para inferencia vectorizada rápida
        keys = []
        lengths = []
        names = []
        for u, v, k, data in self.G.edges(keys=True, data=True):
            keys.append((u, v, k))
            l = float(data.get('length', 20.0))
            lengths.append(l)
            names.append(str(data.get('name', '')))
            # Inicializar pesos base si no existen
            if 'weight_distance' not in data:
                data['weight_distance'] = l
            if 'weight_dynamic' not in data:
                data['weight_dynamic'] = l / (40.0 * 1000 / 3600)

        self.edge_keys = keys
        self.edge_lengths = np.array(lengths)
        self.edge_names = names
        print("[GraphService] Indexación espacial y de aristas completada exitosamente.")

    def get_nearest_node(self, lat: float, lon: float) -> int:
        if self.G is None:
            self._load_graph()
            if self.G is None:
                raise RuntimeError("El grafo vial de Rosario aún no está cargado.")

        if self.kdtree is None or len(self.node_ids) == 0:
            raise RuntimeError("El índice espacial de nodos no está disponible.")

        # Consulta ultra-rápida con KDTree (coordenadas [lat, lon])
        distance, idx = self.kdtree.query([lat, lon])
        return self.node_ids[idx]

    def update_dynamic_weights(self, context: ContextParams):
        """
        Recalcula el peso 'weight_dynamic' de todas las aristas usando el modelo ML.
        Se apoya en inferencia batch vectorizada.
        """
        if self.G is None:
            self._load_graph()
            if self.G is None:
                return

        context_hash = f"{context.hora_dia}_{context.dia_semana}_{context.clima}_{context.es_feriado}"
        if self.current_context_hash == context_hash:
            # Ya se encuentran calculados para este mismo contexto
            return

        # 1. Inferencia batch con el modelo Random Forest
        predicted_times = ml_service.predict_travel_times_batch(self.edge_lengths, context)

        # 2. Regla urbana complementaria: penalización adicional en Av. Pellegrini durante lluvia/tormenta
        clima_lluvia = context.clima.lower() in ['lluvia', 'tormenta']
        
        # 3. Asignación directa a las aristas del grafo NetworkX
        for idx, (u, v, k) in enumerate(self.edge_keys):
            t_estimado = float(predicted_times[idx])
            if clima_lluvia and 'pellegrini' in self.edge_names[idx].lower():
                t_estimado *= 1.6  # Penalización severa por congestión y anegamiento
            self.G[u][v][k]['weight_dynamic'] = max(1.0, t_estimado)

        self.current_context_hash = context_hash

    def _extract_path_details(self, path_nodes: List[int], weight_attr: str) -> Tuple[List[List[float]], float, float]:
        coords: List[List[float]] = []
        total_distance = 0.0
        total_time = 0.0

        for i, node in enumerate(path_nodes):
            lat = self.G.nodes[node].get('y')
            lon = self.G.nodes[node].get('x')
            if lat is not None and lon is not None:
                coords.append([float(lat), float(lon)])

            if i < len(path_nodes) - 1:
                next_node = path_nodes[i + 1]
                edge_data = self.G.get_edge_data(node, next_node)
                if edge_data:
                    # En MultiDiGraph tomamos la arista con menor peso
                    best_key = min(edge_data.keys(), key=lambda k: edge_data[k].get(weight_attr, float('inf')))
                    d = edge_data[best_key]
                    total_distance += float(d.get('length', 0.0))
                    total_time += float(d.get('weight_dynamic', d.get('length', 0.0) / 11.11))

        return coords, total_distance, total_time

    def compute_route(self, origin: Coordinate, destination: Coordinate, context: ContextParams) -> RouteResponse:
        if self.G is None:
            self._load_graph()
            if self.G is None:
                raise RuntimeError("El grafo de la ciudad de Rosario aún no está cargado.")

        orig_node = self.get_nearest_node(origin.lat, origin.lon)
        dest_node = self.get_nearest_node(destination.lat, destination.lon)

        # 1. Actualizar pesos dinámicos según el contexto meteorológico y horario
        self.update_dynamic_weights(context)

        # 2. Dijkstra Estático (minimiza distancia física)
        try:
            static_nodes = nx.dijkstra_path(self.G, source=orig_node, target=dest_node, weight='weight_distance')
        except nx.NetworkXNoPath:
            raise ValueError("No existe un camino accesible entre los puntos seleccionados.")

        # 3. Dijkstra Dinámico (minimiza tiempo predicho por ML)
        try:
            dynamic_nodes = nx.dijkstra_path(self.G, source=orig_node, target=dest_node, weight='weight_dynamic')
        except nx.NetworkXNoPath:
            dynamic_nodes = static_nodes

        # 4. Extraer métricas y geometrías [lat, lon]
        static_coords, static_dist, static_time_dyn = self._extract_path_details(static_nodes, 'weight_distance')
        dynamic_coords, dynamic_dist, dynamic_time_dyn = self._extract_path_details(dynamic_nodes, 'weight_dynamic')

        # Si el tiempo estático fue calculado con velocidad promedio fija (40 km/h = 11.11 m/s):
        static_time_nominal = static_dist / (40.0 * 1000 / 3600)

        # Comparativa y análisis cualitativo
        time_diff_s = round(static_time_dyn - dynamic_time_dyn, 1)
        dist_diff_m = round(dynamic_dist - static_dist, 1)
        time_saved_pct = round(max(0.0, (time_diff_s / max(1.0, static_time_dyn)) * 100), 1)

        insights = []
        if dynamic_nodes != static_nodes:
            insights.append("El modelo eligió una ruta alternativa para evitar arterias congestionadas.")
            if context.clima in ['lluvia', 'tormenta']:
                insights.append(f"Se evitaron tramos críticos con riesgo de anegamiento bajo {context.clima}.")
            if 7 <= context.hora_dia <= 9 or 17 <= context.hora_dia <= 19:
                insights.append(f"Se optimizó el recorrido sorteando congestión de hora pico ({context.hora_dia}:00 h).")
        else:
            insights.append("La ruta más corta geográfica coincide con la más rápida bajo estas condiciones.")

        if time_diff_s > 0:
            faster = "dinamica"
            insights.append(f"Ahorro estimado: {round(time_diff_s / 60, 1)} minutos.")
        elif time_diff_s < 0:
            faster = "estatica"
        else:
            faster = "igual"

        return RouteResponse(
            static_route=RouteLeg(
                route_type="estatica",
                coordinates=static_coords,
                distance_meters=round(static_dist, 1),
                distance_km=round(static_dist / 1000, 2),
                estimated_time_seconds=round(static_time_dyn, 1),
                estimated_time_minutes=round(static_time_dyn / 60, 1),
                num_steps=len(static_nodes)
            ),
            dynamic_route=RouteLeg(
                route_type="dinamica",
                coordinates=dynamic_coords,
                distance_meters=round(dynamic_dist, 1),
                distance_km=round(dynamic_dist / 1000, 2),
                estimated_time_seconds=round(dynamic_time_dyn, 1),
                estimated_time_minutes=round(dynamic_time_dyn / 60, 1),
                num_steps=len(dynamic_nodes)
            ),
            comparison=RouteComparison(
                time_difference_seconds=time_diff_s,
                time_difference_minutes=round(time_diff_s / 60, 2),
                time_saved_percent=time_saved_pct,
                distance_difference_meters=dist_diff_m,
                faster_route=faster,
                insights=insights
            ),
            context_applied=context
        )

    def compute_delivery_tour(self, depot: DeliveryWaypoint, stops: List[DeliveryWaypoint], context: ContextParams, return_to_depot: bool = True) -> DeliveryTourResponse:
        """
        Calcula la Ronda de Entregas óptima para múltiples paradas usando una
        heurística de Vecino Más Cercano (TSP) sobre Dijkstra con pesos dinámicos de ML.
        """
        if self.G is None:
            self._load_graph()

        self.update_dynamic_weights(context)

        # Mapear todos los puntos a nodos del grafo
        all_points = [depot] + stops
        node_map = {p.id: self.get_nearest_node(p.lat, p.lon) for p in all_points}

        # Matriz de tiempos calculada con Dijkstra sobre pesos dinámicos
        point_ids = [p.id for p in all_points]
        n_points = len(point_ids)
        cost_matrix: Dict[Tuple[str, str], Tuple[float, float, List[int]]] = {}

        for p1 in point_ids:
            for p2 in point_ids:
                if p1 == p2:
                    continue
                u = node_map[p1]
                v = node_map[p2]
                try:
                    nodes = nx.dijkstra_path(self.G, source=u, target=v, weight='weight_dynamic')
                    coords, dist, time_s = self._extract_path_details(nodes, 'weight_dynamic')
                    cost_matrix[(p1, p2)] = (time_s, dist, nodes)
                except nx.NetworkXNoPath:
                    cost_matrix[(p1, p2)] = (999999.0, 999999.0, [])

        # Heurística TSP de Vecino Más Cercano (Nearest Neighbor)
        unvisited = [s.id for s in stops]
        current_id = depot.id
        ordered_ids = [current_id]

        while unvisited:
            next_id = min(unvisited, key=lambda target: cost_matrix.get((current_id, target), (float('inf'),))[0])
            unvisited.remove(next_id)
            ordered_ids.append(next_id)
            current_id = next_id

        if return_to_depot and len(stops) > 0:
            ordered_ids.append(depot.id)

        # Reconstruir piernas de viaje y geometría unificada
        legs: List[DeliveryTourLeg] = []
        full_coords: List[List[float]] = []
        total_dist = 0.0
        total_time = 0.0

        id_to_obj = {p.id: p for p in all_points}

        for i in range(len(ordered_ids) - 1):
            src_id = ordered_ids[i]
            dst_id = ordered_ids[i + 1]
            time_s, dist_m, nodes = cost_matrix.get((src_id, dst_id), (0.0, 0.0, []))
            coords, _, _ = self._extract_path_details(nodes, 'weight_dynamic')

            legs.append(DeliveryTourLeg(
                from_id=src_id,
                to_id=dst_id,
                from_name=id_to_obj[src_id].nombre or src_id,
                to_name=id_to_obj[dst_id].nombre or dst_id,
                coordinates=coords,
                distance_meters=round(dist_m, 1),
                time_seconds=round(time_s, 1)
            ))
            total_dist += dist_m
            total_time += time_s
            full_coords.extend(coords)

        # Asignar orden de visita a cada parada de entrega
        ordered_stops: List[DeliveryWaypoint] = []
        order_idx = 1
        for pid in ordered_ids:
            p_obj = id_to_obj[pid].model_copy()
            p_obj.orden = order_idx
            ordered_stops.append(p_obj)
            order_idx += 1

        return DeliveryTourResponse(
            ordered_stops=ordered_stops,
            legs=legs,
            total_distance_meters=round(total_dist, 1),
            total_distance_km=round(total_dist / 1000, 2),
            total_time_seconds=round(total_time, 1),
            total_time_minutes=round(total_time / 60, 1),
            coordinates_full=full_coords,
            context_applied=context
        )

# Instancia singleton
graph_service = GraphService()

