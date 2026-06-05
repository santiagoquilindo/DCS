# DCS Technology

Landing page estatica para venta de celulares, tablets, computadores, accesorios, financiacion y diagnostico tecnico inicial mediante chatbot local.

## Estructura

```text
dcs-technology/
├── index.html
├── css/
│   └── styles.css
├── js/
│   └── main.js
├── assets/
│   ├── img/
│   └── icons/
└── README.md
```

## Como ejecutar

No requiere backend ni instalacion de paquetes.

1. Abre `index.html` directamente en el navegador.
2. Opcionalmente usa un servidor estatico local:

```bash
python -m http.server 8000
```

Luego visita `http://localhost:8000`.

## Seguridad y privacidad

- Nota de desarrollo: Las imágenes externas usadas en esta versión son temporales. Para producción deben reemplazarse por recursos propios o con licencia comercial válida almacenados en `assets/img/`.

- El chatbot funciona en el navegador y no envia consultas a servidores externos.
- No se recolectan datos personales.
- No hay trackers ni codigo ofuscado.
- Los enlaces externos con nueva pestana usan `rel="noopener noreferrer"`.
- La entrada del buscador y chatbot se normaliza y limita antes de procesarse.
- El hero premium usa imagenes locales en `assets/img/`: `hero-celulares.svg`, `hero-reparacion.svg`, `hero-computadores.svg`, `hero-accesorios.svg`, `hero-smartwatch.svg` y `hero-financiacion.svg`.
- Las imágenes externas usadas en el hero son temporales. Antes de publicar comercialmente, deben reemplazarse por imágenes propias o imágenes con licencia válida almacenadas en `assets/img/`.

## Despliegue

El sitio puede publicarse como proyecto estatico en GitHub Pages, Netlify o Vercel.
