# DCS Technology

Landing page estatica para venta de celulares, tablets, computadores, accesorios, financiacion y diagnostico tecnico inicial mediante chatbot local.

## Estructura

```text
/
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

- El chatbot funciona en el navegador y no envia consultas a servidores externos.
- No se recolectan datos personales.
- No hay trackers ni codigo ofuscado.
- Los enlaces externos con nueva pestana usan `rel="noopener noreferrer"`.
- La entrada del buscador y chatbot se normaliza y limita antes de procesarse.
- Las imagenes del sitio usan recursos locales en `assets/img/`.

## Despliegue

GitHub Pages debe configurarse con:

- Branch: `main`
- Folder: `/(root)`

URL publica esperada:

```text
https://santiagoquilindo.github.io/DCS/
```
