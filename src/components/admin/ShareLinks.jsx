import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { createInvite, fetchInvites, revokeInvite } from '../../services/inviteService.js';

const ROLE_LABELS = {
  admin: 'Administrador',
  editor: 'Editor',
  viewer: 'Solo lectura',
};

/**
 * ShareLinks
 * ------------------------------------------------------------------
 * Genera enlaces de invitación por rol. Quien abra el enlace y
 * inicie sesión (o cree una cuenta) queda automáticamente con ese
 * rol en el proyecto — sin que el administrador tenga que tocar la
 * base de datos manualmente.
 * ------------------------------------------------------------------
 */
export default function ShareLinks({ projectId }) {
  const { user } = useAuth();
  const [invites, setInvites] = useState([]);
  const [role, setRole] = useState('viewer');
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const load = () => {
    fetchInvites(projectId)
      .then(setInvites)
      .catch((err) => setError(err.message));
  };

  useEffect(load, [projectId]);

  const handleCreate = async () => {
    setError(null);
    try {
      await createInvite(projectId, role, user.id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRevoke = async (id) => {
    if (!window.confirm('¿Revocar este enlace? Dejará de funcionar de inmediato.')) return;
    try {
      await revokeInvite(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const copyLink = (invite) => {
    const url = `${window.location.origin}/invite/${invite.token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(invite.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="p-4">
      <p className="mb-3 text-xs text-[var(--color-text-muted)]">
        Genera un enlace y compártelo — quien lo abra e inicie sesión queda con ese rol en el
        proyecto automáticamente.
      </p>

      <div className="mb-4 flex gap-2">
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="flex-1 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-2 py-1.5 text-xs text-[var(--color-text)]"
        >
          <option value="viewer">Solo lectura</option>
          <option value="editor">Editor</option>
          <option value="admin">Administrador</option>
        </select>
        <button
          onClick={handleCreate}
          className="rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-xs font-semibold text-[var(--color-bg)]"
        >
          Generar enlace
        </button>
      </div>

      {error && <p className="mb-3 text-xs text-red-400">{error}</p>}

      {invites.length === 0 ? (
        <p className="text-xs text-[var(--color-text-muted)]">Aún no has generado ningún enlace.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {invites.map((invite) => (
            <li
              key={invite.id}
              className="flex items-center justify-between rounded-md bg-[var(--color-surface-alt)] px-3 py-2 text-xs"
            >
              <div>
                <span className="font-semibold text-[var(--color-accent)]">
                  {ROLE_LABELS[invite.role]}
                </span>
                <span className="ml-2 text-[10px] text-[var(--color-text-muted)]">
                  usado {invite.use_count} {invite.use_count === 1 ? 'vez' : 'veces'}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => copyLink(invite)}
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                >
                  {copiedId === invite.id ? 'Copiado ✓' : 'Copiar enlace'}
                </button>
                <button onClick={() => handleRevoke(invite.id)} className="text-red-400 hover:text-red-300">
                  Revocar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
