import { useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { useMapContext } from '../../hooks/MapContext.jsx';
import { MAP_VIEW } from '../../config/mapConfig.js';
import { UI_OPTIONS } from '../../config/appConfig.js';
import IconButton from '../ui/IconButton.jsx';
import { IconZoomIn, IconZoomOut, IconHome, IconExpand, IconLocate } from '../ui/icons.jsx';

/**
 * MapControls
 * ------------------------------------------------------------------
 * Botones flotantes de navegación (zoom, home, pantalla completa,
 * localizar usuario) con estilo propio, más la escala gráfica nativa
 * de MapLibre (recoloreada vía CSS en styles/index.css).
 *
 * Cada control respeta el flag correspondiente en UI_OPTIONS para
 * poder activarse/desactivarse desde configuración sin tocar este
 * componente.
 * ------------------------------------------------------------------
 */
export default function MapControls() {
  const { map } = useMapContext();
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Escala gráfica: control nativo de MapLibre, añadido una sola vez.
  useEffect(() => {
    if (!map || !UI_OPTIONS.controls.showScale) return;
    const scale = new maplibregl.ScaleControl({ maxWidth: 120, unit: 'metric' });
    map.addControl(scale, 'bottom-left');
    return () => {
      // Al navegar fuera de la página, MapContainer puede destruir el mapa
      // (map.remove()) antes de que corra esta limpieza — intentar
      // desconectar el control de un mapa ya destruido lanza una excepción
      // que tumbaba toda la página. Como el mapa completo va a
      // desaparecer de todos modos, ignorarla es seguro.
      try {
        map.removeControl(scale);
      } catch {
        // mapa ya destruido, no hay nada que limpiar
      }
    };
  }, [map]);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  if (!map) return null;

  const handleZoom = (delta) => map.zoomTo(map.getZoom() + delta, { duration: 200 });

  const handleHome = () =>
    map.easeTo({
      center: MAP_VIEW.center,
      zoom: MAP_VIEW.zoom,
      pitch: MAP_VIEW.pitch,
      bearing: MAP_VIEW.bearing,
      duration: 600,
    });

  const handleFullscreen = () => {
    const el = map.getContainer().closest('[data-viewer-root]') ?? document.documentElement;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      el.requestFullscreen?.();
    }
  };

  const handleLocate = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      map.flyTo({
        center: [pos.coords.longitude, pos.coords.latitude],
        zoom: 14,
        duration: 800,
      });
    });
  };

  return (
    <div className="absolute right-3 top-16 z-20 flex flex-col gap-1.5">
      {UI_OPTIONS.controls.showZoom && (
        <div className="flex flex-col overflow-hidden rounded-lg border border-[var(--color-border)]">
          <IconButton icon={<IconZoomIn />} label="Acercar" onClick={() => handleZoom(1)} />
          <div className="h-px bg-[var(--color-border)]" />
          <IconButton icon={<IconZoomOut />} label="Alejar" onClick={() => handleZoom(-1)} />
        </div>
      )}
      {UI_OPTIONS.controls.showHome && (
        <IconButton icon={<IconHome />} label="Vista inicial" onClick={handleHome} />
      )}
      {UI_OPTIONS.controls.showFullscreen && (
        <IconButton
          icon={<IconExpand />}
          label="Pantalla completa"
          active={isFullscreen}
          onClick={handleFullscreen}
        />
      )}
      {UI_OPTIONS.controls.showGeolocate && (
        <IconButton icon={<IconLocate />} label="Mi ubicación" onClick={handleLocate} />
      )}
    </div>
  );
}
