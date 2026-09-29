import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';

/**
 * LoginForm
 * ------------------------------------------------------------------
 * Formulario con dos modos (iniciar sesión / crear cuenta). No
 * decide roles ni permisos — eso lo resuelve usePermissions después
 * de autenticarse, consultando la tabla `permissions`. Crear una
 * cuenta aquí NO da acceso de administrador automáticamente; ese
 * primer permiso se otorga manualmente una vez, por SQL.
 * ------------------------------------------------------------------
 */
export default function LoginForm() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setStatus(null);
    setSubmitting(true);
    try {
      if (mode === 'signin') {
        await signIn(email, password);
      } else {
        await signUp(email, password, fullName);
        setStatus('Cuenta creada. Revisa tu correo para confirmar el registro antes de iniciar sesión.');
      }
    } catch (err) {
      setError(err.message ?? 'Ocurrió un error.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xl">
      <div className="mb-5 flex gap-2 text-sm">
        <button
          type="button"
          onClick={() => setMode('signin')}
          className={`flex-1 rounded-md py-1.5 font-medium transition-colors ${
            mode === 'signin'
              ? 'bg-[var(--color-accent)] text-[var(--color-bg)]'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          Iniciar sesión
        </button>
        <button
          type="button"
          onClick={() => setMode('signup')}
          className={`flex-1 rounded-md py-1.5 font-medium transition-colors ${
            mode === 'signup'
              ? 'bg-[var(--color-accent)] text-[var(--color-bg)]'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          Crear cuenta
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {mode === 'signup' && (
          <input
            type="text"
            placeholder="Nombre completo"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
          />
        )}
        <input
          type="email"
          required
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
        />
        <input
          type="password"
          required
          minLength={6}
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
        />

        {error && <p className="text-xs text-red-400">{error}</p>}
        {status && <p className="text-xs text-[var(--color-accent)]">{status}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-1 rounded-md bg-[var(--color-accent)] py-2 text-sm font-semibold text-[var(--color-bg)] transition-opacity disabled:opacity-60"
        >
          {submitting ? 'Un momento…' : mode === 'signin' ? 'Entrar' : 'Crear cuenta'}
        </button>
      </form>
    </div>
  );
}
