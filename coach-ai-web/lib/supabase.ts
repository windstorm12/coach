// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export type Plan = {
  id: string;
  user_id: string;
  goal: string;
  plan: any; // Your Plan interface
  qa_pairs: any[];
  created_at: string;
  updated_at: string;
};