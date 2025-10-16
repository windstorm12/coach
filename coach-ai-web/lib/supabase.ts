import { createClient } from '@supabase/supabase-js';
import { Plan as PlanType } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface QAPairDB {
  question: string;
  answer: string;
}

export interface SavedPlanDB {
  id: string;
  user_id: string;
  goal: string;
  plan: PlanType;
  qa_pairs: QAPairDB[];
  created_at: string;
  updated_at: string;
}