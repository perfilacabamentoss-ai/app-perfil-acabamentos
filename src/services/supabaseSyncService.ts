import { supabase, isSupabaseConfigured } from './supabaseClient';

export const supabaseSyncService = {
  async fetchData(retries = 3) {
    if (!isSupabaseConfigured) {
      return { data: {}, lastUpdated: 0 };
    }
    for (let i = 0; i < retries; i++) {
      try {
        const { data, error } = await supabase
          .from('system_data')
          .select('payload, updated_at')
          .eq('id', 'global_state')
          .single();

        if (error) {
          if (error.code === 'PGRST116') return { data: {}, lastUpdated: 0 };
          // Se a tabela não existir, não tentamos mais
          if (error.code === '42P01') return { data: {}, lastUpdated: 0 };
          throw error;
        }

        return {
          data: data.payload,
          lastUpdated: new Date(data.updated_at).getTime()
        };
      } catch (error: any) {
        if (i === retries - 1) return null;
        await new Promise(res => setTimeout(res, 1000 * (i + 1)));
      }
    }
    return null;
  },

  async fetchLastUpdated() {
    try {
      const { data, error } = await supabase
        .from('system_data')
        .select('updated_at')
        .eq('id', 'global_state')
        .single();

      if (error) return 0;
      return new Date(data.updated_at).getTime();
    } catch (error) {
      return 0;
    }
  },

  async saveData(payload: any, retries = 3) {
    if (!isSupabaseConfigured) {
      return null;
    }
    for (let i = 0; i < retries; i++) {
      try {
        const { data, error } = await supabase
          .from('system_data')
          .upsert({
            id: 'global_state',
            payload: payload,
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        
        return {
          success: true,
          lastUpdated: new Date(data.updated_at).getTime()
        };
      } catch (error: any) {
        if (i === retries - 1) return null;
        await new Promise(res => setTimeout(res, 1000 * (i + 1)));
      }
    }
    return null;
  }
};
