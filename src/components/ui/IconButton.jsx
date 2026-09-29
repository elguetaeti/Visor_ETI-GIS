import clsx from 'clsx';

/**
 * IconButton
 * ------------------------------------------------------------------
 * Botón flotante/circular reutilizado en controles del mapa y en
 * acciones del panel de capas (zoom, info, etc).
 * ------------------------------------------------------------------
 */
export default function IconButton({ icon, label, onClick, active = false, size = 'md' }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={clsx(
        'flex items-center justify-center rounded-lg border transition-colors duration-150',
        size === 'md' ? 'h-9 w-9' : 'h-7 w-7',
        active
          ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-[var(--color-bg)]'
          : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-accent-dim)]'
      )}
    >
      {icon}
    </button>
  );
}
