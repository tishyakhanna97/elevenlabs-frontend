import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  username: string;
  created_at: string;
  updated_at: string;
};

export type SpeechContext = {
  id: string;
  user_id: string;
  context_data: {
    audience?: string;
    context?: string;
    goals?: string;
    tone?: string;
    length?: string;
    language?: string;
  };
  input_mode: 'text' | 'voice';
  created_at: string;
  updated_at: string;
};

export type SpeechSession = {
  id: string;
  context_id: string;
  user_id: string;
  status: 'active' | 'completed' | 'paused';
  created_at: string;
  updated_at: string;
};
