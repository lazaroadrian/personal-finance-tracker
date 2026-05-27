// Configuración del cliente Supabase para la app de Gestión de Deudas / Gestor de Cuentas.
//
// 1) SUPABASE_URL ya está rellena con el proyecto del usuario (widyjhucekesbtwynhdm).
// 2) SUPABASE_ANON_KEY debe pegarse desde:
//      Supabase Dashboard → Project Settings → API → "Project API keys" → "anon / public".
//    Es una clave PÚBLICA (segura para clientes) pero es DISTINTA a la contraseña de la base
//    de datos. Sin ella, los servicios de Auth y de sincronización no funcionarán.
//
// Cuando la peguen, simplemente reemplazan el valor de SUPABASE_ANON_KEY.

export const SUPABASE_URL = 'https://widyjhucekesbtwynhdm.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpZHlqaHVjZWtlc2J0d3luaGRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3OTQ3NzksImV4cCI6MjA4NDM3MDc3OX0.DAYhNgfUwzORXmwtYFzOqb93VfquLVeb03kZXkZngkg';

export const isSupabaseConfigured = () =>
  typeof SUPABASE_ANON_KEY === 'string' && SUPABASE_ANON_KEY.trim().length > 20;
