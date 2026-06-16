# TalentOps — Ethical Analysis Deck

Presentación (Vite + React) del **análisis ético de TalentOps Copilot** bajo el marco AI4People:
preocupaciones éticas, FMEA/RPN, mapa de calor de riesgos y matriz beneficio-riesgo.

Maestría en Ciencia de Datos — Universidad Panamericana.

## Ejecutar con Docker

```bash
docker compose build --no-cache
docker compose up -d
```

Abrir: http://localhost:4173

La imagen compila la app Vite dentro de un contenedor Node y sirve el output estático con Nginx;
no requiere `node_modules` local.

## Control remoto (opcional, vía Supabase)

Copia `.env.example` a `.env` y completa tus valores:

```env
VITE_SUPABASE_URL=tu_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=tu_supabase_publishable_key
```

> `.env` está en `.gitignore` y **no debe subirse al repositorio**. La clave *publishable* es de uso
> público (cliente) y está protegida por RLS; aun así, no la incluyas en archivos versionados.

Modos de uso:
- Presentación: `/?session=demo#1`
- Control remoto: `/?control=1&session=demo`

## Generar un zip del build con Docker

```bash
rm -rf dist talentops-ethical-analysis-deck.zip
docker run --rm -v "$PWD":/app -w /app node:22-alpine sh -lc "cp -a /app/. /tmp/app && cd /tmp/app && npm ci && npm run build && rm -rf /app/dist && cp -a /tmp/app/dist /app/dist"
cd dist && zip -qr ../talentops-ethical-analysis-deck.zip . && cd ..
```

## Notas

- El contenido vive en el arreglo `slides` de [`src/App.jsx`](./src/App.jsx).
- Tema y layout base en [`src/index.css`](./src/index.css).
- Metadatos y favicons en [`index.html`](./index.html).
