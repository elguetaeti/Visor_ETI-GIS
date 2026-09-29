import { useState } from 'react';
import clsx from 'clsx';
import LayerItem from './LayerItem.jsx';
import IconButton from '../ui/IconButton.jsx';
import { IconChevronLeft, IconChevronRight, IconLayers } from '../ui/icons.jsx';

/**
 * LayerPanel
 * ------------------------------------------------------------------
 * Panel lateral colapsable. Recibe todo su estado por props —no usa
 * los hooks de mapa directamente— para garantizar que exista una
 * única instancia de useBasemap/useLayers en toda la app (ambos
 * hooks añaden listeners al mapa; duplicarlos duplicaría popups y
 * listeners).
 *
 * Sección "Mapas base": exclusiva por diseño porque `activeBasemapId`
 * es un único valor, no un Set — es imposible representar "ambos
 * activos" en el estado.
 * ------------------------------------------------------------------
 */
export default function LayerPanel({ basemap, layers }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={clsx(
        'absolute top-16 left-3 z-20 flex flex-col overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/95 shadow-xl backdrop-blur-sm transition-[width] duration-200',
        collapsed ? 'w-11' : 'w-72'
      )}
      style={{ maxHeight: 'calc(100vh - 5rem)' }}
    >
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-3 py-2.5">
        {!collapsed && (
          <div className="flex items-center gap-2 text-[var(--color-text)]">
            <IconLayers width={16} height={16} />
            <span className="text-xs font-[var(--font-display)] font-semibold uppercase tracking-wide">
              Capas
            </span>
          </div>
        )}
        <IconButton
          icon={collapsed ? <IconChevronRight /> : <IconChevronLeft />}
          label={collapsed ? 'Expandir panel' : 'Colapsar panel'}
          size="sm"
          onClick={() => setCollapsed((v) => !v)}
        />
      </div>

      {!collapsed && (
        <div className="overflow-y-auto">
          <section>
            <h3 className="px-3 pt-3 pb-1 text-[10px] font-[var(--font-mono)] uppercase tracking-wider text-[var(--color-text-muted)]">
              Mapas base
            </h3>
            <ul>
              {basemap.basemaps.map((b) => (
                <li key={b.id} className="px-3 py-1.5">
                  <button
                    type="button"
                    onClick={() => basemap.setActiveBasemapId(b.id)}
                    className={clsx(
                      'flex w-full items-center gap-2 rounded-md border px-2.5 py-1.5 text-left text-sm transition-colors',
                      basemap.activeBasemapId === b.id
                        ? 'border-[var(--color-accent)] bg-[var(--color-surface-alt)] text-[var(--color-text)]'
                        : 'border-transparent text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)]'
                    )}
                  >
                    <span
                      className={clsx(
                        'h-2.5 w-2.5 rounded-full',
                        basemap.activeBasemapId === b.id
                          ? 'bg-[var(--color-accent)]'
                          : 'bg-[var(--color-border)]'
                      )}
                    />
                    {b.name}
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-1">
            <h3 className="px-3 pt-2 pb-1 text-[10px] font-[var(--font-mono)] uppercase tracking-wider text-[var(--color-text-muted)]">
              Capas del proyecto
            </h3>
            {layers.layers.length === 0 ? (
              <p className="px-3 py-3 text-xs text-[var(--color-text-muted)]">Cargando capas…</p>
            ) : (
              <ul>
                {layers.layers.map((layer) => (
                  <LayerItem
                    key={layer.id}
                    layer={layer}
                    onToggle={layers.toggleVisibility}
                    onOpacityChange={layers.setOpacity}
                    onZoomTo={layers.zoomToLayer}
                  />
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </aside>
  );
}
