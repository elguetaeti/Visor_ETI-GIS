import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import LoginForm from '../components/auth/LoginForm.jsx';
import { APP_BRANDING } from '../config/mapConfig.js';

/**
 * LoginPage
 * ------------------------------------------------------------------
 * Página de acceso de administrador/editor. Si ya hay sesión activa,
 * muestra un atajo para volver al visor en vez del formulario.
 * ------------------------------------------------------------------
 */
export default function LoginPage() {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) return null;

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-6 bg-[var(--color-bg)] px-4">
      <span className="font-[var(--font-display)] text-lg font-semibold text-[var(--color-text)]">
        {APP_BRANDING.name}
      </span>

      {user ? (
        <div className="w-full max-w-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center">
          <p className="mb-4 text-sm text-[var(--color-text-muted)]">
            Sesión iniciada como{' '}
            <span className="text-[var(--color-text)]">{user.email}</span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/')}
              className="flex-1 rounded-md bg-[var(--color-accent)] py-2 text-sm font-semibold text-[var(--color-bg)]"
            >
              Ir al visor
            </button>
            <button
              onClick={() => signOut()}
              className="flex-1 rounded-md border border-[var(--color-border)] py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      ) : (
        <LoginForm />
      )}
    </div>
  );
}
