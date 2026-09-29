import { useCallback, useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { useMapContext } from './MapContext.jsx';
import { supabase } from '../supabase/client.js';
import { INITIAL_LAYER } from '../config/mapConfig.js';
import {
  buildGeoJSONSource,
  buildFillLayerSpec,
  buildOutlineLayerSpec,
  loadStaticGeoJSON,
  renderAttributePopupHTML,
  fetchProjectLayers,
  getPublicLayerUrl,
} from '../services/layerService.js';
import { getBounds } from '../utils/geojsonHelpers.js';

const sourceIdOf = (layerId) => `${layerId}-source`;
const internalIdOf = (dbId) => `supabase-${dbId}`;

const DEFAULT_STYLE = {
  fillColor: '#2563eb',
  strokeColor: '#1d4ed8',
  strokeWidth: 1.5,
  fillOpacity: 0.6,
};

/**
 * useLayers
 * ------------------------------------------------------------------
 * Orquesta el ciclo de vida de TODAS las capas de datos sobre el
 * mapa, sin importar su origen: la capa GeoJSON estática embebida en
 * el proyecto, y las capas subidas por el administrador a Supabase.
 * Ambas pasan por el mismo `addLayerToMap`, agnóstico a la fuente.
 *
 * Las capas de Supabase se mantienen sincronizadas en vivo vía
 * Realtime: subir, editar (nombre/color/opacidad/orden/popup) o
 * eliminar una capa se refleja al instante en el mapa de todos los
 * usuarios conectados, sin recargar la página.
 * ------------------------------------------------------------------
 */
export function useLayers(projectId, projectConfig) {
  const { map, isLoaded, isDrawingRef } = useMapContext();
  const [layers, setLayers] = useState([]);
  const popupRef = useRef(null);
  const addedIdsRef = useRef(new Set());
  const staticLoadedRef = useRef(false);
  // dbId (uuid de la fila `layers`) -> id interno usado en el mapa/estado
  const dbIdMapRef = useRef(new Map());
  // id interno -> popup config vigente (para que el click-handler, creado
  // una sola vez, siempre lea la versión más reciente y no una capturada
  // por closure en el momento de añadir la capa)
  const popupConfigRef = useRef(new Map());

  const addLayerToMap = useCallback(
    async (config) => {
      if (!map || addedIdsRef.current.has(config.id)) return;
      addedIdsRef.current.add(config.id);
      if (config.dbId) dbIdMapRef.current.set(config.dbId, config.id);
      popupConfigRef.current.set(config.id, config.popup ?? {});

      const geojson = await loadStaticGeoJSON(config.dataPath);
      const sourceId = sourceIdOf(config.id);

      map.addSource(sourceId, buildGeoJSONSource(geojson));
      // Si el control de dibujo ya existe, insertamos esta capa justo
      // debajo de sus capas — así los dibujos (puntos, líneas, polígonos)
      // siempre quedan visibles por encima de las capas de datos, sin
      // importar el orden en que terminen de cargar.
      const beforeId = map.getLayer('gl-draw-polygon-fill') ? 'gl-draw-polygon-fill' : undefined;
      map.addLayer(buildFillLayerSpec(config.id, sourceId, config.style), beforeId);
      map.addLayer(buildOutlineLayerSpec(config.id, sourceId, config.style), beforeId);

      if (!config.visibleByDefault) {
        setLayerVisibility(map, config.id, false);
      }

      map.on('click', `${config.id}-fill`, (e) => {
        if (isDrawingRef.current) return; // hay una herramienta de dibujo activa: el clic es para eso
        const popupConfig = popupConfigRef.current.get(config.id);
        if (popupConfig?.enabled === false) return; // el admin apagó el popup de esta capa
        const feature = e.features?.[0];
        if (!feature) return;

        if (popupRef.current) popupRef.current.remove();
        popupRef.current = new maplibregl.Popup({ closeButton: true, maxWidth: '300px' })
          .setLngLat(e.lngLat)
          .setHTML(renderAttributePopupHTML(feature.properties, popupConfig))
          .addTo(map);
      });

      map.on('mouseenter', `${config.id}-fill`, () => {
        if (isDrawingRef.current) return;
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', `${config.id}-fill`, () => {
        if (isDrawingRef.current) return;
        map.getCanvas().style.cursor = '';
      });

      setLayers((prev) => [
        ...prev,
        {
          id: config.id,
          dbId: config.dbId ?? null,
          name: config.name,
          source: config.source,
          storagePath: config.storagePath ?? null,
          visible: config.visibleByDefault,
          opacity: config.style.fillOpacity,
          style: config.style,
          zIndex: config.zIndex ?? 0,
          popup: config.popup ?? {},
          geojson,
        },
      ]);
    },
    [map]
  );

  const removeLayerFromMap = useCallback((internalId) => {
    if (!map) return;
    if (map.getLayer(`${internalId}-fill`)) map.removeLayer(`${internalId}-fill`);
    if (map.getLayer(`${internalId}-outline`)) map.removeLayer(`${internalId}-outline`);
    if (map.getSource(sourceIdOf(internalId))) map.removeSource(sourceIdOf(internalId));
    addedIdsRef.current.delete(internalId);
    popupConfigRef.current.delete(internalId);
    for (const [dbId, mappedId] of dbIdMapRef.current.entries()) {
      if (mappedId === internalId) dbIdMapRef.current.delete(dbId);
    }
    setLayers((prev) => prev.filter((l) => l.id !== internalId));
  }, [map]);

  /** Trae las capas de Supabase del proyecto y añade solo las que faltan. */
  const loadSupabaseLayers = useCallback(async () => {
    if (!projectId) return;
    let rows;
    try {
      rows = await fetchProjectLayers(projectId);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[useLayers] Error consultando capas de Supabase:', err);
      return;
    }

    for (const row of rows) {
      const style = Array.isArray(row.styles) ? row.styles[0] : row.styles;
      const config = {
        id: internalIdOf(row.id),
        dbId: row.id,
        name: row.name,
        source: 'supabase',
        storagePath: row.storage_path,
        dataPath: getPublicLayerUrl(row.storage_path),
        visibleByDefault: row.visible_by_default,
        zIndex: row.z_index ?? 0,
        style: {
          fillColor: style?.fill_color ?? DEFAULT_STYLE.fillColor,
          strokeColor: style?.stroke_color ?? DEFAULT_STYLE.strokeColor,
          strokeWidth: style?.stroke_width ?? DEFAULT_STYLE.strokeWidth,
          fillOpacity: style?.opacity ?? DEFAULT_STYLE.fillOpacity,
        },
        popup: style?.popup_config ?? {},
      };
      // eslint-disable-next-line no-await-in-loop
      await addLayerToMap(config).catch((err) => {
        // eslint-disable-next-line no-console
        console.error(`[useLayers] Error añadiendo capa "${row.name}":`, err);
      });
    }
  }, [projectId, addLayerToMap]);

  /** Reordena las capas de Supabase sobre el mapa según su z_index actual. */
  const reorderSupabaseLayers = useCallback(async () => {
    if (!map || !projectId) return;
    let rows;
    try {
      rows = await fetchProjectLayers(projectId);
    } catch {
      return;
    }
    const sorted = [...rows].sort((a, b) => (a.z_index ?? 0) - (b.z_index ?? 0));
    for (const row of sorted) {
      const internalId = dbIdMapRef.current.get(row.id);
      if (!internalId) continue;
      if (map.getLayer(`${internalId}-fill`)) map.moveLayer(`${internalId}-fill`);
      if (map.getLayer(`${internalId}-outline`)) map.moveLayer(`${internalId}-outline`);
    }
  }, [map, projectId]);

  // Carga inicial: la capa estática del proyecto + las capas de Supabase.
  useEffect(() => {
    if (isLoaded && !staticLoadedRef.current) {
      staticLoadedRef.current = true;
      const staticLayerConfig = {
        ...INITIAL_LAYER,
        popup: { ...INITIAL_LAYER.popup, ...(projectConfig?.staticLayerPopup ?? {}) },
      };
      addLayerToMap(staticLayerConfig).catch((err) => {
        // eslint-disable-next-line no-console
        console.error('[useLayers] Error cargando capa inicial:', err);
      });
      loadSupabaseLayers();
    }
  }, [isLoaded, addLayerToMap, loadSupabaseLayers, projectConfig]);

  // Realtime: altas, bajas y cambios de metadata en `layers`.
  useEffect(() => {
    if (!isLoaded || !projectId) return undefined;

    const channel = supabase
      .channel(`layers-${projectId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'layers', filter: `project_id=eq.${projectId}` },
        () => loadSupabaseLayers()
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'layers' },
        (payload) => {
          // Nota: en un DELETE, Postgres solo garantiza la clave primaria en
          // `old` (a menos que la tabla tenga REPLICA IDENTITY FULL), así
          // que `project_id` no está disponible aquí para filtrar en el
          // servidor. Filtramos en el cliente: si no es una capa que ya
          // tenemos en el mapa, removeLayerFromMap simplemente no hace nada.
          const internalId = internalIdOf(payload.old.id);
          removeLayerFromMap(internalId);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'layers', filter: `project_id=eq.${projectId}` },
        (payload) => {
          const internalId = internalIdOf(payload.new.id);
          setLayers((prev) =>
            prev.map((l) => (l.id === internalId ? { ...l, name: payload.new.name, zIndex: payload.new.z_index } : l))
          );
          reorderSupabaseLayers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isLoaded, projectId, loadSupabaseLayers, removeLayerFromMap, reorderSupabaseLayers]);

  // Realtime: cambios de estilo/popup (tabla `styles`, sin project_id propio;
  // se filtra en el cliente contra las capas que ya conocemos de este proyecto).
  useEffect(() => {
    if (!isLoaded || !map) return undefined;

    const channel = supabase
      .channel(`styles-${projectId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'styles' },
        (payload) => {
          const internalId = dbIdMapRef.current.get(payload.new.layer_id);
          if (!internalId) return; // capa de otro proyecto, se ignora

          const s = payload.new;
          if (map.getLayer(`${internalId}-fill`)) {
            map.setPaintProperty(`${internalId}-fill`, 'fill-color', s.fill_color);
            map.setPaintProperty(`${internalId}-fill`, 'fill-opacity', s.opacity);
          }
          if (map.getLayer(`${internalId}-outline`)) {
            map.setPaintProperty(`${internalId}-outline`, 'line-color', s.stroke_color);
            map.setPaintProperty(`${internalId}-outline`, 'line-width', s.stroke_width);
          }
          popupConfigRef.current.set(internalId, s.popup_config ?? {});

          setLayers((prev) =>
            prev.map((l) =>
              l.id === internalId
                ? {
                    ...l,
                    opacity: s.opacity,
                    style: {
                      fillColor: s.fill_color,
                      strokeColor: s.stroke_color,
                      strokeWidth: s.stroke_width,
                      fillOpacity: s.opacity,
                    },
                    popup: s.popup_config ?? {},
                  }
                : l
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isLoaded, map, projectId]);

  // Realtime: config del proyecto (incluye el popup de la capa base,
  // que no vive en `layers`/`styles` sino en `projects.config`).
  useEffect(() => {
    if (!isLoaded || !projectId) return undefined;

    const channel = supabase
      .channel(`project-config-${projectId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'projects', filter: `id=eq.${projectId}` },
        (payload) => {
          const nextPopup = payload.new.config?.staticLayerPopup;
          if (!nextPopup) return;
          const internalId = INITIAL_LAYER.id;
          popupConfigRef.current.set(internalId, { ...INITIAL_LAYER.popup, ...nextPopup });
          setLayers((prev) =>
            prev.map((l) => (l.id === internalId ? { ...l, popup: { ...INITIAL_LAYER.popup, ...nextPopup } } : l))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isLoaded, projectId]);

  const toggleVisibility = useCallback(
    (layerId) => {
      if (!map) return;
      setLayers((prev) =>
        prev.map((l) => {
          if (l.id !== layerId) return l;
          const nextVisible = !l.visible;
          setLayerVisibility(map, layerId, nextVisible);
          return { ...l, visible: nextVisible };
        })
      );
    },
    [map]
  );

  const setOpacity = useCallback(
    (layerId, opacity) => {
      if (!map) return;
      map.setPaintProperty(`${layerId}-fill`, 'fill-opacity', opacity);
      setLayers((prev) => prev.map((l) => (l.id === layerId ? { ...l, opacity } : l)));
    },
    [map]
  );

  const zoomToLayer = useCallback(
    (layerId) => {
      if (!map) return;
      const layer = layers.find((l) => l.id === layerId);
      if (!layer?.geojson) return;
      const [minX, minY, maxX, maxY] = getBounds(layer.geojson);
      map.fitBounds(
        [
          [minX, minY],
          [maxX, maxY],
        ],
        { padding: 40, duration: 600 }
      );
    },
    [map, layers]
  );

  return { layers, toggleVisibility, setOpacity, zoomToLayer };
}

function setLayerVisibility(map, layerId, visible) {
  const value = visible ? 'visible' : 'none';
  map.setLayoutProperty(`${layerId}-fill`, 'visibility', value);
  map.setLayoutProperty(`${layerId}-outline`, 'visibility', value);
}