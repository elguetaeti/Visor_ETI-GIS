import { supabase } from '../supabase/client.js';

/**
 * inviteService.js
 * ------------------------------------------------------------------
 * Enlaces de invitación: generarlos, listarlos, revocarlos, y
 * canjearlos (esto último vía la función `redeem_invite` de
 * Postgres, que valida el token y otorga el rol de forma segura).
 * ------------------------------------------------------------------
 */

export async function createInvite(projectId, role, userId) {
  const { data, error } = await supabase
    .from('invites')
    .insert({ project_id: projectId, role, created_by: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchInvites(projectId) {
  const { data, error } = await supabase
    .from('invites')
    .select('id, role, token, use_count, max_uses, created_at')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function revokeInvite(inviteId) {
  const { error } = await supabase.from('invites').delete().eq('id', inviteId);
  if (error) throw error;
}

/** Canjea un token: otorga el rol al usuario autenticado actual. */
export async function redeemInvite(token) {
  const { data, error } = await supabase.rpc('redeem_invite', { invite_token: token });
  if (error) throw error;
  return data?.[0] ?? null; // { role, project_slug }
}
