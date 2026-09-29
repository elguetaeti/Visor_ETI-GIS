/**
 * DrawingPropertiesPanel
 * ------------------------------------------------------------------
 * Aparece cuando hay un dibujo seleccionado en el mapa. Si es propio,
 * permite cambiar color/tamaño, duplicar o eliminar. Si es ajeno (el
 * admin lo seleccionó para moderar), solo se ofrece eliminar — no
 * tiene sentido dejar "editar" un dibujo que no es tuyo aunque seas
 * admin, la app no llegaría ni a intentarlo porque RLS lo rechazaría.
 * ------------------------------------------------------------------
 */
export default function DrawingPropertiesPanel({ selected, onStyleChange, onDuplicate, onDelete }) {
  if (!selected) return null;

  const title = `#${selected.properties.seqId ?? '—'}${
    selected.properties.label ? ' — ' + selected.properties.label : ''
  }`;

  return (
    <div className="absolute bottom-20 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]/95 px-3 py-2 text-xs backdrop-blur-sm">
      <span className="max-w-[160px] truncate font-[var(--font-mono)] text-[var(--color-text-muted)]">
        {title}
      </span>

      {selected.isOwn && (
        <>
          <label className="flex items-center gap-1.5 text-[var(--color-text-muted)]">
            Color
            <input
              type="color"
              value={selected.properties.drawColor}
              onChange={(e) => onStyleChange('color', e.target.value)}
              className="h-5 w-6 cursor-pointer rounded border border-[var(--color-border)] bg-transparent"
            />
          </label>

          <label className="flex items-center gap-1.5 text-[var(--color-text-muted)]">
            Tamaño
            <input
              type="range"
              min={2}
              max={12}
              step={1}
              value={selected.properties.drawSize}
              onChange={(e) => onStyleChange('size', Number(e.target.value))}
              className="h-1 w-20 accent-[var(--color-accent)]"
            />
          </label>

          <button onClick={onDuplicate} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
            Duplicar
          </button>
        </>
      )}

      {!selected.isOwn && (
        <span className="text-[10px] text-[var(--color-text-muted)]">(dibujo de otro usuario)</span>
      )}

      <button onClick={onDelete} className="text-red-400 hover:text-red-300">
        Eliminar
      </button>
    </div>
  );
}
