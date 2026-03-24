import { supabase } from '../lib/supabase';

export const supabaseService = {
  async isConfigured() {
    const url = import.meta.env.VITE_SUPABASE_URL || 'https://yvjdjjrioclxxnorwlou.supabase.co';
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_q0WiULB2x-AH-UUoxHaLvw_I0-GGaRO';
    return !!(url && key && url !== 'https://placeholder-url.supabase.co');
  },

  async saveData(data: Record<string, any>) {
    if (!(await this.isConfigured())) return null;

    try {
      // We'll store data in a 'system_data' table with key-value pairs
      // The table should have columns: key (text, primary key), value (jsonb), updated_at (timestamp)
      
      const entries = Object.entries(data).map(([key, value]) => {
        let parsedValue = value;
        if (typeof value === 'string') {
          try {
            parsedValue = JSON.parse(value);
          } catch (e) {
            // If it's not a valid JSON string (e.g. a plain string like "configuracoes"), 
            // keep it as a raw string. Supabase will handle it as a JSON string.
            parsedValue = value;
          }
        }
        return {
          key,
          value: parsedValue,
          updated_at: new Date().toISOString()
        };
      });

      const { data: result, error } = await supabase
        .from('system_data')
        .upsert(entries, { onConflict: 'key' });

      if (error) throw error;
      return { success: true, lastUpdated: Date.now() };
    } catch (error) {
      console.error('Supabase save error:', error);
      return null;
    }
  },

  async fetchData() {
    if (!(await this.isConfigured())) return null;

    try {
      const { data, error } = await supabase
        .from('system_data')
        .select('*');

      if (error) throw error;

      const formattedData: Record<string, string> = {};
      data.forEach((item: any) => {
        formattedData[item.key] = JSON.stringify(item.value);
      });

      return { data: formattedData, lastUpdated: Date.now() };
    } catch (error) {
      console.error('Supabase fetch error:', error);
      return null;
    }
  },

  async fetchLastUpdated() {
    if (!(await this.isConfigured())) return 0;

    try {
      const { data, error } = await supabase
        .from('system_data')
        .select('updated_at')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      if (data && data.length > 0) {
        return new Date(data[0].updated_at).getTime();
      }
      return 0;
    } catch (error) {
      // Silent error for background check to avoid UI noise
      return 0;
    }
  }
};
