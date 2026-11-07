from typing import List, Dict

PRESET_LOCATIONS: List[Dict] = [
    {
        "id": "centro_distribucion",
        "nombre": "Centro de Distribución (Depósito Norte)",
        "descripcion": "Depósito logístico principal cercano a Av. Circunvalación",
        "lat": -32.9250,
        "lon": -60.6700,
        "categoria": "deposito"
    },
    {
        "id": "monumento_bandera",
        "nombre": "Monumento Nacional a la Bandera",
        "descripcion": "Zona céntrica costera / Parque Nacional a la Bandera",
        "lat": -32.9477,
        "lon": -60.6304,
        "categoria": "entrega"
    },
    {
        "id": "terminal_omnibus",
        "nombre": "Terminal de Ómnibus Mariano Moreno",
        "descripcion": "Barrio Agote / Nodo de transporte interurbano",
        "lat": -32.9389,
        "lon": -60.6698,
        "categoria": "entrega"
    },
    {
        "id": "pellegrini_corrientes",
        "nombre": "Av. Pellegrini y Corrientes",
        "descripcion": "Avenida comercial crítica (sensible a lluvia y congestión)",
        "lat": -32.9555,
        "lon": -60.6508,
        "categoria": "entrega"
    },
    {
        "id": "parque_independencia",
        "nombre": "Parque de la Independencia (El Rosedal)",
        "descripcion": "Centro geográfico de recreación y avenidas amplias",
        "lat": -32.9583,
        "lon": -60.6582,
        "categoria": "entrega"
    },
    {
        "id": "pichincha_gastronomico",
        "nombre": "Barrio Pichincha (Bv. Oroño y Güemes)",
        "descripcion": "Corredor gastronómico de alta densidad",
        "lat": -32.9348,
        "lon": -60.6534,
        "categoria": "entrega"
    },
    {
        "id": "hospital_vilela",
        "nombre": "Hospital de Niños Víctor J. Vilela",
        "descripcion": "Zona sur / calle Virasoro e Italia",
        "lat": -32.9700,
        "lon": -60.6642,
        "categoria": "entrega"
    },
    {
        "id": "zona_sur_tirol",
        "nombre": "Punto de Entrega Sur (Av. San Martín y Arijón)",
        "descripcion": "Zona residencial y comercial de la zona sur",
        "lat": -33.0010,
        "lon": -60.6480,
        "categoria": "entrega"
    }
]
