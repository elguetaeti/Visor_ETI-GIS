import { useEffect, useState } from 'react';
import { useAuth } from './useAuth.jsx';
import { fetchUserRole } from '../services/projectService.js';
import { ROLES } from '../config/appConfig.js';

/**
 * usePermissions
 * ------------------------------------------------------------------
 * Dado el proyecto actual, resuelve el rol del usuario autenticado
 * (admin / editor / viewer / ninguno) consultando la tabla
 * `permissions`. Se recalcula cuando cambia el usuario o el proyecto.
 * ------------------------------------------------------------------
 */
export function usePermissions(projectId) {
  const { user } = useAuth();
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    if (!user || !projectId) {
      setRole(null);
      setLoading(false);
      return;
    }

    fetchUserRole(projectId, user.id)
      .then((r) => {
        if (!cancelled) setRole(r);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, projectId]);

  return {
    role,
    loading,
    isAdmin: role === ROLES.ADMIN,
    isEditor: role === ROLES.ADMIN || role === ROLES.EDITOR,
  };
}
