import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# Fijar semilla para reproducibilidad
np.random.seed(42)

print("Cargando el dataset histórico...")
df_historico = pd.read_csv("dataset_viajes_ultima_milla.csv")

# Preparar variables (Features y Target) mediante One-Hot Encoding
df_ml = pd.get_dummies(df_historico, columns=['dia_semana', 'clima', 'es_feriado'], drop_first=True)

#Ahora 'length' forma parte de las variables de entrada (X) ---
X = df_ml.drop(columns=['tramo_id', 'tiempo_real_viaje', 'velocidad_promedio_historica'])
y = df_ml['tiempo_real_viaje']

# Dividir en entrenamiento (80%) y test (20%)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print("Entrenando el modelo Random Forest Regressor con longitud de tramos...")
model = RandomForestRegressor(n_estimators=50, random_state=42, n_jobs=-1)
model.fit(X_train, y_train)

# Predicciones sobre el conjunto de test
y_pred = model.predict(X_test)

# Métricas obligatorias
mae = mean_absolute_error(y_test, y_pred)
rmse = np.sqrt(mean_squared_error(y_test, y_pred))
r2 = r2_score(y_test, y_pred)

print("\n--- NUEVOS RESULTADOS DEL MODELO ---")
print(f" - MAE (Error Absoluto Medio): {mae:.2f} segundos")
print(f" - RMSE (Raíz del Error Cuadrático Medio): {rmse:.2f} segundos")
print(f" - R² (Coeficiente de Determinación): {r2:.4f}")

import joblib
joblib.dump(model, "modelo_ultima_milla.pkl")
print("¡Modelo guardado exitosamente como 'modelo_ultima_milla.pkl'!")