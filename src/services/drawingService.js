import { supabase } from '../supabase/client.js';

/**
 * drawingService.js
 * ------------------------------------------------------------------
 * CRUD de dibujos de usuario (tabla `drawings`). Cada fila guarda el
 * GeoJSON completo del dibujo + su estilo (color, tamaño) + una
 * etiqueta de texto opcional (para el tipo "Texto"). RLS ya garantiza
 * que cada usuario solo puede editar/eliminar los suyos — este
 * archivo no necesita reforzar esa regla, Supabase la aplica sola.
 * ------------------------------------------------------------------
 */

export async function fetchProjectDrawings(projectId) {
  const { data, error } = await supabase
    .from('drawings')
    .select('id, user_id, geometry_type, geojson, style, label, attributes, seq_id, created_at')
    .eq('project_id', projectId);
  if (error) throw error;
  return data;
}

export async function createDrawing({ projectId, userId, geometryType, geojson, style, label, attributes }) {
  const { data, error } = await supabase
    .from('drawings')
    .insert({
      project_id: projectId,
      user_id: userId,
      geometry_type: geometryType,
      geojson,
      style: style ?? {},
      label: label ?? null,
      attributes: attributes ?? {},
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateDrawing(id, updates) {
  const { error } = await supabase.from('drawings').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteDrawing(id) {
  const { error } = await supabase.from('drawings').delete().eq('id', id);
  if (error) throw error;
}
