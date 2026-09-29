import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { uploadLayerFile, createLayerRecord } from '../../services/layerService.js';

/**
 * LayerUploader
 * ------------------------------------------------------------------
 * Formulario de administrador: sube un archivo GeoJSON a Supabase
 * Storage y crea su registro en la tabla `layers` (con estilo por
 * defecto). No hace falta redeploy ni recargar: la suscripción a
 * Realtime en useLayers detecta el INSERT y la añade al mapa de
 * todos los usuarios conectados.
 * ------------------------------------------------------------------
 */
export default function LayerUploader({ projectId, onUploaded }) {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setSubmitting(true);
    setError(null);
    setStatus(null);
    try {
      const storagePath = await uploadLayerFile(file, projectId);
      await createLayerRecord({
        projectId,
        name: name.trim() || file.name,
        storagePath,
        userId: user.id,
      });
      setStatus('Capa subida — ya está visible para todos, sin recargar.');
      setFile(null);
      setName('');
      setTimeout(() => onUploaded?.(), 1400);
    } catch (err) {
      setError(err.message ?? 'Error al subir la capa.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4">
      <p className="text-xs text-[var(--color-text-muted)]">
        Sube un archivo <span className="font-[var(--font-mono)]">.geojson</span> — quedará
        disponible para todos los usuarios de inmediato.
      </p>

      <input
        type="text"
        placeholder="Nombre de la capa"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
      />

      <input
        type="file"
        accept=".geojson,.json,application/geo+json"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="text-xs text-[var(--color-text-muted)] file:mr-3 file:rounded-md file:border-0 file:bg-[var(--color-accent)] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[var(--color-bg)]"
      />

      {error && <p className="text-xs text-red-400">{error}</p>}
      {status && <p className="text-xs text-[var(--color-accent)]">{status}</p>}

      <button
        type="submit"
        disabled={!file || submitting}
        className="rounded-md bg-[var(--color-accent)] py-2 text-sm font-semibold text-[var(--color-bg)] transition-opacity disabled:opacity-50"
      >
        {submitting ? 'Subiendo…' : 'Subir capa'}
      </button>
    </form>
  );
}
