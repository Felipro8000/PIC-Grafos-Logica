# Ruteo de Última Milla con Predicción de Demanda

Felipe Isern y Sofia Koprcina  

IMPORTANTE: "Grupo Alumnos" es Sofía Koprcina. Linux me odia y el sentimiento es mutuo, pero soy yo quien commitea. 

---

## Requisitos Previos

* **Python:** Versión 3.10 o superior.
* **Node.js:** Versión 18.0 o superior (con `npm`).

---

## Instrucciones de Instalación y Ejecución

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
