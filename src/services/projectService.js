import { supabase } from '../supabase/client.js';

/**
 * projectService.js
 * ------------------------------------------------------------------
 * Lectura de proyectos y del permiso (rol) de un usuario dentro de
 * un proyecto. La tabla `projects` es de lectura pública (RLS lo
 * permite), así que esto funciona igual con o sin sesión iniciada.
 * ------------------------------------------------------------------
 */

export async function fetchProjectBySlug(slug) {
  const { data, error } = await supabase
    .from('projects')
    .select('id, slug, name, config')
    .eq('slug', slug)
    .is('deleted_at', null)
    .single();
  if (error) throw error;
  return data;
}

/** Devuelve el rol del usuario en el proyecto, o null si no tiene ninguno. */
export async function fetchUserRole(projectId, userId) {
  if (!projectId || !userId) return null;
  const { data, error } = await supabase
    .from('permissions')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data?.role ?? null;
}

/**
 * Mezcla `patch` dentro de `projects.config` (lectura + combinación +
 * escritura). Aquí vive, entre otras cosas, la configuración de
 * popup de la capa base del proyecto (la que no es de Supabase).
 */
export async function updateProjectConfig(projectId, patch) {
  const { data: current, error: fetchError } = await supabase
    .from('projects')
    .select('config')
    .eq('id', projectId)
    .single();
  if (fetchError) throw fetchError;

  const nextConfig = { ...(current.config ?? {}), ...patch };
  const { error } = await supabase.from('projects').update({ config: nextConfig }).eq('id', projectId);
  if (error) throw error;
  return nextConfig;
}

/** Lista quién tiene acceso al proyecto y con qué rol. */
export async function fetchProjectMembers(projectId) {
  const { data, error } = await supabase
    .from('permissions')
    .select('id, role, user_id, profiles(full_name, email)')
    .eq('project_id', projectId);
  if (error) throw error;
  return data;
}

export async function updateMemberRole(permissionId, role) {
  const { error } = await supabase.from('permissions').update({ role }).eq('id', permissionId);
  if (error) throw error;
}

export async function removeMember(permissionId) {
  const { error } = await supabase.from('permissions').delete().eq('id', permissionId);
  if (error) throw error;
}

/** Proyectos donde el usuario tiene algún rol asignado. */
export async function fetchUserProjects(userId) {
  const { data, error } = await supabase
    .from('permissions')
    .select('role, projects!inner(id, slug, name, deleted_at)')
    .eq('user_id', userId)
    .is('projects.deleted_at', null);
  if (error) throw error;
  return data.map((row) => ({ ...row.projects, role: row.role }));
}

/**
 * Crea un proyecto nuevo y de paso vuelve admin a quien lo crea —
 * vía la función `create_project` de Postgres (ver migración 006),
 * necesaria porque ese primer permiso de admin no se puede otorgar
 * con las políticas normales (nadie es admin todavía en ese instante).
 */
export async function createProject(name, slug) {
  const { data, error } = await supabase.rpc('create_project', {
    project_name: name,
    project_slug: slug,
  });
  if (error) throw error;
  return data;
}

/**
 * Borrado suave: marca el proyecto como eliminado (`deleted_at`) sin
 * borrar datos; capas, dibujos y permisos siguen en Supabase y se
 * pueden recuperar quitando ese valor desde el SQL Editor.
 */
export async function deleteProject(projectId) {
  const { error } = await supabase
    .from('projects')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', projectId);
  if (error) throw error;
}
