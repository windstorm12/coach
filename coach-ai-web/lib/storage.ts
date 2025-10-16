// lib/storage.ts
import { supabase } from './supabase';
import { SavedPlan } from '@/types';

export async function savePlan(plan: SavedPlan): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('plans')
    .insert({
      user_id: user.id,
      goal: plan.goal,
      plan: plan.plan,
      qa_pairs: plan.qa_pairs,
    });

  if (error) throw error;
}

export async function getAllPlans(): Promise<SavedPlan[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((row) => ({
    id: row.id,
    goal: row.goal,
    timestamp: new Date(row.created_at),
    qa_pairs: row.qa_pairs,
    plan: row.plan,
  }));
}

export async function getPlanById(id: string): Promise<SavedPlan | null> {
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    goal: data.goal,
    timestamp: new Date(data.created_at),
    qa_pairs: data.qa_pairs,
    plan: data.plan,
  };
}

export async function deletePlan(id: string): Promise<void> {
  const { error } = await supabase
    .from('plans')
    .delete()
    .eq('id', id);

  if (error) throw error;
}