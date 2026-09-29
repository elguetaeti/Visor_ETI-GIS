import { useEffect, useState } from 'react';
import { fetchProjectBySlug } from '../services/projectService.js';

/**
 * useProject
 * ------------------------------------------------------------------
 * Resuelve el proyecto actual a partir de su slug (viene de la URL,
 * o 'default' cuando se visita la raíz "/"). Expone loading/error
 * para que ViewerPage pueda mostrar un estado claro mientras carga
 * o si el slug no existe.
 * ------------------------------------------------------------------
 */
export function useProject(slug) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchProjectBySlug(slug)
      .then((data) => {
        if (!cancelled) setProject(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { project, loading, error };
}
