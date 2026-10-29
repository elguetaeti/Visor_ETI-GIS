import { useState } from 'react';
import { updateProjectConfig } from '../../services/projectService.js';

const slugify = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');

/**
 * CustomFieldsManager
 * El admin define los campos (columnas) que cada usuario llenará al
 * terminar de dibujar. Se guardan en projects.config.customFields.
 */
export default function CustomFieldsManager({ project, fields, onChange }) {
  const [label, setLabel] = useState('');
  const [type, setType] = useState('text');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const save = async (next) => {
    setBusy(true);
    setError(null);
    try {
      await updateProjectConfig(project.id, { customFields: next });
      onChange(next);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const add = async (e) => {
    e.preventDefault();
    const key = slugify(label);
    if (!key) return;
    if (fields.some((f) => f.key === key)) {
      setError('Ya existe un campo con ese nombre.');
      return;
    }
    await save([...fields, { key, label: label.trim(), type }]);
    setLabel('');
  };

  return (
    <div className="flex flex-col gap-3 p-4 text-xs">
      <p className="text-[var(--color-text-muted)]">
        Campos que se pedirán al terminar cada dibujo (ej. Especie, Cantidad). El proyecto, la fecha y
        el usuario se guardan automáticamente.
      </p>
      <ul className="flex flex-col gap-1.5">
        {fields.length === 0 && <li className="text-[var(--color-text-muted)]">Sin campos todavía.</li>}
        {fields.map((f) => (
          <li
            key={f.key}
            className="flex items-center justify-between rounded-md border border-[var(--color-border)] px-3 py-2"
          >
            <span className="text-[var(--color-text)]">
              {f.label} <span className="text-[var(--color-text-muted)]">({f.type === 'number' ? 'número' : 'texto'})</span>
            </span>
            <button
              disabled={busy}
              onClick={() => save(fields.filter((x) => x.key !== f.key))}
              className="text-red-400 hover:text-red-300"
            >
              Quitar
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={add} className="flex gap-2">
        <input
          required
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Nombre del campo"
          className="min-w-0 flex-1 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2 text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-2 text-[var(--color-text)]"
        >
          <option value="text">Texto</option>
          <option value="number">Número</option>
        </select>
        <button
          disabled={busy}
          className="rounded-md bg-[var(--color-accent)] px-3 font-semibold text-[var(--color-bg)] disabled:opacity-60"
        >
          Añadir
        </button>
      </form>
      {error && <p className="text-red-400">{error}</p>}
    </div>
  );
}
