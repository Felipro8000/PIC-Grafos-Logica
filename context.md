# Contexto del Proyecto: Ruteo de Última Milla con Predicción de Demanda

**Trabajo Práctico Integrador:** Lógica y Teoría de Grafos  
**Fecha de entrega:** 08/11/2026  
**Equipo:** Grupo de desarrollo  

---

## 1. Objetivo del Producto (La Web)
Construir una aplicación web interactiva que simula y optimiza entregas de última milla en la ciudad de Rosario (Santa Fe, Argentina). La herramienta resuelve el problema de la variabilidad del tráfico urbano calculando dos tipos de rutas entre puntos:
1. **Ruta Estática (Baseline):** Ruta basada exclusivamente en la distancia geográfica más corta.
2. **Ruta Dinámica (Optimizada con ML):** Ruta que minimiza el tiempo real de viaje estimado por un modelo de Machine Learning (Random Forest) entrenado con datos históricos que consideran la hora del día, el día de la semana, las condiciones climáticas y feriados.
3. **Ronda de Entregas:** Optimización del orden de visita de múltiples paradas de paquetes.

---

## 2. Tipos de Usuarios y Roles
- **Usuario Operador / Evaluador (Profesor):** Usuario principal. Interactúa con el mapa, selecciona orígenes, destinos y paradas, ajusta las condiciones de simulación (hora, clima, día) y visualiza las rutas resultantes y las métricas comparativas.
- **Autenticación en MVP:** **NO requerida.** La web es un simulador académico y demostrador técnico. Agregar login o gestión de sesiones complejizaría innecesariamente la entrega y dificultaría la corrección rápida por parte de los docentes.

---

## 3. Alcance de Funcionalidades

### MVP (Mínimo Producto Viable)
- [ ] Mapa interactivo centrado en Rosario con OpenStreetMap y Leaflet.
- [ ] Selección de Origen y Destino (vía clic en mapa o puntos predefinidos clave de Rosario).
- [ ] Panel de control de contexto temporal y meteorológico:
  - Hora del día (slider 0 a 23 h).
  - Día de la semana (Lunes a Domingo).
  - Clima (Soleado, Lluvia, Tormenta).
  - Feriado (Toggle Sí/No).
- [ ] Cálculo simultáneo de:
  - Ruta más corta en distancia (estática).
  - Ruta más rápida en tiempo predicho (dinámica).
- [ ] Visualización en el mapa con trazados diferenciados por color (ej. azul estática, verde dinámica).
- [ ] Módulo de Ronda de Entregas (múltiples paradas con orden de visita optimizado mediante heurística TSP).
- [ ] Tarjeta de métricas comparativas: tiempo estimado, kilómetros recorridos y tiempo ahorrado.
- [ ] Modal o sección de información del modelo con métricas de entrenamiento ($R^2$, MAE, RMSE) y reporte de IA.

### Posteriores
- [ ] Guardar simulaciones favoritas o historial en LocalStorage.
- [ ] Búsqueda de direcciones en Rosario mediante geocodificación gratuita (Nominatim).
- [ ] Animación de avance del vehículo a lo largo del trazado.

### Futuras (Fuera del alcance del TP)
- [ ] Gestión de flotas multi-vehículo (VRP con ventanas de tiempo).
- [ ] Integración con APIs de tráfico en vivo (Google Maps / TomTom).
- [ ] Autenticación de operadores y base de datos relacional para auditoría de envíos.

---

## 4. Mapa del Sitio y Navegación (Single Page Application - SPA)
Al tratarse de una herramienta operativa basada en mapas, la estructura óptima es una SPA con paneles contextuales:

```text
Simulador de Última Milla (Página Principal)
├── Header (Título, estado de la API, selector de modo: Punto a Punto / Ronda)
├── Main Canvas (Mapa interactivo de Rosario a pantalla completa)
├── Control Drawer / Panel Flotante (Parámetros climáticos, origen/destino, botón de acción)
├── Bottom Sheet / Floating Card (Métricas comparativas y resultados del cálculo)
└── Modales de Soporte:
    ├── Modal de Métricas del Modelo ML (MAE, RMSE, R², importancia de variables)
    └── Modal de Documentación de IA y Ayuda (Criterios exigidos por el enunciado)
```

