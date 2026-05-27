import { Platform } from 'react-native';
import { getSupabase } from './SupabaseClient';
import DatabaseService from './DatabaseService';

const SyncService = {
  // Sube el snapshot local del usuario actual a Supabase
  async pushBackup() {
    const supabase = getSupabase();
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr) throw userErr;
    const user = userData?.user;
    if (!user) throw new Error('No hay sesión iniciada');

    const payload = await DatabaseService.exportData();
    const deviceId = `${Platform.OS}-${Platform.Version || ''}`;

    const { error } = await supabase
      .from('gestor_de_cuentas')
      .upsert(
        {
          user_id: user.id,
          payload_json: payload,
          device_id: deviceId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );
    if (error) throw error;

    return {
      user_email: user.email,
      updated_at: new Date().toISOString(),
      counts: {
        debtors: payload.debtors?.length || 0,
        movements: payload.movements?.length || 0,
        jar_groups: payload.jar_groups?.length || 0,
        jars: payload.jars?.length || 0,
        jar_movements: payload.jar_movements?.length || 0,
      },
    };
  },

  // Descarga el snapshot del usuario actual y reemplaza la DB local
  async pullBackup() {
    const supabase = getSupabase();
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr) throw userErr;
    const user = userData?.user;
    if (!user) throw new Error('No hay sesión iniciada');

    const { data, error } = await supabase
      .from('gestor_de_cuentas')
      .select('payload_json, updated_at, device_id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('No hay respaldo en la nube para este usuario');

    const payload =
      typeof data.payload_json === 'string'
        ? JSON.parse(data.payload_json)
        : data.payload_json;

    await DatabaseService.importData(payload);

    return {
      user_email: user.email,
      updated_at: data.updated_at,
      device_id: data.device_id,
    };
  },

  // Devuelve metadata del último respaldo (sin descargarlo)
  async getRemoteInfo() {
    const supabase = getSupabase();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return null;
    const { data, error } = await supabase
      .from('gestor_de_cuentas')
      .select('updated_at, device_id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (error || !data) return null;
    return data;
  },
};

export default SyncService;
