import { useState } from 'react';
import Toggle from '../ui/Toggle.jsx';
import IconButton from '../ui/IconButton.jsx';
import { IconZoomIn, IconInfo } from '../ui/icons.jsx';

/**
 * LayerItem
 * ------------------------------------------------------------------
 * Fila de una capa de datos dentro del panel: visibilidad, control
 * de transparencia, zoom a la extensión de la capa e información.
 * Componente controlado — toda la lógica vive en useLayers.
 * ------------------------------------------------------------------
 */
export default function LayerItem({ layer, onToggle, onOpacityChange, onZoomTo }) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <li className="border-b border-[var(--color-border)] px-3 py-2.5 last:border-b-0">
      <div className="flex items-center gap-2">
        <Toggle
          checked={layer.visible}
          onChange={() => onToggle(layer.id)}
          label={`Mostrar/ocultar ${layer.name}`}
        />
        <span className="flex-1 truncate text-sm text-[var(--color-text)]">{layer.name}</span>
        <IconButton
          icon={<IconZoomIn />}
          label="Zoom a la capa"
          size="sm"
          onClick={() => onZoomTo(layer.id)}
        />
        <IconButton
          icon={<IconInfo />}
          label="Información de la capa"
          size="sm"
          active={showInfo}
          onClick={() => setShowInfo((v) => !v)}
        />
      </div>

      <div className="mt-2 flex items-center gap-2 pl-11">
        <span className="text-[10px] font-[var(--font-mono)] text-[var(--color-text-muted)]">
          OPACIDAD
        </span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={layer.opacity}
          onChange={(e) => onOpacityChange(layer.id, Number(e.target.value))}
          className="h-1 flex-1 accent-[var(--color-accent)]"
          aria-label={`Transparencia de ${layer.name}`}
        />
      </div>

      {showInfo && (
        <div className="mt-2 rounded-md bg-[var(--color-surface-alt)] px-3 py-2 pl-11 text-xs text-[var(--color-text-muted)]">
          <p>
            Origen:{' '}
            <span className="font-[var(--font-mono)] text-[var(--color-text)]">
              {layer.source === 'static' ? 'incluida en el proyecto' : 'Supabase'}
            </span>
          </p>
          <p>
            Entidades:{' '}
            <span className="font-[var(--font-mono)] text-[var(--color-text)]">
              {layer.geojson?.features?.length ?? '—'}
            </span>
          </p>
        </div>
      )}
    </li>
  );
}
