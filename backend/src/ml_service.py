import os
import json
import joblib
import numpy as np
import pandas as pd
from typing import Dict, List, Optional
from .schemas import ContextParams, ModelMetricsResponse

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "models")
MODEL_PATH = os.path.join(MODELS_DIR, "modelo_ultima_milla.pkl")
METRICS_PATH = os.path.join(MODELS_DIR, "metricas_modelo.json")

class MLService:
    def __init__(self):
        self.model = None
        self.metrics = None
        self.feature_names: List[str] = []
        self._load_model_and_metrics()

    def _load_model_and_metrics(self):
        if os.path.exists(MODEL_PATH):
            print(f"[MLService] Cargando modelo desde {MODEL_PATH}...")
            self.model = joblib.load(MODEL_PATH)
            if hasattr(self.model, "feature_names_in_"):
                self.feature_names = list(self.model.feature_names_in_)
            print(f"[MLService] Modelo cargado. Features esperadas ({len(self.feature_names)}): {self.feature_names}")
        else:
            print(f"[MLService] AVISO: {MODEL_PATH} no encontrado aún.")

        if os.path.exists(METRICS_PATH):
            with open(METRICS_PATH, "r", encoding="utf-8") as f:
                self.metrics = json.load(f)
        else:
            self.metrics = {
                "mae": 0.0,
                "rmse": 0.0,
                "r2": 0.0,
                "n_train": 0,
                "n_test": 0,
                "features": self.feature_names,
                "feature_importances": {},
                "descripcion": "Modelo pendiente de entrenamiento."
            }

    def predict_travel_times_batch(self, lengths: np.ndarray, context: ContextParams) -> np.ndarray:
        """
        Predice de forma vectorizada y en batch los tiempos de viaje (en segundos)
        para un conjunto de longitudes bajo un contexto determinado.
        """
        if self.model is None:
            self._load_model_and_metrics()
            if self.model is None:
                # Fallback empírico: 40 km/h baseline si el modelo no está listo
                speed_ms = 40.0 * (1000 / 3600)
                return np.maximum(1.0, lengths / speed_ms)

        n = len(lengths)
        # Construir matriz de features alineada con model.feature_names_in_
        data_dict = {
            'length': lengths,
            'hora_dia': np.full(n, context.hora_dia, dtype=int)
        }

        # Dummies esperados (p. ej. dia_semana_lunes, clima_lluvia, es_feriado_True)
        dia_normalizado = context.dia_semana.lower().strip()
        clima_normalizado = context.clima.lower().strip()

        for feat in self.feature_names:
            if feat in ['length', 'hora_dia']:
                continue
            if feat.startswith('dia_semana_'):
                val_dia = feat.replace('dia_semana_', '')
                data_dict[feat] = np.full(n, 1 if dia_normalizado == val_dia else 0, dtype=int)
            elif feat.startswith('clima_'):
                val_clima = feat.replace('clima_', '')
                data_dict[feat] = np.full(n, 1 if clima_normalizado == val_clima else 0, dtype=int)
            elif feat.startswith('es_feriado_'):
                val_feriado = feat.replace('es_feriado_', '')
                es_true = (val_feriado.lower() == 'true')
                data_dict[feat] = np.full(n, 1 if context.es_feriado == es_true else 0, dtype=int)
            else:
                data_dict[feat] = np.zeros(n, dtype=int)

        df_batch = pd.DataFrame(data_dict, columns=self.feature_names)
        predictions = self.model.predict(df_batch)
        # Tiempo mínimo físico: 1.0 segundo
        return np.maximum(1.0, predictions)

    def get_metrics(self) -> Dict:
        if self.metrics is None or self.metrics.get("r2", 0) == 0:
            self._load_model_and_metrics()
        return self.metrics or {}

# Instancia singleton
ml_service = MLService()

