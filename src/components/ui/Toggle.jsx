import clsx from 'clsx';

/**
 * Toggle
 * ------------------------------------------------------------------
 * Interruptor accesible reutilizado en visibilidad de capas y
 * basemaps. Componente puro: no conoce mapas ni capas, solo recibe
 * `checked` y `onChange`.
 * ------------------------------------------------------------------
 */
export default function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={clsx(
        'relative h-5 w-9 shrink-0 rounded-full transition-colors duration-150',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]',
        checked ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-border)]'
      )}
    >
      <span
        className={clsx(
          'absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-[var(--color-bg)] transition-transform duration-150',
          checked && 'translate-x-4'
        )}
      />
    </button>
  );
}
