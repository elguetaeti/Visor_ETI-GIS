import { bbox } from '@turf/turf';

/**
 * geojsonHelpers.js
 * ------------------------------------------------------------------
 * Utilidades puras sobre GeoJSON, apoyadas en Turf.js. Se usan desde
 * hooks/servicios (p. ej. "zoom a la capa" en el panel de capas).
 * ------------------------------------------------------------------
 */

/** Devuelve el bounding box [minX, minY, maxX, maxY] de un FeatureCollection. */
export function getBounds(geojson) {
  return bbox(geojson);
}
