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

## 10. Bitácora de Avance - Fase 2 (Backend Core)
- **Grafo vial de Rosario:** Descargado con OSMnx (13.190 nodos, 30.166 aristas) y guardado en `backend/data/grafo_rosario.pkl`. Indexación espacial ultra-rápida construida con `scipy.spatial.cKDTree`.
- **Dataset sintético:** 50.000 viajes simulados con reglas urbanas guardados en `backend/data/dataset_viajes_ultima_milla.csv`.
- **Modelo de Machine Learning:** Random Forest Regressor entrenado y guardado en `backend/models/modelo_ultima_milla.pkl`. Métricas obtenidas en conjunto de test (10.000 muestras):
  - $R^2$: `0.9078`
  - MAE: `2.87` segundos
  - RMSE: `7.50` segundos
- **Servicios y API REST:**
  - `backend/src/schemas.py`: Modelos Pydantic para validación estricta de coordenadas, contexto, piernas de viaje y respuestas.
  - `backend/src/presets.py`: 8 puntos de interés de Rosario pre-cargados.
  - `backend/src/ml_service.py`: Inferencia vectorizada batch en Pandas/NumPy (< 50 ms para todas las aristas).
  - `backend/src/graph_service.py`: Cálculo de Dijkstra estático vs dinámico con métricas e insights, y algoritmo heurístico TSP (Nearest Neighbor) para la ronda de entregas.
  - `backend/src/main.py`: Endpoints FastAPI (`/api/health`, `/api/presets`, `/api/model/metrics`, `/api/route`, `/api/delivery-tour`) con CORS habilitado.
- **Suite de Pruebas:** `backend/tests/test_backend.py` ejecutado con éxito total (5/5 tests aprobados).

