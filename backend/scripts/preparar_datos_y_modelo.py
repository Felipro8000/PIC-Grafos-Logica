import os
import random
import json
import joblib
import numpy as np
import pandas as pd
import osmnx as ox
import networkx as nx
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# 1. Configuración de reproducibilidad y paths
random.seed(42)
np.random.seed(42)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
MODELS_DIR = os.path.join(BASE_DIR, "models")
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)

GRAPH_PATH = os.path.join(DATA_DIR, "grafo_rosario.pkl")
CSV_PATH = os.path.join(DATA_DIR, "dataset_viajes_ultima_milla.csv")
MODEL_PATH = os.path.join(MODELS_DIR, "modelo_ultima_milla.pkl")
METRICS_PATH = os.path.join(MODELS_DIR, "metricas_modelo.json")

# 2. Descarga y serialización del Grafo Vial de Rosario
print("--- PASO 1: Descargando / Verificando red vial de Rosario ---")
ox.settings.timeout = 180
ox.settings.requests_timeout = 180

if os.path.exists(GRAPH_PATH):
    print(f"El grafo ya existe en {GRAPH_PATH}. Cargando...")
    G = joblib.load(GRAPH_PATH)
else:
    print("Descargando la red vial de Rosario desde OpenStreetMap...")
    # Descargamos la red de tipo 'drive' para automóviles/repartos
    G = ox.graph_from_place("Rosario, Santa Fe, Argentina", network_type="drive")
    print(f"Grafo descargado: {G.number_of_nodes()} nodos, {G.number_of_edges()} aristas.")
    
    # Asegurar que todas las aristas tengan 'length' y 'tramo_id'
    for u, v, k, data in G.edges(keys=True, data=True):
        if 'length' not in data:
            data['length'] = 20.0
        data['tramo_id'] = f"{u}_{v}_{k}"
        data['weight_distance'] = float(data['length'])
        data['weight_time'] = float(data['length']) / (40.0 * 1000 / 3600)  # baseline 40 km/h en segundos
        
    print(f"Guardando grafo serializado en {GRAPH_PATH}...")
    joblib.dump(G, GRAPH_PATH, compress=3)
    print("¡Grafo guardado con éxito!")

# 3. Generación del Dataset Sintético con Reglas Urbanas
print("\n--- PASO 2: Generación del dataset sintético de viajes ---")
edges_gdf = ox.graph_to_gdfs(G, nodes=False, edges=True).reset_index()
edges_gdf['tramo_id'] = edges_gdf['u'].astype(str) + "_" + edges_gdf['v'].astype(str) + "_" + edges_gdf['key'].astype(str)

tramos_base = edges_gdf[['tramo_id', 'length', 'maxspeed', 'name', 'highway']].copy()

def clean_maxspeed(val):
    if isinstance(val, list):
        val = val[0]
    try:
        return float(str(val).replace('km/h', '').strip())
    except Exception:
        return 40.0

tramos_base['velocidad_base'] = tramos_base['maxspeed'].apply(clean_maxspeed)

horas = list(range(24))
dias_semana = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']
climas = ['soleado', 'lluvia', 'tormenta']

sample_tramos = tramos_base.sample(n=min(3000, len(tramos_base)), random_state=42).copy()
registros = []

print("Generando 50.000 registros sintéticos...")
for _ in range(50000):
    tramo = sample_tramos.sample(n=1).iloc[0]
    
    hora = random.choice(horas)
    dia = random.choice(dias_semana)
    clima = random.choice(climas)
    feriado = random.choices([True, False], weights=[0.1, 0.9])[0]
    
    vel_base = tramo['velocidad_base']
    tipo_via = str(tramo['highway'])
    
    # Reglas urbanas específicas
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
            factor_hora = 0.55  # Congestión en hora pico
        elif 10 <= hora <= 16:
            factor_hora = 0.80
            
    factor_clima = 1.0
    nombre_calle = str(tramo['name'])
    if 'Pellegrini' in nombre_calle and clima in ['lluvia', 'tormenta']:
        factor_clima = 0.50  # Av. Pellegrini fuertemente anegada
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
        'length': round(float(tramo['length']), 2),
        'hora_dia': hora,
        'dia_semana': dia,
        'clima': clima,
        'es_feriado': feriado,
        'velocidad_promedio_historica': round(vel_promedio_historica, 2),
        'tiempo_real_viaje': round(tiempo_real, 2)
    })

df_historico = pd.DataFrame(registros)
df_historico.to_csv(CSV_PATH, index=False)
print(f"Dataset guardado en {CSV_PATH} con {len(df_historico)} registros.")

# 4. Entrenamiento del Modelo de Regresión
print("\n--- PASO 3: Entrenamiento del modelo Random Forest Regressor ---")
# Codificación explícita One-Hot
df_ml = pd.get_dummies(df_historico, columns=['dia_semana', 'clima', 'es_feriado'], drop_first=True)
feature_names = [col for col in df_ml.columns if col not in ['tramo_id', 'tiempo_real_viaje', 'velocidad_promedio_historica']]

X = df_ml[feature_names]
y = df_ml['tiempo_real_viaje']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print(f"Features seleccionadas ({len(feature_names)}): {feature_names}")
model = RandomForestRegressor(n_estimators=60, max_depth=16, random_state=42, n_jobs=-1)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)
mae = float(mean_absolute_error(y_test, y_pred))
rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))
r2 = float(r2_score(y_test, y_pred))

print(f"\nResultados del Modelo:")
print(f" - MAE:  {mae:.2f} s")
print(f" - RMSE: {rmse:.2f} s")
print(f" - R²:   {r2:.4f}")

# Importancia de features
importancias = {name: round(float(imp), 4) for name, imp in zip(feature_names, model.feature_importances_)}

metricas = {
    "mae": round(mae, 2),
    "rmse": round(rmse, 2),
    "r2": round(r2, 4),
    "n_train": len(X_train),
    "n_test": len(X_test),
    "features": feature_names,
    "feature_importances": importancias,
    "descripcion": "Modelo Random Forest Regressor entrenado con datos sintéticos urbanos de Rosario."
}

joblib.dump(model, MODEL_PATH)
with open(METRICS_PATH, "w", encoding="utf-8") as f:
    json.dump(metricas, f, indent=2, ensure_ascii=False)

print(f"Modelo guardado en {MODEL_PATH}")
print(f"Métricas guardadas en {METRICS_PATH}")
print("\n¡Preparación completada exitosamente!")
