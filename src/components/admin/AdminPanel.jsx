import { useState } from 'react';
import LayerUploader from './LayerUploader.jsx';
import LayerManager from './LayerManager.jsx';
import ShareLinks from './ShareLinks.jsx';
import UserManager from './UserManager.jsx';

/**
 * AdminPanel
 * ------------------------------------------------------------------
 * Modal con las secciones de administración: capas existentes,
 * subir capa nueva, y compartir por enlace con rol (esta última solo
 * para administradores — generar invitaciones de rol es una acción
 * de administración, no de edición de contenido).
 * ------------------------------------------------------------------
 */
export default function AdminPanel({ project, layers, isAdmin, onClose }) {
  const [tab, setTab] = useState('manage');

  const tabs = [
    { id: 'manage', label: 'Capas del proyecto' },
    { id: 'upload', label: 'Subir nueva' },
    ...(isAdmin ? [{ id: 'share', label: 'Compartir' }] : []),
    ...(isAdmin ? [{ id: 'users', label: 'Usuarios' }] : []),
  ];

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
          <span className="text-sm font-semibold text-[var(--color-text)]">
            Administrar proyecto
          </span>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          >
            ✕
          </button>
        </div>

        <div className="flex gap-1 border-b border-[var(--color-border)] px-4 pt-3 text-xs">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-t-md px-3 py-1.5 font-medium ${
                tab === t.id
                  ? 'bg-[var(--color-surface-alt)] text-[var(--color-text)]'
                  : 'text-[var(--color-text-muted)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'manage' && <LayerManager layers={layers} project={project} />}
        {tab === 'upload' && (
          <LayerUploader projectId={project.id} onUploaded={() => setTab('manage')} />
        )}
        {tab === 'share' && isAdmin && <ShareLinks projectId={project.id} />}
        {tab === 'users' && isAdmin && <UserManager projectId={project.id} />}
      </div>
    </div>
  );
}
