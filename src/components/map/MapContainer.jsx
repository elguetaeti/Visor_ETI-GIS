import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { useMapContext } from '../../hooks/MapContext.jsx';
import { MAP_VIEW } from '../../config/mapConfig.js';

/**
 * MapContainer
 * ------------------------------------------------------------------
 * Único punto de montaje del mapa MapLibre. Crea la instancia una
 * sola vez (StrictMode-safe mediante el guard `mapRef.current`),
 * la publica en MapContext y la destruye al desmontar.
 *
 * Se instancia con un `style` vacío (sin sources/layers) porque los
 * mapas base y las capas los añaden hooks especializados
 * (useBasemap, useLayers) una vez el mapa emite 'load'. Así este
 * componente no necesita saber nada sobre basemaps ni capas.
 * ------------------------------------------------------------------
 */
export default function MapContainer() {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const { setMap, setIsLoaded } = useMapContext();

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {},
        layers: [],
        glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
      },
      center: MAP_VIEW.center,
      zoom: MAP_VIEW.zoom,
      minZoom: MAP_VIEW.minZoom,
      maxZoom: MAP_VIEW.maxZoom,
      pitch: MAP_VIEW.pitch,
      bearing: MAP_VIEW.bearing,
      attributionControl: { compact: true },
    });

    mapRef.current = map;

    map.on('load', () => {
      setIsLoaded(true);
    });

    setMap(map);

    return () => {
      map.remove();
      mapRef.current = null;
      setMap(null);
      setIsLoaded(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ position: 'absolute', inset: 0 }}
      aria-label="Mapa"
    />
  );
}
