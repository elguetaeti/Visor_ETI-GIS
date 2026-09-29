import IconButton from '../ui/IconButton.jsx';

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

const IconPoint = (p) => <svg {...base} {...p}><circle cx="12" cy="12" r="3" fill="currentColor" /></svg>;
const IconLine = (p) => <svg {...base} {...p}><path d="M4 18 20 6" /></svg>;
const IconPolygon = (p) => <svg {...base} {...p}><path d="M12 3 21 9l-3 10H6L3 9Z" /></svg>;

const TOOLS = [
  { id: 'point', label: 'Punto', icon: IconPoint },
  { id: 'line', label: 'Línea', icon: IconLine },
  { id: 'polygon', label: 'Polígono', icon: IconPolygon },
];

/**
 * DrawingToolbar
 * ------------------------------------------------------------------
 * Barra flotante con las 5 herramientas de dibujo. Solo se muestra
 * si el usuario tiene algún rol asignado en el proyecto (ver
 * `canDraw` en useDrawings) — sin rol, ni siquiera se ofrece la
 * opción, ya que RLS la rechazaría de todos modos.
 * ------------------------------------------------------------------
 */
export default function DrawingToolbar({ activeTool, onSelectTool }) {
  return (
    <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]/95 p-1.5 backdrop-blur-sm">
      {TOOLS.map((tool) => (
        <IconButton
          key={tool.id}
          icon={<tool.icon />}
          label={tool.label}
          active={activeTool === tool.id}
          onClick={() => onSelectTool(tool.id)}
        />
      ))}
    </div>
  );
}
