# Ruteo de Última Milla con Predicción de Demanda

Felipe Isern y Sofia Koprcina  

IMPORTANTE: "Grupo Alumnos" es Sofía Koprcina. Linux me odia y el sentimiento es mutuo, pero soy yo quien commitea. 

---

## 📌 Descripción del Proyecto
Este proyecto combina **Machine Learning (Regresión con Random Forest)** y **Teoría de Grafos (Algoritmo de Dijkstra y Heurística TSP de Vecino Más Cercano)** para resolver la optimización de rutas y rondas de entrega logística en la red vial real de la ciudad de Rosario.

A diferencia del cálculo tradicional por distancia física estática, el sistema predice en tiempo real los tiempos de viaje sobre **30.166 tramos viales**, contemplando variables dinámicas de congestión en horas pico (07–09 h y 17–19 h), condiciones climáticas (soleado, lluvia y tormentas con anegamiento en arterias como Av. Pellegrini) y feriados.

---

## 🚀 Requisitos Previos
* **Python:** Versión 3.10 o superior.
* **Node.js:** Versión 18.0 o superior (con `npm`).

---

## 🛠️ Instrucciones de Instalación y Ejecución

El proyecto consta de dos partes: el **Backend (API en Python/FastAPI)** y el **Frontend (Aplicación Web en React/TypeScript)**. Deben ejecutarse en terminales separadas:

### 1. Backend (Terminal 1)
```bash
# 1. Posicionarse en la carpeta raíz del proyecto
cd PIC-Grafos-Logica-main

# 2. Crear y activar un entorno virtual
python3 -m venv .venv
source .venv/bin/activate    # En Linux/Mac
# .venv\Scripts\activate     # En Windows

# 3. Instalar las dependencias del backend
pip install -r backend/requirements.txt

# 4. Iniciar el servidor API de FastAPI
python3 -m uvicorn backend.src.main:app --host 127.0.0.1 --port 8000
```
> **Nota:** El backend arrancará en `http://127.0.0.1:8000`. Carga en memoria el grafo pre-procesado de Rosario (`backend/data/grafo_rosario.pkl`) y el modelo entrenado (`backend/models/modelo_ultima_milla.pkl`) en menos de 0.1 segundos.
> La documentación interactiva Swagger de la API estará disponible en `http://127.0.0.1:8000/docs`.

---

### 2. Frontend (Terminal 2)
```bash
# 1. Posicionarse en la carpeta del frontend
cd PIC-Grafos-Logica-main/frontend

# 2. Instalar las dependencias de Node
npm install

# 3. Iniciar el servidor de desarrollo
npm run dev
```
> **Nota:** La aplicación web abrirá en **`http://localhost:5173`**.

---

## 📊 Arquitectura del Sistema

PIC-Grafos-Logica-main/
├── backend/
│   ├── data/
│   │   ├── grafo_rosario.pkl          # Grafo vial completo serializado
│   │   └── dataset_viajes_ultima_milla.csv # 50.000 viajes sintéticos
│   ├── models/
│   │   ├── modelo_ultima_milla.pkl    # Random Forest entrenado (R²=0.9078)
│   │   └── metricas_modelo.json       # Métricas R², MAE, RMSE y feature importances
│   ├── src/
│   │   ├── graph_service.py           # Dijkstra y TSP Nearest Neighbor
│   │   ├── ml_service.py              # Inferencia batch vectorizada (<50ms)
│   │   ├── schemas.py                 # Validación estricta con Pydantic
│   │   ├── presets.py                 # Lugares emblemáticos de Rosario
│   │   └── main.py                    # API FastAPI con CORS
│   ├── scripts/
│   │   └── preparar_datos_y_modelo.py # Script reproducible de descarga y fit
│   └── tests/
│       └── test_backend.py            # Suite de pruebas unitarias
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── MapViewer.tsx          # Leaflet + OpenStreetMap + pines custom
    │   │   ├── ControlPanel.tsx       # Sliders de hora, clima y selectores
    │   │   ├── MetricsOverlay.tsx     # Comparativa estático vs dinámico
    │   │   ├── DeliveryTourPanel.tsx  # Gestión de depósito y paradas TSP
    │   │   ├── TourMetricsOverlay.tsx # Itinerario paso a paso
    │   │   └── ModelInfoModal.tsx     # Modal de métricas del modelo y reporte de IA
    │   ├── services/
    │   │   └── api.ts                 # Cliente HTTP tipado con proxy
    │   ├── types/                     # Interfaces TypeScript estrictas
    │   └── App.tsx                    # Layout principal y control de modos
    └── package.json
```

---

## 🤖 Uso de Inteligencia Artificial
En cumplimiento con las directivas del enunciado, la aplicación cuenta con un botón en el encabezado **"Modelo & IA"** donde los profesores pueden auditar en vivo:
1. Herramientas empleadas (Antigravity, Gemini, Claude, OSMnx).
2. Alcance del uso: generación de datos sintéticos, maquetación UI y vectorización batch; reservando al criterio del equipo la formulación matemática, heurística de grafos y validación de reglas de negocio.
3. Prompts de ejemplo utilizados durante el desarrollo.
4. Errores detectados y corregidos (caída de servidores Overpass, indexación del depósito como base y no parada numerada).
5. Reflexión crítica sobre el rol de la IA como acelerador asistido.
