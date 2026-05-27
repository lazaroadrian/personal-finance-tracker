import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured } from '../config/supabase.config';

let _client = null;

export const getSupabase = () => {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase no está configurado. Pega la SUPABASE_ANON_KEY en src/config/supabase.config.js'
    );
  }
  if (!_client) {
    _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }
  return _client;
};

export { isSupabaseConfigured };
