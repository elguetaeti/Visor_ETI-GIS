import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth.jsx';
import ViewerPage from './pages/ViewerPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import InvitePage from './pages/InvitePage.jsx';
import ProjectsPage from './pages/ProjectsPage.jsx';

/**
 * App.jsx
 * ------------------------------------------------------------------
 * Definición de rutas de alto nivel. La app soporta múltiples
 * proyectos (/project/:projectId); la raíz "/" muestra el proyecto
 * por defecto para permitir un enlace simple mientras no existan
 * proyectos guardados en Supabase.
 * ------------------------------------------------------------------
 */
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ViewerPage />} />
          <Route path="/project/:projectSlug" element={<ViewerPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/invite/:token" element={<InvitePage />} />
          <Route path="/projects" element={<ProjectsPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
