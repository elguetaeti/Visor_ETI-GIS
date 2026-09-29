/**
 * layerService.js
 * ------------------------------------------------------------------
 * Lógica de negocio pura (sin React, sin llamadas directas a
 * componentes) para transformar una definición de capa —venga de
 * config estática o de la tabla `layers` de Supabase— en
 * especificaciones de source/layer de MapLibre, y para subir nuevas
 * capas al backend.
 *
 * Este es el punto de extensión clave del proyecto: añadir un nuevo
 * tipo de fuente (WMS, Vector Tiles...) significa añadir una función
 * `build*Source()` aquí, NO modificar los componentes ni useLayers.
 * ------------------------------------------------------------------
 */
import { supabase } from '../supabase/client.js';

const LAYERS_BUCKET = 'layers';

/** Construye el objeto GeoJSON source para una capa. */
export function buildGeoJSONSource(geojsonData) {
  return {
    type: 'geojson',
    data: geojsonData,
  };
}

/** Layer de relleno (polígonos) a partir de la config de estilo de la capa. */
export function buildFillLayerSpec(layerId, sourceId, style) {
  return {
    id: `${layerId}-fill`,
    type: 'fill',
    source: sourceId,
    paint: {
      'fill-color': style.fillColor,
      'fill-opacity': style.fillOpacity,
    },
  };
}

/** Layer de contorno (línea) que acompaña al relleno. */
export function buildOutlineLayerSpec(layerId, sourceId, style) {
  return {
    id: `${layerId}-outline`,
    type: 'line',
    source: sourceId,
    paint: {
      'line-color': style.strokeColor,
      'line-width': style.strokeWidth,
    },
  };
}

/**
 * Carga un GeoJSON estático embebido en el proyecto (import de Vite,
 * ya resuelto a un objeto JS — ver INITIAL_LAYER en mapConfig.js).
 */
export async function loadStaticGeoJSON(dataPath) {
  const response = await fetch(dataPath);
  if (!response.ok) {
    throw new Error(`No se pudo cargar el GeoJSON estático: ${dataPath}`);
  }
  return response.json();
}

/**
 * Genera el HTML del popup de atributos.
 *
 * `popupConfig` puede ser:
 *  - undefined / {}                        → título "Atributos", muestra TODOS los campos
 *  - { titleField }                        → usa ese campo como título, resto como antes
 *  - { titleField, fields: [...] }         → solo muestra los campos listados, en ese orden
 *    (esto es lo que produce el editor de popup del administrador)
 */
export function renderAttributePopupHTML(properties, popupConfig) {
  const { titleField, fields } = popupConfig ?? {};
  const title = titleField && properties[titleField] ? properties[titleField] : 'Atributos';

  const keys =
    Array.isArray(fields) && fields.length > 0
      ? fields.filter((k) => k !== titleField)
      : Object.keys(properties).filter((k) => k !== titleField);

  const rows = keys
    .map(
      (key) =>
        `<tr><td class="popup-key">${escapeHTML(key)}</td><td class="popup-value">${escapeHTML(
          String(properties[key] ?? '—')
        )}</td></tr>`
    )
    .join('');

  return `
    <div class="attribute-popup">
      <div class="attribute-popup__title">${escapeHTML(String(title))}</div>
      <table class="attribute-popup__table">${rows}</table>
    </div>
  `;
}

function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Sube un archivo GeoJSON al bucket de Storage, dentro de una
 * carpeta por proyecto (evita colisiones de nombre entre proyectos).
 * Devuelve la ruta guardada (storage_path) para la tabla `layers`.
 */
export async function uploadLayerFile(file, projectId) {
  const path = `${projectId}/${Date.now()}-${file.name}`;
  const { error } = await supabase.storage.from(LAYERS_BUCKET).upload(path, file, {
    contentType: 'application/geo+json',
  });
  if (error) throw error;
  return path;
}

/** URL pública del archivo de una capa (el bucket es público de lectura). */
export function getPublicLayerUrl(storagePath) {
  const { data } = supabase.storage.from(LAYERS_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

/**
 * Crea la fila en `layers` y su estilo por defecto en `styles`. La
 * personalización de estilo (color, grosor, popup) se hace después,
 * editando esa fila — no en este flujo de subida.
 */
export async function createLayerRecord({ projectId, name, storagePath, userId }) {
  const { data: layer, error: layerError } = await supabase
    .from('layers')
    .insert({ project_id: projectId, name, storage_path: storagePath, created_by: userId })
    .select()
    .single();
  if (layerError) throw layerError;

  const { error: styleError } = await supabase.from('styles').insert({ layer_id: layer.id });
  if (styleError) throw styleError;

  return layer;
}

/** Trae todas las capas de un proyecto junto con su estilo. */
export async function fetchProjectLayers(projectId) {
  const { data, error } = await supabase
    .from('layers')
    .select(
      'id, name, storage_path, visible_by_default, z_index, styles(fill_color, stroke_color, stroke_width, opacity, popup_config)'
    )
    .eq('project_id', projectId)
    .order('z_index', { ascending: true });
  if (error) throw error;
  return data;
}

/** Actualiza el estilo (color, grosor, opacidad, config de popup) de una capa. */
export async function updateLayerStyle(layerId, updates) {
  const { error } = await supabase.from('styles').update(updates).eq('layer_id', layerId);
  if (error) throw error;
}

/** Actualiza metadata de la capa (nombre, orden de dibujo, visibilidad por defecto). */
export async function updateLayerMeta(layerId, updates) {
  const { error } = await supabase.from('layers').update(updates).eq('id', layerId);
  if (error) throw error;
}

/** Elimina una capa: borra el archivo en Storage (best-effort) y la fila en `layers`. */
export async function deleteLayer(layerId, storagePath) {
  const { error: storageError } = await supabase.storage.from(LAYERS_BUCKET).remove([storagePath]);
  if (storageError) {
    // eslint-disable-next-line no-console
    console.warn('[layerService] No se pudo borrar el archivo de Storage (se continúa igual):', storageError);
  }
  const { error } = await supabase.from('layers').delete().eq('id', layerId);
  if (error) throw error;
}