---

## 5. Flujos Principales

### Flujo 1: Ruteo Punto a Punto y Comparación Estática vs. Dinámica
1. El usuario abre la aplicación (el mapa carga centrado en Rosario).
2. Selecciona un punto de Origen y un punto de Destino (haciendo clic en el mapa o seleccionando de una lista de presets como "Monumento a la Bandera" o "Terminal").
3. Ajusta el contexto en el panel de control: ej. Hora: 18:00 h, Día: Viernes, Clima: Lluvia, Feriado: No.
4. Presiona el botón **"Calcular Rutas"**.
5. El frontend valida los datos y envía una solicitud `POST /api/route` al backend.
6. El backend:
   - Toma el grafo vial de Rosario.
   - Aplica el modelo Random Forest para predecir el tiempo de cada arista bajo el contexto enviado.
   - Ejecuta Dijkstra usando pesos de longitud (ruta estática).
   - Ejecuta Dijkstra usando los pesos de tiempo predicho (ruta dinámica).
   - Retorna las coordenadas de ambos caminos, distancias y tiempos.
7. El frontend dibuja ambas rutas en el mapa con colores contrastantes y muestra las tarjetas comparativas (minutos ahorrados, diferencia de kilómetros).

### Flujo 2: Ronda de Entregas (Múltiples Paradas)
1. El usuario cambia al modo **"Ronda de Entregas"**.
2. Marca el depósito de salida y agrega 3 o más clientes/paradas en el mapa.
3. Ajusta el contexto climático y horario.
4. Presiona **"Optimizar Ronda"**.
5. El backend calcula la matriz de tiempos entre todos los puntos y aplica una heurística de Vecino Más Cercano (TSP) sobre Dijkstra.
6. El frontend renderiza la ruta completa y numera los pines en el mapa (1, 2, 3...) mostrando el itinerario paso a paso.

---

## 6. Entidades del Dominio (Modelo de Datos)

- **Coordenada:** `{ lat: float, lon: float }`
- **PuntoReferencia (Preset):** `{ id: str, nombre: str, lat: float, lon: float, categoria: str }`
- **ContextoSimulacion:** `{ hora_dia: int [0-23], dia_semana: str, clima: str, es_feriado: bool }`
- **RutaCalculada:** `{ tipo: 'estatica' | 'dinamica', coordinates: [[lat, lon]], distancia_m: float, tiempo_s: float }`
- **RespuestaRuta:** `{ static_route: RutaCalculada, dynamic_route: RutaCalculada, tiempo_ahorrado_s: float, distancia_dif_m: float }`
- **ParadaEntrega:** `{ id: str, orden: int, lat: float, lon: float, nombre: str }`
- **MetricasModelo:** `{ mae: float, rmse: float, r2: float, n_muestras_train: int, n_muestras_test: int }`

---

## 7. Análisis de Arquitectura y Tecnologías Propuestas

### Frontend
- **Recomendación:** **React + TypeScript + Vite + Tailwind CSS + React-Leaflet**.
  - *¿Por qué React + Vite y no Next.js completo?* Next.js está diseñado para SSR y páginas orientadas a SEO y e-commerce con bases de datos SQL/Prisma. Para un simulador interactivo de grafos en un mapa (cliente puro con Leaflet), React + Vite es infinitamente más ligero, rápido de compilar, no genera conflictos de SSR con Leaflet (Leaflet requiere acceso directo al objeto global `window` del navegador, lo que en Next.js suele generar errores de hidratación) y cumple al 100% la indicación del profesor (*"TypeScript con React"*).

### Backend
- **Recomendación:** **Python con FastAPI + Uvicorn + NetworkX + scikit-learn**.
  - *¿Por qué FastAPI en Python?* El modelo (`modelo_ultima_milla.pkl`), los datos y el grafo vial de OSMnx ya están hechos en Python. FastAPI ofrece validación con Pydantic, generación automática de documentación en `/docs` (ideal para que los profesores prueben la API) y un rendimiento asíncrono superior a Flask.

