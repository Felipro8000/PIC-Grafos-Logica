import osmnx as ox

ox.settings.timeout = 900
ox.settings.overpass_url = "https://overpass.kumi.systems/api"
ox.settings.overpass_rate_limit = False

# Descargamos un área grande de Rosario mediante un punto central y un radio de 5 kilómetros (5000 metros)
# Esto abarca desde el macrocentro hasta gran parte de los barrios principales.
point = (-32.9468, -60.6393)
print("Descargando la red vial amplia de Rosario...")

G = ox.graph_from_point(point, dist=5000, network_type="drive")
G = ox.project_graph(G)

print("¡Mapa descargado con éxito!")
print(f"Nodos: {G.number_of_nodes()}")
print(f"Aristas: {G.number_of_edges()}")