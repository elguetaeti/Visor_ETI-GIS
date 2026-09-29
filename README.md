# Visor GIS Puerto Rico

Visor web GIS ligero y modular. React + Vite + MapLibre GL JS + TailwindCSS + Supabase.

## Estado del proyecto — Etapa 1

Esta primera etapa entrega:

- Scaffolding completo (Vite, Tailwind v4, estructura de carpetas).
- Mapa centrado en Puerto Rico con MapLibre GL JS.
- Dos mapas base (OpenStreetMap y Esri World Imagery) con toggle **mutuamente excluyente**.
- Capa GeoJSON inicial (municipios de Puerto Rico) embebida en el proyecto — se carga automáticamente, aparece en el panel de capas, y genera popups de atributos al hacer clic.
- Panel de capas colapsable: visibilidad, opacidad, zoom a la capa, información.
- Controles flotantes: zoom, home, pantalla completa, localizar usuario, escala gráfica, coordenadas del cursor.
- Configuración centralizada en `src/config/` (nada de esto requiere tocar componentes para cambiarlo).
- Preparado para desplegar en Netlify.

Pendiente para próximas etapas: autenticación de administrador, carga de capas a Supabase, dibujo sobre el mapa, permisos por proyecto, compartir por URL, exportar GeoJSON/KML, búsqueda y medición.

## Desarrollo local

```bash
npm install
cp .env.example .env   # completa con tus credenciales de Supabase (aún no requeridas en esta etapa)
npm run dev
```

## Estructura

```
src/
  components/   # UI organizada por dominio: map, layers, popups, admin, auth, ui, layout
  pages/        # ViewerPage (/, /project/:projectId), LoginPage
  hooks/        # useBasemap, useLayers, MapContext
  services/     # layerService (lógica pura, sin React)
  supabase/     # cliente único + queries (próxima etapa)
  config/       # mapConfig.js y appConfig.js — TODA la configuración vive aquí
  utils/        # geojsonHelpers (Turf.js)
public/
  data/         # municipios.geojson — capa estática servida como archivo público
```

## Despliegue en Netlify

1. Conecta el repositorio de GitHub en Netlify.
2. Build command: `npm run build` · Publish directory: `dist` (ya configurado en `netlify.toml`).
3. Añade las variables de entorno `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en Site settings → Environment variables.
4. Deploy. El redirect SPA para `/project/:id` ya está incluido.
