import { useState } from 'react';
import { buildDrawingsGeoJSON, downloadGeoJSON } from '../../services/exportService.js';

/** Descarga de dibujos en GeoJSON (solo visible para administradores). */
export default function ExportPanel({ project, customFields }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  const handleExport = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const collection = await buildDrawingsGeoJSON({
        ...project,
        config: { ...project.config, customFields },
      });
      if (collection.features.length === 0) {
        setMessage('Este proyecto todavía no tiene dibujos.');
        return;
      }
      const date = new Date().toISOString().slice(0, 10);
      downloadGeoJSON(collection, `${project.slug}-dibujos-${date}.geojson`);
      setMessage(`Descargados ${collection.features.length} dibujos.`);
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 p-4 text-xs">
      <p className="text-[var(--color-text-muted)]">
        Descarga todos los dibujos del proyecto (de todos los usuarios) en GeoJSON, listo para abrir en
        QGIS (WGS84). Incluye id, descripción, usuario, fecha y tus campos personalizados como columnas.
      </p>
      <button
        onClick={handleExport}
        disabled={busy}
        className="rounded-md bg-[var(--color-accent)] py-2 font-semibold text-[var(--color-bg)] disabled:opacity-60"
      >
        {busy ? 'Preparando…' : 'Descargar GeoJSON'}
      </button>
      {message && <p className="text-[var(--color-text-muted)]">{message}</p>}
    </div>
  );
}
