import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { MapProvider } from '../hooks/MapContext.jsx';
import { useBasemap } from '../hooks/useBasemap.js';
import { useLayers } from '../hooks/useLayers.js';
import { useProject } from '../hooks/useProject.js';
import { usePermissions } from '../hooks/usePermissions.js';
import { useDrawings } from '../hooks/useDrawings.js';
import MapContainer from '../components/map/MapContainer.jsx';
import MapControls from '../components/map/MapControls.jsx';
import CoordinateDisplay from '../components/map/CoordinateDisplay.jsx';
import DrawingToolbar from '../components/map/DrawingToolbar.jsx';
import DrawingAttributesModal from '../components/map/DrawingAttributesModal.jsx';
import DrawingPropertiesPanel from '../components/map/DrawingPropertiesPanel.jsx';
import TopBar from '../components/layout/TopBar.jsx';
import LayerPanel from '../components/layers/LayerPanel.jsx';
import AdminPanel from '../components/admin/AdminPanel.jsx';

/**
 * ViewerPage
 * ------------------------------------------------------------------
 * Página principal del visor. Resuelve primero el proyecto (por
 * slug de la URL, o 'default' en la raíz "/"), y solo entonces monta
 * el mapa — así useLayers ya sabe a qué proyecto pedirle sus capas
 * de Supabase en la próxima etapa.
 * ------------------------------------------------------------------
 */
export default function ViewerPage() {
  const { projectSlug } = useParams();
  const slug = projectSlug ?? 'default';
  const { project, loading, error } = useProject(slug);

  if (loading) {
    return <FullScreenMessage text="Cargando proyecto…" />;
  }

  if (error || !project) {
    return (
      <FullScreenMessage
        text={`No se encontró el proyecto "${slug}". Verifica el enlace o vuelve al inicio.`}
      />
    );
  }

  return (
    <MapProvider>
      <ViewerContent project={project} />
    </MapProvider>
  );
}

function ViewerContent({ project }) {
  const basemap = useBasemap();
  const layers = useLayers(project.id, project.config);
  const permissions = usePermissions(project.id);
  const [customFields, setCustomFields] = useState(project.config?.customFields ?? []);
  const drawings = useDrawings(project.id, Boolean(permissions.role), permissions.isAdmin, customFields);
  const [showAdmin, setShowAdmin] = useState(false);

  return (
    <div data-viewer-root className="relative h-screen w-screen overflow-hidden">
      <MapContainer />
      <TopBar project={project} permissions={permissions} onOpenAdmin={() => setShowAdmin(true)} />
      <LayerPanel basemap={basemap} layers={layers} />
      <MapControls />
      <CoordinateDisplay />
      {drawings.canDraw && (
        <>
          <DrawingToolbar activeTool={drawings.activeTool} onSelectTool={drawings.setTool} />
          <DrawingPropertiesPanel
            selected={drawings.selected}
            customFields={customFields}
            onStyleChange={drawings.updateSelectedStyle}
            onDuplicate={drawings.duplicateSelected}
            onDelete={drawings.deleteSelected}
          />
        </>
      )}
      {drawings.pendingAttributes && (
        <DrawingAttributesModal
          seqId={drawings.pendingAttributes.seqId}
          fields={customFields}
          onSubmit={drawings.submitAttributes}
          onSkip={drawings.skipAttributes}
        />
      )}
      {showAdmin && (
        <AdminPanel
          project={project}
          layers={layers.layers}
          isAdmin={permissions.isAdmin}
          customFields={customFields}
          onFieldsChange={setCustomFields}
          onClose={() => setShowAdmin(false)}
        />
      )}
    </div>
  );
}

function FullScreenMessage({ text }) {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[var(--color-bg)] px-4 text-center text-sm text-[var(--color-text-muted)]">
      {text}
    </div>
  );
}
