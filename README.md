# DCS Technology

Landing page estática para venta de celulares, tablets, computadores, accesorios, financiación y diagnóstico técnico inicial mediante chatbot local.

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

## Cómo ejecutar

No requiere backend ni instalación de paquetes.

1. Abre `index.html` directamente en el navegador.
2. Opcionalmente usa un servidor estático local:

```bash
python -m http.server 8000
```

Luego visita `http://localhost:8000`.

## Seguridad y privacidad

- El chatbot funciona en el navegador y no envía consultas a servidores externos.
- No se recolectan datos personales.
- No hay rastreadores ni código ofuscado.
- Los enlaces externos con nueva pestaña usan `rel="noopener noreferrer"`.
- La entrada del buscador y chatbot se normaliza y limita antes de procesarse.
- Las imágenes del sitio usan recursos locales en `assets/img/`.

## Despliegue

GitHub Pages debe configurarse con:

- Branch: `main`
- Folder: `/(root)`

URL pública esperada:

```text
https://santiagoquilindo.github.io/DCS/
```
