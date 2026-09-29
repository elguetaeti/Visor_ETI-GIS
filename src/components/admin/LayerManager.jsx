import { useState } from 'react';
import {
  updateLayerStyle,
  updateLayerMeta,
  deleteLayer,
} from '../../services/layerService.js';
import { updateProjectConfig } from '../../services/projectService.js';

/**
 * LayerManager
 * ------------------------------------------------------------------
 * Lista las capas del proyecto (recibidas desde useLayers, la misma
 * fuente de verdad que pinta el mapa) y permite editarlas o
 * eliminarlas. Escribe directo contra Supabase — la suscripción a
 * Realtime en useLayers es quien refleja el cambio en el mapa de
 * todos, incluido este mismo cliente admin.
 *
 * La capa base (la que no viene de Supabase, embebida en el
 * proyecto) se administra aparte: solo su popup es editable, y esa
 * configuración se guarda en `projects.config`, no en `layers`.
 *
 * Todas las escrituras pasan por `runAction`, que captura errores
 * (típicamente de RLS/permisos) y los muestra en pantalla — antes
 * fallaban en silencio, lo cual hacía imposible saber qué pasaba.
 * ------------------------------------------------------------------
 */
export default function LayerManager({ layers, project }) {
  const [error, setError] = useState(null);

  const staticLayer = layers.find((l) => l.source === 'static');
  const supabaseLayers = [...layers]
    .filter((l) => l.source === 'supabase')
    .sort((a, b) => a.zIndex - b.zIndex);

  const runAction = async (promise) => {
    setError(null);
    try {
      await promise;
      return true;
    } catch (err) {
      setError(err.message ?? 'Ocurrió un error al guardar el cambio.');
      return false;
    }
  };

  const moveLayer = (layer, direction) => {
    const idx = supabaseLayers.findIndex((l) => l.id === layer.id);
    const neighborIdx = direction === 'up' ? idx - 1 : idx + 1;
    const neighbor = supabaseLayers[neighborIdx];
    if (!neighbor) return;
    runAction(
      Promise.all([
        updateLayerMeta(layer.dbId, { z_index: neighbor.zIndex }),
        updateLayerMeta(neighbor.dbId, { z_index: layer.zIndex }),
      ])
    );
  };

  const handleDelete = (layer) => {
    if (!window.confirm(`¿Eliminar la capa "${layer.name}"? Esta acción no se puede deshacer.`)) return;
    runAction(deleteLayer(layer.dbId, layer.storagePath));
  };

  return (
    <div>
      {error && (
        <p className="border-b border-red-900/40 bg-red-950/40 px-4 py-2 text-xs text-red-400">
          {error}
        </p>
      )}

      {staticLayer && <StaticLayerSection project={project} staticLayer={staticLayer} />}

      {supabaseLayers.length === 0 ? (
        <p className="px-4 py-3 text-xs text-[var(--color-text-muted)]">
          Todavía no hay capas subidas en este proyecto.
        </p>
      ) : (
        <ul className="max-h-72 overflow-y-auto">
          {supabaseLayers.map((layer, idx) => (
            <LayerRow
              key={layer.id}
              layer={layer}
              isFirst={idx === 0}
              isLast={idx === supabaseLayers.length - 1}
              onMoveUp={() => moveLayer(layer, 'up')}
              onMoveDown={() => moveLayer(layer, 'down')}
              onDelete={() => handleDelete(layer)}
              runAction={runAction}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

/** Sección para la capa base del proyecto: solo su popup es editable aquí. */
function StaticLayerSection({ project, staticLayer }) {
  const [showEditor, setShowEditor] = useState(false);
  const [error, setError] = useState(null);

  const runAction = async (promise) => {
    setError(null);
    try {
      await promise;
      return true;
    } catch (err) {
      setError(err.message ?? 'Ocurrió un error al guardar el cambio.');
      return false;
    }
  };

  return (
    <div className="border-b border-[var(--color-border)] px-4 py-3">
      <p className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">
        Capa base del proyecto
      </p>
      <p className="mb-1 text-sm text-[var(--color-text)]">{staticLayer.name}</p>

      {error && <p className="mb-2 text-xs text-red-400">{error}</p>}

      <button
        type="button"
        onClick={() => setShowEditor((v) => !v)}
        className="text-[10px] font-[var(--font-mono)] uppercase text-[var(--color-accent)] hover:underline"
      >
        {showEditor ? 'Ocultar editor de popup' : 'Elegir atributos del popup'}
      </button>

      {showEditor && (
        <PopupFieldsEditor
          popup={staticLayer.popup}
          geojson={staticLayer.geojson}
          onSave={(popupConfig) => runAction(updateProjectConfig(project.id, { staticLayerPopup: popupConfig }))}
          onSaved={() => setShowEditor(false)}
        />
      )}
    </div>
  );
}

function LayerRow({ layer, isFirst, isLast, onMoveUp, onMoveDown, onDelete, runAction }) {
  const [name, setName] = useState(layer.name);
  const [showPopupEditor, setShowPopupEditor] = useState(false);

  const saveName = () => {
    if (name.trim() && name !== layer.name) {
      runAction(updateLayerMeta(layer.dbId, { name: name.trim() }));
    }
  };

  const updateStyleField = (field, value) => {
    runAction(updateLayerStyle(layer.dbId, { [field]: value }));
  };

  return (
    <li className="border-b border-[var(--color-border)] px-4 py-3 last:border-b-0">
      <div className="flex items-center gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={saveName}
          className="flex-1 rounded border border-transparent bg-transparent px-1 py-0.5 text-sm text-[var(--color-text)] hover:border-[var(--color-border)] focus:border-[var(--color-accent)] focus:outline-none"
        />
        <button
          type="button"
          disabled={isFirst}
          onClick={onMoveUp}
          title="Subir en el orden de dibujo"
          className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-30"
        >
          ▲
        </button>
        <button
          type="button"
          disabled={isLast}
          onClick={onMoveDown}
          title="Bajar en el orden de dibujo"
          className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-30"
        >
          ▼
        </button>
        <button
          type="button"
          onClick={onDelete}
          title="Eliminar capa"
          className="text-xs text-red-400 hover:text-red-300"
        >
          Eliminar
        </button>
      </div>

      <div className="mt-2 flex items-center gap-3 text-[10px] text-[var(--color-text-muted)]">
        <label className="flex items-center gap-1">
          Relleno
          <input
            type="color"
            defaultValue={layer.style.fillColor}
            onChange={(e) => updateStyleField('fill_color', e.target.value)}
            className="h-5 w-6 cursor-pointer rounded border border-[var(--color-border)] bg-transparent"
          />
        </label>
        <label className="flex items-center gap-1">
          Borde
          <input
            type="color"
            defaultValue={layer.style.strokeColor}
            onChange={(e) => updateStyleField('stroke_color', e.target.value)}
            className="h-5 w-6 cursor-pointer rounded border border-[var(--color-border)] bg-transparent"
          />
        </label>
        <label className="flex flex-1 items-center gap-1">
          Opacidad
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            defaultValue={layer.opacity}
            onChange={(e) => updateStyleField('opacity', Number(e.target.value))}
            className="h-1 flex-1 accent-[var(--color-accent)]"
          />
        </label>
      </div>

      <button
        type="button"
        onClick={() => setShowPopupEditor((v) => !v)}
        className="mt-2 text-[10px] font-[var(--font-mono)] uppercase text-[var(--color-accent)] hover:underline"
      >
        {showPopupEditor ? 'Ocultar editor de popup' : 'Elegir atributos del popup'}
      </button>

      {showPopupEditor && (
        <PopupFieldsEditor
          popup={layer.popup}
          geojson={layer.geojson}
          onSave={(popupConfig) => runAction(updateLayerStyle(layer.dbId, { popup_config: popupConfig }))}
          onSaved={() => setShowPopupEditor(false)}
        />
      )}
    </li>
  );
}

/**
 * PopupFieldsEditor
 * ------------------------------------------------------------------
 * Editor de popup genérico, reutilizado tanto para capas de Supabase
 * como para la capa base — cada una le pasa su propio `onSave` que
 * decide DÓNDE se guarda (tabla `styles` o `projects.config`).
 * ------------------------------------------------------------------
 */
function PopupFieldsEditor({ popup, geojson, onSave, onSaved }) {
  const allKeys = Object.keys(geojson?.features?.[0]?.properties ?? {});
  const [enabled, setEnabled] = useState(popup?.enabled ?? true);
  const [titleField, setTitleField] = useState(popup?.titleField ?? '');
  const [fields, setFields] = useState(popup?.fields?.length ? popup.fields : allKeys);
  const [saving, setSaving] = useState(false);

  const toggleField = (key) => {
    setFields((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const save = async () => {
    setSaving(true);
    const ok = await onSave({ enabled, titleField: titleField || null, fields });
    setSaving(false);
    if (ok) onSaved?.();
  };

  return (
    <div className="mt-2 rounded-md bg-[var(--color-surface-alt)] p-2.5">
      <label className="mb-2 flex items-center gap-2 text-[10px] text-[var(--color-text)]">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="accent-[var(--color-accent)]"
        />
        Mostrar popup al hacer clic en esta capa
      </label>

      {enabled && allKeys.length === 0 && (
        <p className="mb-2 text-[10px] text-[var(--color-text-muted)]">
          Esta capa no tiene atributos que mostrar.
        </p>
      )}

      {enabled && allKeys.length > 0 && (
        <>
          <label className="mb-2 block text-[10px] text-[var(--color-text-muted)]">
            Campo usado como título del popup
            <select
              value={titleField}
              onChange={(e) => setTitleField(e.target.value)}
              className="mt-1 w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-xs text-[var(--color-text)]"
            >
              <option value="">(ninguno — dice "Atributos")</option>
              {allKeys.map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </label>

          <p className="mb-1 text-[10px] text-[var(--color-text-muted)]">Atributos a mostrar:</p>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {allKeys.map((key) => (
              <label key={key} className="flex items-center gap-1 text-[10px] text-[var(--color-text)]">
                <input
                  type="checkbox"
                  checked={fields.includes(key)}
                  onChange={() => toggleField(key)}
                  className="accent-[var(--color-accent)]"
                />
                {key}
              </label>
            ))}
          </div>
        </>
      )}

      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="mt-2 w-full rounded-md bg-[var(--color-accent)] py-1.5 text-[11px] font-semibold text-[var(--color-bg)] disabled:opacity-60"
      >
        {saving ? 'Guardando…' : 'Guardar popup'}
      </button>
    </div>
  );
}
