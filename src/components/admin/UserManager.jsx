import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { fetchProjectMembers, updateMemberRole, removeMember } from '../../services/projectService.js';

const ROLE_LABELS = { admin: 'Administrador', editor: 'Editor', viewer: 'Solo lectura' };

/**
 * UserManager
 * ------------------------------------------------------------------
 * Lista quién tiene acceso al proyecto actual y permite cambiar su
 * rol o quitarle el acceso. Para DAR acceso nuevo se usan los
 * enlaces de invitación (pestaña "Compartir") — aquí solo se
 * administra a quien ya lo tiene.
 * ------------------------------------------------------------------
 */
export default function UserManager({ projectId }) {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetchProjectMembers(projectId)
      .then(setMembers)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [projectId]);

  const handleRoleChange = async (member, role) => {
    setError(null);
    try {
      await updateMemberRole(member.id, role);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemove = async (member) => {
    const label = member.profiles?.email ?? member.profiles?.full_name ?? 'este usuario';
    if (!window.confirm(`¿Quitarle el acceso a ${label}?`)) return;
    setError(null);
    try {
      await removeMember(member.id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <p className="px-4 py-3 text-xs text-[var(--color-text-muted)]">Cargando…</p>;

  return (
    <div className="p-4">
      <p className="mb-3 text-xs text-[var(--color-text-muted)]">
        Quien tiene acceso a este proyecto. Para dar acceso nuevo, usa la pestaña "Compartir".
      </p>

      {error && <p className="mb-3 text-xs text-red-400">{error}</p>}

      {members.length === 0 ? (
        <p className="text-xs text-[var(--color-text-muted)]">Nadie tiene acceso todavía.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {members.map((member) => {
            const isSelf = member.user_id === user.id;
            return (
              <li
                key={member.id}
                className="flex items-center justify-between gap-2 rounded-md bg-[var(--color-surface-alt)] px-3 py-2 text-xs"
              >
                <div className="min-w-0">
                  <p className="truncate text-[var(--color-text)]">
                    {member.profiles?.email ?? member.profiles?.full_name ?? 'Usuario'}
                    {isSelf && <span className="text-[var(--color-text-muted)]"> (tú)</span>}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member, e.target.value)}
                    disabled={isSelf}
                    className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-1.5 py-1 text-[11px] text-[var(--color-text)] disabled:opacity-50"
                  >
                    {Object.entries(ROLE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleRemove(member)}
                    disabled={isSelf}
                    title={isSelf ? 'No puedes quitarte tu propio acceso' : 'Quitar acceso'}
                    className="text-red-400 hover:text-red-300 disabled:opacity-30"
                  >
                    Quitar
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