### Persistencia y Base de Datos
- **Recomendación:** **Sin base de datos relacional (PostgreSQL/Prisma) para el MVP.**
  - El grafo vial y el modelo ML viven en memoria y archivos binarios (`.graphml`, `.pkl`).
  - Los puntos de interés (presets) se guardan en un archivo JSON o código del backend.
  - El estado de la sesión del usuario se gestiona en memoria de React y LocalStorage.
  - Agregar PostgreSQL + Prisma en esta instancia introduciría una sobrecarga de infraestructura (Docker, migraciones, credenciales) que la consigna no solicita ni evalúa.

---

## 8. Riesgos y Decisiones Técnicas Críticas
1. **Latencia de OSMnx:**
   - *Problema:* Descargar el mapa de Rosario desde Overpass en cada petición tarda hasta 5 minutos y puede fallar por límites de tasa.
   - *Decisión:* Pre-descargar y guardar la red vial en un archivo local (`grafo_rosario.graphml` o `.pkl`). El backend lo carga una sola vez al arrancar en menos de 2 segundos.
2. **Inferencia de Machine Learning en Tiempo Real:**
   - *Problema:* Predecir el tiempo para 20.000 aristas arista por arista toma varios segundos.
   - *Decisión:* Realizar inferencia vectorizada en batch con Pandas/NumPy para actualizar todos los pesos del grafo en < 100 ms.
3. **Orden de Coordenadas:**
   - *Problema:* Leaflet usa `[lat, lon]`, pero GeoJSON y OSMnx usan `(lon, lat)` o `(x, y)`.
   - *Decisión:* Estandarizar una función de serialización en el backend que garantice que la API siempre devuelva arrays `[lat, lon]`.

---

## 9. Fases de Implementación Propuestas
- **Fase 1:** Definición y Aprobación de Arquitectura y Alcance (Completada).
- **Fase 2:** Preparación del Grafo y API Backend (Completada y testeada).
- **Fase 3:** Estructura del Frontend (Setup de React + Vite + TypeScript + Tailwind + Mapa Leaflet centrado en Rosario) (Próxima etapa).
- **Fase 4:** Integración de Ruteo Punto a Punto (Controles de contexto, llamada a API, renderizado comparativo de rutas y métricas).
- **Fase 5:** Implementación de la Ronda de Entregas (Marcación multi-punto, TSP en backend, pines ordenados en frontend).
- **Fase 6:** Panel de Métricas de ML, sección de Documentación de IA y pruebas end-to-end.

---

## 10. Implementación y Resultados de la Fase 2 (Backend Core)

### 2. Grafo Vial de Rosario
- **Descarga y Extracción:** Se descargó la red vial completa de Rosario para conducción vehicular (`network_type="drive"`) utilizando OSMnx y OpenStreetMap.
- **Topología:** El grafo cuenta con **13.190 nodos** (intersecciones) y **30.166 aristas** (tramos de calles con sentido de circulación y longitud en metros).
- **Persistencia:** Guardado y serializado en `backend/data/grafo_rosario.pkl`, permitiendo que la API arranque en memoria en menos de 0.05 segundos sin consultar internet.
- **Indexación Espacial:** Se construyó un árbol `scipy.spatial.cKDTree` sobre las coordenadas geográficas `[lat, lon]` de todos los nodos. Esto permite resolver búsquedas del nodo más cercano a cualquier punto de la ciudad en **microsegundos**.

### 3. Generación de Datos Sintéticos y Entrenamiento de Machine Learning
- **Dataset Histórico Sintético:** Generado en `backend/data/dataset_viajes_ultima_milla.csv` con **50.000 viajes simulados**. Modela el comportamiento real de Rosario mediante reglas urbanas explícitas:
  - Congestión en horas pico (07:00–09:00 h y 17:00–19:00 h en días hábiles con factor 0.55 de velocidad).
  - Efecto climático adverso (lluvia general factor 0.85, tormenta 0.65).
  - Anegamiento severo localizado en arterias críticas (Av. Pellegrini con lluvia o tormenta reducida al factor 0.50).
  - Jerarquía vial (vías primarias y troncales más rápidas; calles residenciales y pasajes más lentos).
