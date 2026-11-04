import osmnx as ox
import pandas as pd
import numpy as np
import random

# Fijar semillas para garantizar reproducibilidad
random.seed(42)
np.random.seed(42)

# 1. Configuración y descarga del mapa de Rosario (Radio de 5 km)
ox.settings.timeout = 900
ox.settings.overpass_url = "https://overpass.kumi.systems/api"
ox.settings.overpass_rate_limit = False

point = (-32.9468, -60.6393)
print("Descargando la red vial amplia de Rosario...")
G = ox.graph_from_point(point, dist=5000, network_type="drive")
G = ox.project_graph(G)
print(f"¡Mapa descargado! Nodos: {G.number_of_nodes()}, Aristas: {G.number_of_edges()}")

# 2. Convertir aristas a DataFrame
edges_gdf = ox.graph_to_gdfs(G, nodes=False, edges=True).reset_index()
edges_gdf['tramo_id'] = edges_gdf['u'].astype(str) + "_" + edges_gdf['v'].astype(str) + "_" + edges_gdf['key'].astype(str)

tramos_base = edges_gdf[['tramo_id', 'length', 'maxspeed', 'name', 'highway']].copy()

def clean_maxspeed(val):
    if isinstance(val, list):
        val = val[0]
    try:
        return float(str(val).replace('km/h', '').strip())
    except:
        return 40.0

tramos_base['velocidad_base'] = tramos_base['maxspeed'].apply(clean_maxspeed)
tramos_base = tramos_base.drop(columns=['maxspeed'])

# 3. Generación del Dataset Histórico con reglas urbanas
horas = list(range(24))
dias_semana = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']
climas = ['soleado', 'lluvia', 'tormenta']

sample_tramos = tramos_base.sample(n=min(3000, len(tramos_base)), random_state=42).copy()
registros = []

print("Generando dataset histórico con reglas de tráfico personalizadas...")
for _ in range(50000):
    tramo = sample_tramos.sample(n=1).iloc[0]
    
    hora = random.choice(horas)
    dia = random.choice(dias_semana)
    clima = random.choice(climas)
    feriado = random.choices([True, False], weights=[0.1, 0.9])[0]
    
    vel_base = tramo['velocidad_base']
    tipo_via = str(tramo['highway'])
    
    # Reglas urbanas
    if any(v in tipo_via for v in ['primary', 'secondary', 'trunk']):
        vel_base *= 1.3
    if 1 <= hora <= 6:
        vel_base *= 1.4
    if 'residential' in tipo_via or 'living_street' in tipo_via:
        vel_base /= 1.2

    factor_hora = 1.0
    if 1 <= hora <= 6:
        factor_hora = 1.0
    elif not feriado and dia not in ['sábado', 'domingo']:
        if 7 <= hora <= 9 or 17 <= hora <= 19:
            factor_hora = 0.55
        elif 10 <= hora <= 16:
            factor_hora = 0.80
            
    factor_clima = 1.0
    nombre_calle = str(tramo['name'])
    if 'Pellegrini' in nombre_calle and clima in ['lluvia', 'tormenta']:
        factor_clima = 0.50
    elif clima == 'lluvia':
        factor_clima = 0.85
    elif clima == 'tormenta':
        factor_clima = 0.65
        
    vel_promedio_historica = vel_base * factor_hora * factor_clima
    vel_promedio_historica += np.random.normal(0, 1.5)
    vel_promedio_historica = max(5.0, vel_promedio_historica)
    
    vel_ms = vel_promedio_historica * (1000 / 3600)
    tiempo_real = tramo['length'] / vel_ms
    tiempo_real = max(1.0, tiempo_real)
    
    registros.append({
        'tramo_id': tramo['tramo_id'],
        'length': tramo['length'],
        'hora_dia': hora,
        'dia_semana': dia,
        'clima': clima,
        'es_feriado': feriado,
        'velocidad_promedio_historica': round(vel_promedio_historica, 2),
        'tiempo_real_viaje': round(tiempo_real, 2)
    })

df_historico = pd.DataFrame(registros)
df_historico.to_csv("dataset_viajes_ultima_milla.csv", index=False)
print("¡Dataset actualizado con éxito e incluída la longitud de los tramos!")