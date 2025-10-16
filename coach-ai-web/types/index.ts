export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface Step {
  step_number: number;
  do: string;
  why: string;
  check: string;
  resources: string[];
}

export interface QAPair {
  question: string;
  answer: string;
}

export interface SavedPlan {
  id: string;
  goal: string;
  timestamp: Date;
  qa_pairs: QAPair[];
  plan: Plan;
}


export interface Plan {
  goal: string;
  steps: Step[];
  tips: string[];
  
  // NEW: Goal adjustment tracking
  original_goal?: string | null;
  goal_changed_reason?: string | null;
  
  // Timeline assessment fields
  user_requested_hours?: number;
  realistic_hours_needed?: number | string;
  feasibility_ratio?: number;
  adjustment_explanation?: string;
  realistic_goal_level?: string;
}