/**
 * icons.jsx
 * ------------------------------------------------------------------
 * Set mínimo de iconos SVG inline. Se evita una librería de iconos
 * externa (p. ej. lucide-react) para no añadir una dependencia que
 * el stack acordado no contempla; a este tamaño, unos SVG a mano
 * son más ligeros y suficientes.
 * ------------------------------------------------------------------
 */
const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  viewBox: '0 0 24 24',
  width: 18,
  height: 18,
};

export const IconLayers = (p) => (
  <svg {...base} {...p}><path d="M12 3 2 8l10 5 10-5-10-5Z" /><path d="M2 13l10 5 10-5" /></svg>
);
export const IconChevronLeft = (p) => (
  <svg {...base} {...p}><path d="M15 18l-6-6 6-6" /></svg>
);
export const IconChevronRight = (p) => (
  <svg {...base} {...p}><path d="M9 18l6-6-6-6" /></svg>
);
export const IconEye = (p) => (
  <svg {...base} {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
);
export const IconEyeOff = (p) => (
  <svg {...base} {...p}><path d="M3 3l18 18" /><path d="M10.6 5.1A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a13.2 13.2 0 0 1-2.4 3.2M6.6 6.6C4 8.3 2 12 2 12s3.5 7 10 7a10 10 0 0 0 4.4-1" /></svg>
);
export const IconZoomIn = (p) => (
  <svg {...base} {...p}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3M11 8v6M8 11h6" /></svg>
);
export const IconZoomOut = (p) => (
  <svg {...base} {...p}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3M8 11h6" /></svg>
);
export const IconHome = (p) => (
  <svg {...base} {...p}><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></svg>
);
export const IconExpand = (p) => (
  <svg {...base} {...p}><path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5" /></svg>
);
export const IconLocate = (p) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></svg>
);
export const IconInfo = (p) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 8h.01M11 12h1v4h1" /></svg>
);
export const IconMap = (p) => (
  <svg {...base} {...p}><path d="M9 3 3 5v16l6-2 6 2 6-2V3l-6 2-6-2Z" /><path d="M9 3v16M15 5v16" /></svg>
);
