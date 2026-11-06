import osmnx as ox
import networkx as nx
import pandas as pd
import numpy as np
import random
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# 1. Configuración y descarga del mapa de Rosario
ox.settings.timeout = 600
ox.settings.overpass_url = "https://overpass.kumi.systems/api"
ox.settings.overpass_rate_limit = False

print("Descargando la red vial completa de Rosario...")
G = ox.graph_from_place("Rosario, Santa Fe, Argentina", network_type="drive")
G = ox.project_graph(G)
print(f"¡Mapa descargado! Nodos: {G.number_of_nodes()}, Aristas: {G.number_of_edges()}")

# 2. Convertir aristas a DataFrame
edges_gdf = ox.graph_to_gdfs(G, nodes=False, edges=True).reset_index()
edges_gdf['tramo_id'] = edges_gdf['u'].astype(str) + "_" + edges_gdf['v'].astype(str) + "_" + edges_gdf['key'].astype(str)

tramos_base = edges_gdf[['tramo_id', 'u', 'v', 'length', 'maxspeed', 'name', 'highway', 'geometry']].copy()

# Limpiar velocidad máxima base
def clean_maxspeed(val):
    if isinstance(val, list):
        val = val[0]
    try:
        return float(str(val).replace('km/h', '').strip())
    except:
        return 40.0 # Velocidad por defecto

tramos_base['velocidad_base'] = tramos_base['maxspeed'].apply(clean_maxspeed)
tramos_base = trames_base = tramos_base.drop(columns=['maxspeed'])

# 3. Generación del Dataset Histórico Inteligente (con tus reglas urbanas)
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
    
    # --- APLICANDO TUS REGLAS URBANAS ---
    
    # A. Tipo de calle (Avenidas vs Calles normales)
    # En OSM, las avenidas suelen figurar como 'primary', 'secondary' o 'tertiary'
    tipo_via = str(tramo['highway'])
    es_avenida = any(v in tipo_via for v in ['primary', 'secondary', 'trunk'])
    if es_avenida:
        vel_base *= 1.3  # Las avenidas son aprox 1.3 más rápidas
        
    # B. Madrugada (1 AM a 6 AM): Semáforos intermitentes, fluidez mucho mayor
    if 1 <= hora <= 6:
        vel_base *= 1.4  # Mucho más ágil por semáforos intermitentes
        
    # C. Calles cortadas o residenciales angostas (etiquetadas como 'residential' o 'living_street')
    es_residencial = 'residential' in tipo_via or 'living_street' in tipo_via
    if es_residencial:
        vel_base /= 1.2  # Un poquito más lentas (1.2 veces más lentas)

    # D. Factor Hora Pico tradicional (si no es madrugada ni feriado)
    factor_hora = 1.0
    if 1 <= hora <= 6:
        factor_hora = 1.0 # Ya compensado arriba
    elif not feriado and dia not in ['sábado', 'domingo']:
        if 7 <= hora <= 9 or 17 <= hora <= 19:
            factor_hora = 0.55 # Tráfico denso
        elif 10 <= hora <= 16:
            factor_hora = 0.80
            
    # E. Factor Clima y la regla especial de Bv. Pellegrini
    factor_clima = 1.0
    nombre_calle = str(tramo['name'])
    
    if 'Pellegrini' in nombre_calle and clima in ['lluvia', 'tormenta']:
        factor_clima = 0.50 # ¡Se inunda y se vuelve 2 veces más lenta!
    elif clima == 'lluvia':
        factor_clima = 0.85
    elif clima == 'tormenta':
        factor_clima = 0.65
        
    # Velocidad promedio final calculada para el registro
    vel_promedio_historica = vel_base * factor_hora * factor_clima
    vel_promedio_historica += np.random.normal(0, 1.5) # Pequeño ruido realista
    vel_promedio_historica = max(5.0, vel_promedio_historica)
    
    # Tiempo real de viaje en segundos = (Distancia en metros / Velocidad en m/s)
    vel_ms = vel_promedio_historica * (1000 / 3600)
    tiempo_real = tramo['length'] / vel_ms
    tiempo_real = max(1.0, tiempo_real)
    
    registros.append({
        'tramo_id': tramo['tramo_id'],
        'hora_dia': hora,
        'dia_semana': dia,
        'clima': clima,
        'es_feriado': feriado,
        'velocidad_promedio_historica': round(vel_promedio_historica, 2),
        'tiempo_real_viaje': round(tiempo_real, 2)
    })

df_historico = pd.DataFrame(registros)
df_historico.to_csv("dataset_viajes_ultima_milla.csv", index=False)
print("¡Dataset guardado como 'dataset_viajes_ultima_milla.csv'!")

# 4. REQUISITO 1: Entrenar el Modelo de Regresión y Evaluar Métricas
print("\n--- ENTRENANDO EL MODELO PREDICTIVO ---")

# Preparar variables (Features y Target)
# Convertimos categóricas (día y clima) a números con One-Hot Encoding
df_ml = pd.get_dummies(df_historico, columns=['dia_semana', 'clima', 'es_feriado'], drop_first=True)

X = df_ml.drop(columns=['tramo_id', 'tiempo_real_viaje', 'velocidad_promedio_historica'])
y = df_ml['tiempo_real_viaje']

# Dividir en conjunto de entrenamiento (80%) y test (20%)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Entrenar un Random Forest Regressor
model = RandomForestRegressor(n_estimators=50, random_state=42, n_jobs=-1)
model.fit(X_train, y_train)

# Predecir sobre el conjunto de test
y_pred = model.predict(X_test)

# Calcular métricas obligatorias
mae = mean_absolute_error(y_test, y_pred)
rmse = np.sqrt(mean_squared_error(y_test, y_pred))
r2 = r2_score(y_test, y_pred)

print(f"Métricas del Modelo:")
print(f" - MAE (Error Absoluto Medio): {mae:.2f} segundos")
print(f" - RMSE (Raíz del Error Cuadrático Medio): {rmse:.2f} segundos")
print(f" - R² (Coeficiente de Determinación): {r2:.4f}")