import { useEffect, useState } from 'react';
import { useMapContext } from '../../hooks/MapContext.jsx';
import { UI_OPTIONS } from '../../config/appConfig.js';

/**
 * CoordinateDisplay
 * ------------------------------------------------------------------
 * Muestra la coordenada geográfica bajo el cursor, estilo lectura de
 * instrumento. Se actualiza en cada 'mousemove' del mapa.
 * ------------------------------------------------------------------
 */
export default function CoordinateDisplay() {
  const { map } = useMapContext();
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    if (!map) return;
    const onMove = (e) => setCoords(e.lngLat);
    map.on('mousemove', onMove);
    return () => {
      try {
        map.off('mousemove', onMove);
      } catch {
        // mapa ya destruido, no hay nada que limpiar
      }
    };
  }, [map]);

  if (!map || !UI_OPTIONS.controls.showCoordinates) return null;

  return (
    <div className="absolute bottom-3 right-3 z-20 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)]/90 px-2.5 py-1 font-[var(--font-mono)] text-[11px] text-[var(--color-text-muted)] backdrop-blur-sm">
      {coords
        ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`
        : 'mueve el cursor sobre el mapa'}
    </div>
  );
}
