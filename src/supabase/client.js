/**
 * client.js
 * ------------------------------------------------------------------
 * Instancia única del cliente de Supabase. Ningún otro archivo debe
 * llamar a `createClient` — todos importan esta instancia. Esto
 * garantiza una sola conexión y una sola sesión de auth en memoria.
 * ------------------------------------------------------------------
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    '[supabase] Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. ' +
      'Copia .env.example a .env y completa tus credenciales de Supabase.'
  );
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '');
