import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase/client.js';
import * as authService from '../services/authService.js';

/**
 * useAuth / AuthProvider
 * ------------------------------------------------------------------
 * Fuente única de verdad de la sesión de Supabase Auth para toda la
 * app. Se suscribe a onAuthStateChange una sola vez (en el Provider,
 * montado en App.jsx) y expone el usuario actual + acciones de
 * login/logout a cualquier componente vía contexto.
 * ------------------------------------------------------------------
 */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authService.getSession().then((session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    signIn: authService.signIn,
    signUp: authService.signUp,
    signOut: authService.signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
