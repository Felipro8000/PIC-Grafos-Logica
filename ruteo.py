import osmnx as ox
import networkx as nx
import pandas as pd
import numpy as np
import joblib

# 1. Cargar el modelo predictivo previamente entrenado
print("Cargando el modelo de Machine Learning...")
model = joblib.load("modelo_ultima_milla.pkl")

# 2. Configuración y carga del grafo de Rosario
ox.settings.timeout = 900
ox.settings.overpass_url = "https://overpass.kumi.systems/api"
point = (-32.9468, -60.6393)

print("Cargando la red vial de Rosario...")
G = ox.graph_from_point(point, dist=5000, network_type="drive")

# Definir puntos de Origen y Destino en Rosario 
# OJO: Longitud (X) va primero, Latitud (Y) va después
# Origen: Mi casovich -> Lon: -60.664205, -32.969943
# Destino: Mi 2da casovich <3 -> Lon: -60.6700, Lat: -32.9250
orig_lon, orig_lat = -60.664205, -32.969943
dest_lon, dest_lat = -60.621803, -32.989845

orig_node = ox.distance.nearest_nodes(G, X=orig_lon, Y=orig_lat)
dest_node = ox.distance.nearest_nodes(G, X=dest_lon, Y=dest_lat)

# Ahora proyectamos el grafo a metros para los cálculos del modelo y pesos
G = ox.project_graph(G)

# 3. Calcular tiempos dinámicos con el modelo para cada arista del mapa
print("Calculando tiempos dinámicos con el modelo para cada arista del mapa...")
edges_data = []
edges_keys = []

for u, v, k, data in G.edges(keys=True, data=True):
    length = data.get('length', 10.0)
    feats = {
        'length': length,
        'hora_dia': 18,
        'dia_semana_lunes': 1,
        'dia_semana_martes': 0,
        'dia_semana_miércoles': 0,
        'dia_semana_jueves': 0,
        'dia_semana_viernes': 0,
        'dia_semana_sábado': 0,
        'clima_lluvia': 1,
        'clima_soleado': 0,
        'clima_tormenta': 0,
        'es_feriado_True': 0
    }
    edges_data.append(feats)
    edges_keys.append((u, v, k))

df_pred = pd.DataFrame(edges_data)
df_pred = df_pred.reindex(columns=model.feature_names_in_, fill_value=0)
predicciones = model.predict(df_pred)

for idx, (u, v, k) in enumerate(edges_keys):
    tiempo_estimado = max(1.0, predicciones[idx])
    G[u][v][k]['weight'] = tiempo_estimado

# 4. Calcular la ruta óptima usando A*
print("Calculando la ruta óptima de última milla usando el algoritmo A*...")
ruta = nx.astar_path(G, source=orig_node, target=dest_node, weight='weight')

tiempo_total_segundos = sum(G[ruta[i]][ruta[i+1]][0]['weight'] for i in range(len(ruta)-1))
print(f"\n¡Ruta óptima calculada con éxito!")
print(f" - Tiempo total estimado de entrega: {tiempo_total_segundos / 60:.2f} minutos")
print(f" - Cantidad de tramos recorridos: {len(ruta) - 1}")

# 5. Visualizar la ruta en el mapa (enfocada correctamente)
print("Generando visualización gráfica de la ruta...")
fig, ax = ox.plot_graph_route(G, ruta, route_color='r', route_linewidth=5, node_size=0, figsize=(10, 10))