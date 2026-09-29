import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { fetchUserProjects, createProject } from '../services/projectService.js';
import { APP_BRANDING } from '../config/mapConfig.js';

const ROLE_LABELS = { admin: 'Administrador', editor: 'Editor', viewer: 'Solo lectura' };

/**
 * ProjectsPage
 * ------------------------------------------------------------------
 * Lista los proyectos a los que el usuario tiene acceso, y permite
 * crear uno nuevo. Crear un proyecto te vuelve admin de él
 * automáticamente (ver función `create_project` en Supabase).
 * ------------------------------------------------------------------
 */
export default function ProjectsPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    fetchUserProjects(user.id)
      .then(setProjects)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [authLoading, user]);

  const handleNameChange = (value) => {
    setName(value);
    if (!slugTouched) {
      setSlug(
        value
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // quita acentos
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
      );
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(null);
    setCreating(true);
    try {
      const project = await createProject(name.trim(), slug.trim());
      navigate(`/project/${project.slug}`);
    } catch (err) {
      setError(
        err.message?.includes('duplicate')
          ? 'Ese identificador de URL ya está en uso — prueba con otro.'
          : err.message
      );
    } finally {
      setCreating(false);
    }
  };

  if (authLoading || loading) return null;

  if (!user) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-[var(--color-bg)] px-4 text-center">
        <p className="text-sm text-[var(--color-text-muted)]">
          Inicia sesión para ver o crear proyectos.
        </p>
        <Link to="/login" className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-[var(--color-bg)]">
          Iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen bg-[var(--color-bg)] px-4 py-10">
      <div className="mx-auto max-w-lg">
        <div className="mb-8 flex items-center justify-between">
          <span className="font-[var(--font-display)] text-lg font-semibold text-[var(--color-text)]">
            {APP_BRANDING.name}
          </span>
          <Link to="/" className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
            ← Volver al visor
          </Link>
        </div>

        <h1 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
          Tus proyectos
        </h1>

        {projects.length === 0 ? (
          <p className="mb-6 text-sm text-[var(--color-text-muted)]">
            Todavía no tienes acceso a ningún proyecto.
          </p>
        ) : (
          <ul className="mb-8 flex flex-col gap-2">
            {projects.map((project) => (
              <li key={project.id}>
                <Link
                  to={`/project/${project.slug}`}
                  className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 hover:border-[var(--color-accent-dim)]"
                >
                  <span className="text-sm text-[var(--color-text)]">{project.name}</span>
                  <span className="rounded bg-[var(--color-surface-alt)] px-2 py-0.5 text-[10px] uppercase text-[var(--color-text-muted)]">
                    {ROLE_LABELS[project.role] ?? project.role}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
          Crear un nuevo proyecto
        </h2>
        <form
          onSubmit={handleCreate}
          className="flex flex-col gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
        >
          <label className="text-xs text-[var(--color-text-muted)]">
            Nombre
            <input
              type="text"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Ej. Zonificación Municipio X"
              className="mt-1 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
            />
          </label>
          <label className="text-xs text-[var(--color-text-muted)]">
            Identificador de URL
            <input
              type="text"
              required
              pattern="[a-z0-9-]+"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              placeholder="zonificacion-municipio-x"
              className="mt-1 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
            />
            <span className="mt-1 block font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)]">
              tusitio.netlify.app/project/{slug || '…'}
            </span>
          </label>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={creating}
            className="mt-1 rounded-md bg-[var(--color-accent)] py-2 text-sm font-semibold text-[var(--color-bg)] disabled:opacity-60"
          >
            {creating ? 'Creando…' : 'Crear proyecto'}
          </button>
        </form>
      </div>
    </div>
  );
}
