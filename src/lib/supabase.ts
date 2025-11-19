import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
