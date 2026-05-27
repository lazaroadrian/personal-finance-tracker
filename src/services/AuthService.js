import { getSupabase } from './SupabaseClient';

const AuthService = {
  async signUp(email, password, nombre) {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { nombre: nombre || '' } },
    });
    if (error) throw error;

    // Crear/actualizar perfil si hay usuario inmediato (sin confirmación de email)
    if (data?.user?.id) {
      await supabase
        .from('finanza_perfil')
        .upsert({ id: data.user.id, nombre: nombre || email }, { onConflict: 'id' });
    }
    return data;
  },

  async signIn(email, password) {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) throw error;

    // Asegurar fila de perfil
    if (data?.user?.id) {
      await supabase
        .from('finanza_perfil')
        .upsert(
          { id: data.user.id, nombre: data.user.user_metadata?.nombre || data.user.email },
          { onConflict: 'id' }
        );
    }
    return data;
  },

  async signOut() {
    const supabase = getSupabase();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getSession() {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  async getCurrentUser() {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.getUser();
    if (error) return null;
    return data?.user || null;
  },

  onAuthStateChange(cb) {
    const supabase = getSupabase();
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => cb(event, session));
    return () => sub?.subscription?.unsubscribe?.();
  },
};

export default AuthService;
