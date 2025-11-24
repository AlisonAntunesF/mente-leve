import { createClient } from '@supabase/supabase-js';

// Verificar se as variáveis de ambiente estão definidas
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Validar configuração
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Variáveis de ambiente do Supabase não configuradas');
}

// Criar cliente com configurações otimizadas para sandbox
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-web',
    },
  },
  // Configurações para melhor compatibilidade com sandbox
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
});

// Helper para verificar se o Supabase está configurado
export const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl !== '' && supabaseAnonKey !== '');
};

// Helper para verificar conectividade
export const checkSupabaseConnection = async (): Promise<{ connected: boolean; error?: string }> => {
  if (!isSupabaseConfigured()) {
    return { 
      connected: false, 
      error: 'Supabase não configurado. Configure as variáveis de ambiente.' 
    };
  }

  try {
    const { error } = await supabase.auth.getSession();
    if (error) {
      return { connected: false, error: error.message };
    }
    return { connected: true };
  } catch (err: any) {
    return { 
      connected: false, 
      error: err.message || 'Erro ao conectar com Supabase' 
    };
  }
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          weight_current: number;
          weight_goal: number;
          weight_initial: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          weight_current: number;
          weight_goal: number;
          weight_initial: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          weight_current?: number;
          weight_goal?: number;
          weight_initial?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      meals: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          time: string;
          items: string;
          calories: number;
          category: 'green' | 'yellow' | 'orange';
          date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          time: string;
          items: string;
          calories: number;
          category: 'green' | 'yellow' | 'orange';
          date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          time?: string;
          items?: string;
          calories?: number;
          category?: 'green' | 'yellow' | 'orange';
          date?: string;
          created_at?: string;
        };
      };
      daily_stats: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          steps: number;
          water_glasses: number;
          sleep_hours: number;
          mood: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          steps?: number;
          water_glasses?: number;
          sleep_hours?: number;
          mood?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          steps?: number;
          water_glasses?: number;
          sleep_hours?: number;
          mood?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};
