import { createContext, useContext, useRef, useState } from 'react';

/**
 * MapContext
 * ------------------------------------------------------------------
 * Comparte la instancia de MapLibre (una sola por app) entre todos
 * los componentes que necesitan leerla o modificarla: panel de
 * capas, controles flotantes, buscador, herramientas de dibujo, etc.
 * Evita "prop drilling" del objeto `map` a través de muchos niveles.
 *
 * `isDrawingRef` es un valor compartido aparte del estado de React:
 * mientras hay una herramienta de dibujo activa (useDrawings lo
 * marca en true), las capas de datos (useLayers) lo consultan antes
 * de abrir su popup de atributos al hacer clic — así un clic para
 * colocar un punto/vértice no compite con el popup de la capa que
 * está debajo. Es un ref (no estado) porque no necesita causar
 * un re-render, solo leerse en el momento exacto del clic.
 * ------------------------------------------------------------------
 */
const MapContext = createContext(null);

export function MapProvider({ children }) {
  const [map, setMap] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const isDrawingRef = useRef(false);

  return (
    <MapContext.Provider value={{ map, setMap, isLoaded, setIsLoaded, isDrawingRef }}>
      {children}
    </MapContext.Provider>
  );
}

/** Hook de acceso. Lanza error si se usa fuera de <MapProvider>. */
export function useMapContext() {
  const ctx = useContext(MapContext);
  if (!ctx) {
    throw new Error('useMapContext debe usarse dentro de <MapProvider>');
  }
  return ctx;
}
