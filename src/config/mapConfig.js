/**
 * mapConfig.js
 * ------------------------------------------------------------------
 * Configuración centralizada del visor. Este es el ÚNICO archivo que
 * debe tocarse para cambiar comportamiento por defecto del mapa:
 * centro inicial, niveles de zoom, mapas base disponibles y la
 * definición de la capa GeoJSON embebida en el proyecto.
 *
 * Ningún componente debe tener valores de configuración "hardcodeados"
 * fuera de aquí — así se cumple el requisito de escalabilidad sin
 * reescritura.
 * ------------------------------------------------------------------
 */

/** Centro inicial del mapa (Puerto Rico completo) y nivel de zoom. */
export const MAP_VIEW = {
  center: [-66.5901, 18.2208], // [lng, lat] — centro geográfico aproximado de Puerto Rico
  zoom: 8.6,
  minZoom: 7,
  maxZoom: 20,
  pitch: 0,
  bearing: 0,
};

/**
 * Mapas base disponibles. `id` se usa como clave interna y como
 * MapLibre source/layer id. Solo un basemap puede estar activo a la
 * vez (regla de negocio, aplicada en useBasemap).
 */
export const BASEMAPS = [
  {
    id: 'osm',
    name: 'OpenStreetMap',
    type: 'raster',
    // Igual que el basemap de Esri: se sirve vía nuestra función Netlify
    // (netlify/functions/osm-tile.js) porque tile.openstreetmap.org no
    // envía cabeceras CORS, y MapLibre GL (WebGL) las necesita para poder
    // dibujar el tile. Sigue siendo el servicio gratuito de OSM, solo con
    // una parada intermedia en nuestro propio dominio.
    tiles: ['/api/osm-tile?z={z}&x={x}&y={y}'],
    tileSize: 256,
    attribution: '© OpenStreetMap contributors',
    default: true,
  },
  {
    id: 'esri-imagery',
    name: 'Esri World Imagery',
    type: 'raster',
    // Se sirve a través de nuestra función Netlify (netlify/functions/esri-tile.js)
    // en vez de pedirlo directo a Esri: MapLibre GL usa WebGL para dibujar los
    // tiles, y eso exige cabeceras CORS que el servicio gratuito de Esri no
    // envía. El proxy reenvía el mismo tile gratuito de Esri añadiendo esas
    // cabeceras. Sigue siendo el servicio 100% gratuito de Esri — sin cuentas
    // ni tokens — solo con una parada intermedia en nuestro propio dominio.
    tiles: ['/api/esri-tile?z={z}&x={x}&y={y}'],
    tileSize: 256,
    maxzoom: 19,
    attribution: 'Esri, Maxar, Earthstar Geographics',
    default: false,
  },
];

/**
 * Capa GeoJSON inicial embebida en el proyecto (NO proviene de
 * Supabase). Se carga automáticamente al iniciar la aplicación.
 */
export const INITIAL_LAYER = {
  id: 'municipios-pr',
  name: 'Municipios de Puerto Rico',
  source: 'static', // marca de origen: 'static' | 'supabase'
  dataPath: '/data/municipios.geojson',
  visibleByDefault: true,
  type: 'fill',
  style: {
    fillColor: '#636e86',
    fillOpacity: 0.1,
    strokeColor: '#292426',
    strokeWidth: 1,
  },
  popup: {
    // Si no se define, el popup autogenerado muestra TODOS los atributos.
    titleField: 'municipio',
  },
};

/** Nombre y branding del visor (usado en la barra superior). */
export const APP_BRANDING = {
  name: 'Geolabs',
  shortName: 'GIS-PR',
  logo: null, // ruta a assets/logo.svg cuando exista
};