import { useCallback, useEffect, useRef, useState } from 'react';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import * as turf from '@turf/turf';
import { useMapContext } from './MapContext.jsx';
import { useAuth } from './useAuth.jsx';
import { supabase } from '../supabase/client.js';
import {
  fetchProjectDrawings,
  createDrawing,
  updateDrawing,
  deleteDrawing,
} from '../services/drawingService.js';

export const DEFAULT_DRAWING_STYLE = { color: '#f2a65a', size: 4 };

/**
 * Estilos propios para MapboxDraw: en vez de los colores fijos por
 * defecto, leen `user_drawColor` / `user_drawSize` — propiedades que
 * nosotros mismos ponemos en cada feature. MapboxDraw expone
 * automáticamente las propiedades de un feature con el prefijo
 * "user_" dentro de sus capas de render, así que esto permite que
 * cada dibujo tenga su propio color/tamaño sin tocar el core de Draw.
 */
const DRAW_STYLES = [
  {
    id: 'gl-draw-polygon-fill',
    type: 'fill',
    filter: ['==', '$type', 'Polygon'],
    paint: {
      'fill-color': ['coalesce', ['get', 'user_drawColor'], DEFAULT_DRAWING_STYLE.color],
      'fill-opacity': 0.25,
    },
  },
  {
    id: 'gl-draw-polygon-stroke',
    type: 'line',
    filter: ['==', '$type', 'Polygon'],
    paint: {
      'line-color': ['coalesce', ['get', 'user_drawColor'], DEFAULT_DRAWING_STYLE.color],
      'line-width': ['coalesce', ['get', 'user_drawSize'], DEFAULT_DRAWING_STYLE.size / 2],
    },
  },
  {
    id: 'gl-draw-line',
    type: 'line',
    filter: ['==', '$type', 'LineString'],
    paint: {
      'line-color': ['coalesce', ['get', 'user_drawColor'], DEFAULT_DRAWING_STYLE.color],
      'line-width': ['coalesce', ['get', 'user_drawSize'], DEFAULT_DRAWING_STYLE.size],
    },
  },
  {
    id: 'gl-draw-point',
    type: 'circle',
    filter: ['all', ['==', '$type', 'Point'], ['==', 'meta', 'feature']],
    paint: {
      'circle-radius': ['coalesce', ['get', 'user_drawSize'], DEFAULT_DRAWING_STYLE.size],
      'circle-color': ['coalesce', ['get', 'user_drawColor'], DEFAULT_DRAWING_STYLE.color],
      'circle-stroke-width': 2,
      'circle-stroke-color': '#0b1220',
    },
  },
  {
    id: 'gl-draw-vertex',
    type: 'circle',
    filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point']],
    paint: {
      'circle-radius': 4,
      'circle-color': '#ffffff',
      'circle-stroke-color': DEFAULT_DRAWING_STYLE.color,
      'circle-stroke-width': 2,
    },
  },
  {
    id: 'gl-draw-midpoint',
    type: 'circle',
    filter: ['all', ['==', 'meta', 'midpoint'], ['==', '$type', 'Point']],
    paint: {
      'circle-radius': 3,
      'circle-color': DEFAULT_DRAWING_STYLE.color,
    },
  },
];

function rowToFeature(row) {
  return {
    type: 'Feature',
    properties: {
      dbId: row.id,
      ownerId: row.user_id,
      seqId: row.seq_id,
      drawColor: row.style?.color ?? DEFAULT_DRAWING_STYLE.color,
      drawSize: row.style?.size ?? DEFAULT_DRAWING_STYLE.size,
      label: row.label ?? undefined,
      attributes: row.attributes ?? {},
    },
    geometry: row.geojson,
  };
}

const MODE_BY_TOOL = {
  point: 'draw_point',
  line: 'draw_line_string',
  polygon: 'draw_polygon',
};

/**
 * useDrawings
 * ------------------------------------------------------------------
 * Herramientas de dibujo (Punto, Línea, Polígono), persistidas
 * automáticamente en Supabase y sincronizadas en vivo con Realtime.
 * Cada dibujo nuevo recibe un número secuencial legible (#1, #2...)
 * y, al terminar de dibujarlo, se pregunta una descripción opcional.
 *
 * Cada usuario ve y edita solo sus propios dibujos — RLS restringe
 * la visibilidad a nivel de base de datos (el admin del proyecto ve
 * y puede eliminar todos, para poder moderar).
 * ------------------------------------------------------------------
 */
