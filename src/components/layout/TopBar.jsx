import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';
import { APP_BRANDING } from '../../config/mapConfig.js';
import { IconMap } from '../ui/icons.jsx';

const ROLE_LABELS = { editor: 'Editor', viewer: 'Solo lectura' };

/**
 * TopBar
 * ------------------------------------------------------------------
 * Barra superior con el nombre del visor y el estado de sesión. Sin
 * sesión: enlace a /login. Con sesión: correo + indicador de rol.
 *
 * El rol se muestra distinto según su peso: Admin es un badge sólido
 * (destaca, tiene más permisos); Editor/Solo lectura son texto
 * discreto (informan sin competir visualmente); sin rol asignado
 * dice "Sin acceso" en vez de mostrarse igual que un rol real.
 * ------------------------------------------------------------------
 */
export default function TopBar({ project, permissions, onOpenAdmin }) {
  const { user } = useAuth();

  return (
    <header className="absolute top-0 left-0 right-0 z-20 flex h-12 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 px-4 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--color-accent)] text-[var(--color-bg)]">
          <IconMap width={16} height={16} />
        </span>
        <span className="font-[var(--font-display)] text-sm font-semibold tracking-wide text-[var(--color-text)]">
          {APP_BRANDING.name}
        </span>
        {project && (
          <Link
            to="/projects"
            title="Ver todos tus proyectos"
            className="ml-1 rounded bg-[var(--color-surface-alt)] px-1.5 py-0.5 text-[10px] font-[var(--font-mono)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          >
            {project.name}
          </Link>
        )}
      </div>

      <div className="flex items-center gap-3 text-xs">
        {user ? (
          <>
            {permissions &&
              (permissions.role === 'admin' ? (
                <span className="rounded bg-[var(--color-accent)] px-2 py-1 font-[var(--font-mono)] text-[10px] font-bold uppercase text-[var(--color-bg)]">
                  Admin
                </span>
              ) : (
                <span className="text-[10px] text-[var(--color-text-muted)]">
                  {ROLE_LABELS[permissions.role] ?? 'Sin acceso'}
                </span>
              ))}
            {permissions?.isEditor && (
              <button
                onClick={onOpenAdmin}
                className="rounded-md bg-[var(--color-accent)] px-2.5 py-1 font-semibold text-[var(--color-bg)]"
              >
                Administrar
              </button>
            )}
            <span className="hidden text-[var(--color-text-muted)] sm:inline">{user.is_anonymous ? 'Invitado' : user.email}</span>
            <Link
              to="/login"
              className="rounded-md border border-[var(--color-border)] px-2.5 py-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            >
              {user.is_anonymous ? 'Tengo cuenta' : 'Cuenta'}
            </Link>
          </>
        ) : (
          <Link
            to="/login"
            className="rounded-md border border-[var(--color-border)] px-2.5 py-1 text-[var(--color-text-muted)] hover:border-[var(--color-accent-dim)] hover:text-[var(--color-text)]"
          >
            Iniciar sesión
          </Link>
        )}
      </div>
    </header>
  );
}
