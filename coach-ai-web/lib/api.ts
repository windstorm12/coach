import { Plan, QAPair } from '@/types';

const API_BASE = 'http://localhost:8000';

export async function getClarifyingQuestions(goal: string): Promise<string[]> {
  const response = await fetch(`${API_BASE}/api/clarify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ goal }),
  });

  if (!response.ok) {
    throw new Error('Failed to get questions');
  }

  const data = await response.json();
  return data.questions;
}

export async function generatePlan(goal: string, qa_pairs: QAPair[]): Promise<Plan> {
  const response = await fetch(`${API_BASE}/api/plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ goal, qa_pairs }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate plan');
  }

  return response.json();
}

export async function continueConversation(
  goal: string,
  qa_pairs: QAPair[]
): Promise<{ action: string; question: string | null; reasoning: string | null }> {
  const response = await fetch(`${API_BASE}/api/continue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ goal, qa_pairs }),
  });

  if (!response.ok) {
    throw new Error('Failed to continue conversation');
  }

  return response.json();
}