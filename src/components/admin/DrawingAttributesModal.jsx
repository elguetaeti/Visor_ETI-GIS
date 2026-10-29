import { useState } from 'react';

/**
 * DrawingAttributesModal
 * Formulario con los campos personalizados definidos por el admin del
 * proyecto; aparece al terminar de dibujar una entidad.
 * Props: { seqId, fields: [{key,label,type}], onSubmit(values), onSkip }
 */
export default function DrawingAttributesModal({ seqId, fields, onSubmit, onSkip }) {
  const [values, setValues] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    const clean = {};
    for (const f of fields) {
      const raw = values[f.key];
      if (raw === undefined || raw === '') continue;
      clean[f.key] = f.type === 'number' ? Number(raw) : raw;
    }
    onSubmit(clean);
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-2xl"
      >
        <h2 className="mb-3 text-sm font-semibold text-[var(--color-text)]">
          Entidad #{seqId} — atributos
        </h2>
        <div className="flex flex-col gap-3">
          {fields.map((f) => (
            <label key={f.key} className="text-xs text-[var(--color-text-muted)]">
              {f.label}
              <input
                type={f.type === 'number' ? 'number' : 'text'}
                step="any"
                value={values[f.key] ?? ''}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                className="mt-1 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
              />
            </label>
          ))}
        </div>
        <div className="mt-4 flex justify-end gap-2 text-sm">
          <button type="button" onClick={onSkip} className="px-3 py-1.5 text-[var(--color-text-muted)]">
            Omitir
          </button>
          <button
            type="submit"
            className="rounded-md bg-[var(--color-accent)] px-4 py-1.5 font-semibold text-[var(--color-bg)]"
          >
            Guardar
          </button>
        </div>
      </form>
    </div>
  );
}
