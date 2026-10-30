## Opción 1: Ruteo de última milla con predicción de demanda

### Contexto
Una empresa de logística quiere optimizar sus entregas diarias. Actualmente calcula rutas usando distancias fijas entre puntos, pero el tiempo de viaje varía mucho según la hora del día, el día de la semana, el clima y otros factores. La empresa los contrata para construir un sistema que prediga el tiempo de viaje real en cada tramo de la ciudad y use esa predicción para calcular rutas de entrega óptimas.

### Objetivo
Construir un sistema que combine un modelo de regresión (para estimar tiempos de viaje) con algoritmos de grafos (para calcular rutas óptimas sobre esos tiempos estimados).

### Datos
Se puede modelar la ciudad como un **grafo dirigido**:
* **Nodo:** intersección o punto de entrega con coordenadas (lat, lon).
* **Arista:** tramo de calle entre dos nodos con dirección (si corresponde a una calle de sentido único).

El grupo debe generar (o conseguir) un dataset histórico de viajes con, al menos, estas columnas:

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `tramo_id` | id | identificador de la arista |
| `hora_dia` | entero (0-23) | hora de inicio del viaje |
| `dia_semana` | categórica | lunes a domingo |
| `clima` | categórica | soleado / lluvia / tormenta |
| `es_feriado` | booleano | |
| `velocidad_promedio_historica` | numérico | velocidad promedio histórica del tramo |
| `tiempo_real_viaje` | numérico | variable a predecir |

### Requisitos
1. **Modelo predictivo:** entrenar un modelo de regresión que dado un tramo y un contexto (hora, día, clima), prediga el tiempo de viaje esperado. Analizar métricas (MAE, RMSE, $R^2$) sobre un conjunto de test separado.
2. **Actualización dinámica de pesos:** el grafo debe poder recalcular el peso de cada arista usando la predicción del modelo para un momento dado (elegido por el usuario en el frontend).
3. **Grafos:** implementar Dijkstra para calcular la ruta más rápida entre un origen y un destino usando los pesos predichos.

### Frontend
* Mapa interactivo que muestre el grafo de calles.
* Selector de origen/destino y de momento (hora, día, clima) para calcular y visualizar la ruta más rápida.
* Visualización de la ronda de entregas calculada, con el orden de visita marcado sobre el mapa.
* Comparación visual entre la ruta calculada con pesos estáticos (distancia) y con pesos predichos (tiempo dinámico), para que se note el valor agregado del modelo.