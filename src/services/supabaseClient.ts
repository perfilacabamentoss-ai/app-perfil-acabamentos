import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kgihpgfzazhgnwpokqas.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_rvQwLMvyjsLgzD1Nvgz9Xw_bXWxa_1T';

// Validação básica para a chave do Supabase
if (!supabaseAnonKey || supabaseAnonKey === 'sb_publishable_rvQwLMvyjsLgzD1Nvgz9Xw_bXWxa_1T') {
  console.warn('AVISO: Você está usando uma chave de exemplo ou incompleta. Para sincronização real, obtenha a "anon public" key no Dashboard do Supabase (Settings > API).');
}

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.info('Usando configurações de conexão padrão.');
}

export const isSupabaseConfigured = supabaseAnonKey && !supabaseAnonKey.startsWith('sb_');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: { 'x-application-name': 'perfil-gestao-obras' },
  },
});