- **Modelo Entrenado:** `RandomForestRegressor` (60 estimadores, profundidad máxima 16) guardado en `backend/models/modelo_ultima_milla.pkl`.
- **Métricas de Evaluación (sobre 10.000 muestras de test):**
  - **$R^2$ (Coeficiente de Determinación):** `0.9078` (explica más del 90% de la varianza temporal).
  - **MAE (Error Absoluto Medio):** `2.87` segundos.
  - **RMSE (Raíz del Error Cuadrático Medio):** `7.50` segundos.
- **Métricas e Importancias:** Guardadas en `backend/models/metricas_modelo.json` para consumo directo de la API y transparencia académica.

### 4. Servicios y Algoritmos de Grafos
- **Inferencia Vectorizada (`backend/src/ml_service.py`):**
  - Implementa predicción batch sobre matrices de NumPy/Pandas.
  - Predice el tiempo estimado de las 30.166 aristas simultáneamente en **menos de 50 milisegundos**.
- **Servicio de Grafos (`backend/src/graph_service.py`):**
  - **Ruta Estática:** Aplica Dijkstra sobre el peso estático `weight_distance` (longitud física en metros).
  - **Ruta Dinámica:** Actualiza `weight_dynamic` con las predicciones del modelo ML según hora, día, clima y feriado, y ejecuta Dijkstra para hallar el trayecto temporalmente óptimo.
  - **Ronda de Entregas (TSP Multi-parada):** Resuelve el problema del repartidor para $N$ paradas calculando la matriz de costos dinámicos entre clientes y aplicando la heurística de Vecino Más Cercano (*Nearest Neighbor*), retornando el itinerario ordenado y las piernas de viaje.
  - **Generación de Insights:** Explica automáticamente al usuario por qué la ruta dinámica difiere de la estática (ej. arterias congestionadas evitadas, riesgo de anegamiento).
- **Presets de Rosario (`backend/src/presets.py`):** 8 ubicaciones predefinidas (Centro de Distribución, Monumento a la Bandera, Terminal de Ómnibus, Pellegrini y Corrientes, Parque Independencia, Pichincha, etc.) para pruebas ágiles.
- **API REST (`backend/src/main.py`):** Desarrollada con FastAPI y Pydantic (`backend/src/schemas.py`), con CORS habilitado y endpoints:
  - `GET /api/health`: Estado de salud, conteo de nodos y aristas.
  - `GET /api/presets`: Puntos de interés de Rosario.
  - `GET /api/model/metrics`: Métricas $R^2$, MAE, RMSE y feature importances.
  - `POST /api/route`: Cálculo y comparativa de ruta estática vs dinámica.
  - `POST /api/delivery-tour`: Optimización de ronda de entregas paso a paso.

### 5. Resultados de las Pruebas Unitarias (`backend/tests/test_backend.py`)
La suite de pruebas automatizadas validó con éxito el 100% de los componentes:
- **Test 1 (Carga del Grafo):** Grafo verificado en memoria en `0.0519 s` con 13.190 nodos y 30.166 aristas.
- **Test 2 (Comportamiento del Modelo ML):** Tiempo promedio por tramo en condición base (Lunes 14:00 h, Soleado) = `13.29 s` frente a condición extrema (Viernes 18:00 h, Tormenta) = `30.43 s`. El modelo incrementa el tiempo de viaje más del 120% ante congestión y temporal.
- **Test 3 (Health y Presets):** Endpoints HTTP respondieron código 200 con estructura esperada.
- **Test 4 (Ruta Punto a Punto):** Entre Monumento a la Bandera y Terminal, la ruta estática arrojó 4.46 km y 21.4 min; la dinámica seleccionó un camino de 4.52 km y 20.9 min, evitando zonas anegadas y ahorrando tiempo.
- **Test 5 (Ronda de Entregas TSP):** Calculó el orden de visita secuencial (Depósito $\to$ Pichincha $\to$ Pellegrini $\to$ Monumento $\to$ Depósito) cubriendo 13.8 km en 43.7 min.

