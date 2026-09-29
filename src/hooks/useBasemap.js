import { useCallback, useEffect, useState } from 'react';
import { useMapContext } from './MapContext.jsx';
import { BASEMAPS } from '../config/mapConfig.js';

const sourceId = (basemapId) => `basemap-${basemapId}-source`;
const layerId = (basemapId) => `basemap-${basemapId}-layer`;

/**
 * useBasemap
 * ------------------------------------------------------------------
 * Gestiona los mapas base raster (OSM / Esri World Imagery). Aplica
 * la regla de negocio "nunca dos basemaps activos a la vez": cada
 * vez que se activa uno, se elimina cualquier otro layer/source de
 * basemap antes de añadir el nuevo. Los basemaps siempre se insertan
 * como la capa más al fondo (`beforeId` = primera capa existente),
 * para que las capas de datos queden siempre por encima.
 * ------------------------------------------------------------------
 */
export function useBasemap() {
  const { map, isLoaded } = useMapContext();
  const [activeBasemapId, setActiveBasemapId] = useState(
    BASEMAPS.find((b) => b.default)?.id ?? BASEMAPS[0].id
  );

  const applyBasemap = useCallback(
    (basemapId) => {
      if (!map) return;

      // Elimina cualquier basemap previamente añadido (garantiza exclusividad).
      BASEMAPS.forEach((b) => {
        if (map.getLayer(layerId(b.id))) map.removeLayer(layerId(b.id));
        if (map.getSource(sourceId(b.id))) map.removeSource(sourceId(b.id));
      });

      const basemap = BASEMAPS.find((b) => b.id === basemapId);
      if (!basemap) return;

      map.addSource(sourceId(basemap.id), {
        type: 'raster',
        tiles: basemap.tiles,
        tileSize: basemap.tileSize,
        attribution: basemap.attribution,
        ...(basemap.maxzoom ? { maxzoom: basemap.maxzoom } : {}),
      });

      // Inserta el basemap debajo de todo lo demás (primera capa actual, si existe).
      const firstLayerId = map.getStyle().layers?.[0]?.id;
      map.addLayer(
        {
          id: layerId(basemap.id),
          type: 'raster',
          source: sourceId(basemap.id),
        },
        firstLayerId
      );
    },
    [map]
  );

  useEffect(() => {
    if (isLoaded) applyBasemap(activeBasemapId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, activeBasemapId, applyBasemap]);

  return { basemaps: BASEMAPS, activeBasemapId, setActiveBasemapId };
}