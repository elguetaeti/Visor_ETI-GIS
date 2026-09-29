/**
 * appConfig.js
 * ------------------------------------------------------------------
 * Opciones globales de interfaz que no son estrictamente del mapa.
 * Separado de mapConfig.js para que cada archivo tenga una única
 * responsabilidad (config de mapa vs config de UI/app).
 * ------------------------------------------------------------------
 */

export const UI_OPTIONS = {
  layerPanel: {
    defaultCollapsed: false,
    position: 'left', // 'left' | 'right'
  },
  controls: {
    showZoom: true,
    showHome: true,
    showFullscreen: true,
    showGeolocate: true,
    showScale: true,
    showCoordinates: true,
    showSearch: true,
    showMeasureDistance: true,
    showMeasureArea: true,
  },
  drawing: {
    enabledTools: ['point', 'line', 'polygon', 'circle', 'text'],
  },
};

export const ROLES = {
  ADMIN: 'admin',
  EDITOR: 'editor',
  VIEWER: 'viewer',
};
