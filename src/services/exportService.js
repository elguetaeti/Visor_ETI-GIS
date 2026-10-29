import { supabase } from '../supabase/client.js';
import { fetchProjectDrawings } from './drawingService.js';

/**
 * exportService.js
 * ------------------------------------------------------------------
 * Exporta los dibujos de un proyecto como GeoJSON listo para QGIS
 * (WGS84, propiedades planas — sin objetos anidados, que QGIS no
 * maneja bien). Los campos personalizados se vuelven columnas.
 * ------------------------------------------------------------------
 */
export async function buildDrawingsGeoJSON(project) {
  const rows = await fetchProjectDrawings(project.id);

  // Nombre/correo del autor (mejor esfuerzo: si RLS no lo permite, queda solo el id).
  const names = {};
  const ids = [...new Set(rows.map((r) => r.user_id))];
  if (ids.length) {
    const { data } = await supabase.from('profiles').select('id, full_name, email').in('id', ids);
    for (const p of data ?? []) names[p.id] = p.full_name || p.email || null;
  }

  const customFields = project.config?.customFields ?? [];
  const features = rows.map((r) => {
    const properties = {
      id: r.seq_id,
      proyecto: project.name,
      descripcion: r.label ?? null,
      usuario: names[r.user_id] ?? null,
      usuario_id: r.user_id,
      fecha: r.created_at,
      color: r.style?.color ?? null,
    };
    // Una columna por cada campo personalizado definido (aunque esté vacío).
    for (const f of customFields) properties[f.key] = r.attributes?.[f.key] ?? null;
    // Atributos de campos que ya no existen en la configuración: se conservan.
    for (const [k, v] of Object.entries(r.attributes ?? {})) if (!(k in properties)) properties[k] = v;
    return { type: 'Feature', properties, geometry: r.geojson };
  });

  return { type: 'FeatureCollection', features };
}

export function downloadGeoJSON(collection, filename) {
  const blob = new Blob([JSON.stringify(collection, null, 2)], { type: 'application/geo+json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
