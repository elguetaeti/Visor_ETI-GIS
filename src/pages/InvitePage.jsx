import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { redeemInvite } from '../services/inviteService.js';
import LoginForm from '../components/auth/LoginForm.jsx';
import { APP_BRANDING } from '../config/mapConfig.js';

/**
 * InvitePage
 * ------------------------------------------------------------------
 * Destino de los enlaces de invitación. Si no hay sesión, primero
 * pide iniciar sesión o crear cuenta; en cuanto hay un usuario
 * autenticado, canjea el token automáticamente y redirige al
 * proyecto ya con el rol otorgado.
 * ------------------------------------------------------------------
 */
export default function InvitePage() {
  const { token } = useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('idle'); // idle | redeeming | error
  const [error, setError] = useState(null);

  useEffect(() => {
    if (loading || !user || status !== 'idle') return;

    setStatus('redeeming');
    redeemInvite(token)
      .then((result) => {
        if (!result) throw new Error('El enlace no es válido.');
        navigate(`/project/${result.project_slug}`);
      })
      .catch((err) => {
        setError(err.message ?? 'No se pudo canjear el enlace.');
        setStatus('error');
      });
  }, [loading, user, token, status, navigate]);

  if (loading) return null;

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-6 bg-[var(--color-bg)] px-4">
      <span className="font-[var(--font-display)] text-lg font-semibold text-[var(--color-text)]">
        {APP_BRANDING.name}
      </span>

      {!user && (
        <>
          <p className="max-w-sm text-center text-sm text-[var(--color-text-muted)]">
            Inicia sesión o crea una cuenta para aceptar esta invitación.
          </p>
          <LoginForm />
        </>
      )}

      {user && status === 'redeeming' && (
        <p className="text-sm text-[var(--color-text-muted)]">Aplicando invitación…</p>
      )}

      {status === 'error' && (
        <div className="w-full max-w-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center">
          <p className="mb-4 text-sm text-red-400">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-[var(--color-bg)]"
          >
            Ir al visor
          </button>
        </div>
      )}
    </div>
  );
}