export function useDrawings(projectId, canDraw, isAdmin, customFields = []) {
  const { map, isLoaded, isDrawingRef } = useMapContext();
  const { user } = useAuth();
  const [draw, setDraw] = useState(null);
  const [activeTool, setActiveTool] = useState(null);
  const [selected, setSelected] = useState(null);
  // { seqId, rowId, featureId } mientras el usuario llena los campos personalizados.
  const [pendingAttributes, setPendingAttributes] = useState(null);
  const hasFields = customFields.length > 0;

  const drawRef = useRef(null);
  const loadedRef = useRef(false);

  // Crea el control de Draw una sola vez, cuando el mapa está listo.
  useEffect(() => {
    if (!map || !isLoaded || drawRef.current) return;
    const drawInstance = new MapboxDraw({ displayControlsDefault: false, styles: DRAW_STYLES });
    map.addControl(drawInstance);
    drawRef.current = drawInstance;
    setDraw(drawInstance);
    // No se limpia con removeControl en el unmount: el mapa completo se
    // destruye junto con esta página, y forzar la limpieza de un control
    // sobre un mapa que ya se está destruyendo es la misma carrera que
    // tuvimos que resolver antes con el ScaleControl.
  }, [map, isLoaded]);

  /** Guarda en Supabase un feature recién creado y lo enlaza con su fila. Devuelve la fila creada (o null si falló). */
  const persistNewFeature = useCallback(
    async (drawFeatureId, geometry, geometryType) => {
      if (!user || !projectId || !drawRef.current) return null;
      try {
        const row = await createDrawing({
          projectId,
          userId: user.id,
          geometryType,
          geojson: geometry,
          style: DEFAULT_DRAWING_STYLE,
          label: null,
        });
        drawRef.current.setFeatureProperty(drawFeatureId, 'dbId', row.id);
        drawRef.current.setFeatureProperty(drawFeatureId, 'ownerId', row.user_id);
        drawRef.current.setFeatureProperty(drawFeatureId, 'seqId', row.seq_id);
        return row;
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[useDrawings] Error guardando dibujo:', err);
        drawRef.current.delete(drawFeatureId);
        return null;
      }
    },
    [user, projectId]
  );

  // draw.create / draw.update / draw.delete / draw.selectionchange
  useEffect(() => {
    if (!map || !draw) return undefined;

    const onCreate = async (e) => {
      const feature = e.features[0];
      map.getCanvas().style.cursor = '';
      setActiveTool(null);
      isDrawingRef.current = false;

      const row = await persistNewFeature(feature.id, feature.geometry, feature.geometry.type);
      if (!row) return;

      if (hasFields) {
        setPendingAttributes({ seqId: row.seq_id, rowId: row.id, featureId: feature.id });
        return;
      }

      const label = window.prompt(`Entidad #${row.seq_id} — descripción (opcional):`);
      if (label && label.trim()) {
        draw.setFeatureProperty(feature.id, 'label', label.trim());
        updateDrawing(row.id, { label: label.trim() }).catch((err) => {
          // eslint-disable-next-line no-console
          console.error('[useDrawings] Error guardando descripción:', err);
        });
      }
    };

    const onUpdate = (e) => {
      for (const feature of e.features) {
        const dbId = feature.properties.dbId;
        const ownerId = feature.properties.ownerId;
        if (!dbId) continue;
        if (user && ownerId && ownerId !== user.id) continue; // no es mío, no persisto
        updateDrawing(dbId, { geojson: feature.geometry }).catch((err) => {
          // eslint-disable-next-line no-console
          console.error('[useDrawings] Error actualizando dibujo:', err);
        });
      }
    };

    const onDelete = (e) => {
      for (const feature of e.features) {
        const dbId = feature.properties.dbId;
        if (!dbId) continue;
        deleteDrawing(dbId).catch((err) => {
          // eslint-disable-next-line no-console
          console.error('[useDrawings] Error eliminando dibujo:', err);
        });
      }
    };

    const onSelectionChange = (e) => {
      const feature = e.features[0] ?? null;
      const isOwn = feature && user && feature.properties.ownerId === user.id;
      if (feature && !isOwn && !isAdmin) {
        // No es mío y no soy admin: no se puede tocar, deselecciono.
        draw.changeMode('simple_select');
        setSelected(null);
        return;
      }
      setSelected(feature ? { ...feature, isOwn } : null);
    };

    map.on('draw.create', onCreate);
    map.on('draw.update', onUpdate);
    map.on('draw.delete', onDelete);
    map.on('draw.selectionchange', onSelectionChange);

    return () => {
      map.off('draw.create', onCreate);
      map.off('draw.update', onUpdate);
      map.off('draw.delete', onDelete);
      map.off('draw.selectionchange', onSelectionChange);
    };
  }, [map, draw, user, isAdmin, persistNewFeature, hasFields]);

  // Carga inicial: los dibujos que puedo ver (los míos, o todos si soy admin — RLS ya lo filtra).
  useEffect(() => {
    if (!isLoaded || !draw || !projectId || loadedRef.current) return;
    loadedRef.current = true;
    fetchProjectDrawings(projectId)
      .then((rows) => {
        draw.set({ type: 'FeatureCollection', features: rows.map(rowToFeature) });
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('[useDrawings] Error cargando dibujos:', err);
      });
  }, [isLoaded, draw, projectId]);

  // Realtime: dibujos creados/editados/borrados que RLS me deja ver
  // (mis propios dibujos, o todos si soy admin).
  useEffect(() => {
    if (!isLoaded || !draw || !projectId || !user) return undefined;

    const findByDbId = (dbId) => draw.getAll().features.find((f) => f.properties.dbId === dbId);

    const channel = supabase
      .channel(`drawings-${projectId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'drawings', filter: `project_id=eq.${projectId}` },
        (payload) => {
          if (payload.new.user_id === user.id) return; // ya lo tengo (lo dibujé yo)
          draw.add(rowToFeature(payload.new));
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'drawings', filter: `project_id=eq.${projectId}` },
        (payload) => {
          if (payload.new.user_id === user.id) return;
          const existing = findByDbId(payload.new.id);
          if (existing) draw.delete(existing.id);
          draw.add(rowToFeature(payload.new));
        }
      )
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'drawings' }, (payload) => {
        // Sin filtro: en un DELETE, Postgres no garantiza project_id en
        // `old` (mismo caso ya resuelto para `layers`). findByDbId no
        // hace nada si el dibujo no está cargado en este cliente.
        const existing = findByDbId(payload.old.id);
        if (existing) draw.delete(existing.id);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [isLoaded, draw, projectId, user]);

  const setTool = useCallback(
    (tool) => {
      if (!draw || !map) return;
      if (activeTool === tool) {
        setActiveTool(null);
        isDrawingRef.current = false;
        draw.changeMode('simple_select');
        map.getCanvas().style.cursor = '';
        return;
      }

      setActiveTool(tool);
      isDrawingRef.current = true;
      map.getCanvas().style.cursor = 'crosshair';
      draw.changeMode(MODE_BY_TOOL[tool] ?? 'simple_select');
    },
    [draw, map, activeTool, isDrawingRef]
  );

  const updateSelectedStyle = useCallback(
    (field, value) => {
      if (!draw || !selected) return;
      const propKey = field === 'color' ? 'drawColor' : 'drawSize';
      draw.setFeatureProperty(selected.id, propKey, value);

      const dbId = selected.properties.dbId;
      const nextStyle = {
        color: field === 'color' ? value : selected.properties.drawColor,
        size: field === 'size' ? value : selected.properties.drawSize,
      };
      if (dbId) {
        updateDrawing(dbId, { style: nextStyle }).catch((err) => {
          // eslint-disable-next-line no-console
          console.error('[useDrawings] Error guardando estilo:', err);
        });
      }
      setSelected((prev) => (prev ? { ...prev, properties: { ...prev.properties, [propKey]: value } } : prev));
    },
    [draw, selected]
  );

  const deleteSelected = useCallback(() => {
    if (!draw || !selected) return;
    draw.trash();
    setSelected(null);
  }, [draw, selected]);

  const duplicateSelected = useCallback(async () => {
    if (!draw || !selected || !user) return;
    const offsetGeometry = turf.transformTranslate(turf.feature(selected.geometry), 0.05, 45).geometry;
    const clone = {
      type: 'Feature',
      properties: {
        drawColor: selected.properties.drawColor,
        drawSize: selected.properties.drawSize,
      },
      geometry: offsetGeometry,
    };
    const [newId] = draw.add(clone);
    await persistNewFeature(newId, offsetGeometry, offsetGeometry.type);
  }, [draw, selected, user, persistNewFeature]);

  const submitAttributes = useCallback(
    (values) => {
      const pending = pendingAttributes;
      setPendingAttributes(null);
      if (!pending || !draw) return;
      draw.setFeatureProperty(pending.featureId, 'attributes', values);
      updateDrawing(pending.rowId, { attributes: values }).catch((err) => {
        // eslint-disable-next-line no-console
        console.error('[useDrawings] Error guardando atributos:', err);
      });
    },
    [pendingAttributes, draw]
  );

  const skipAttributes = useCallback(() => setPendingAttributes(null), []);

  return {
    pendingAttributes,
    submitAttributes,
    skipAttributes,
    canDraw: Boolean(canDraw && user),
    activeTool,
    setTool,
    selected,
    updateSelectedStyle,
    deleteSelected,
    duplicateSelected,
  };
}
