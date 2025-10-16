// components/ChatInterface.tsx
'use client';
import { getClarifyingQuestions, generatePlan, continueConversation } from '@/lib/api';
import { useEffect, useRef, useState } from 'react';
import { Message, Plan, QAPair, SavedPlan } from '@/types';
import { colors } from '@/app/page';
import PlanTable from './PlanTable';

type ChatState = 'idle' | 'asking-questions' | 'plan-ready';
interface Props {
  onPlanGenerated: (plan: SavedPlan) => void;
  loadedPlan?: SavedPlan | null;
}

export default function ChatInterface({ onPlanGenerated, loadedPlan }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [state, setState] = useState<ChatState>('idle');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [goal, setGoal] = useState('');
  const [questions, setQuestions] = useState<string[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [qaPairs, setQaPairs] = useState<QAPair[]>([]);
  const [plan, setPlan] = useState<Plan | null>(null);

  const endRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (taRef.current) {
      taRef.current.style.height = '0px';
      taRef.current.style.height = Math.min(taRef.current.scrollHeight, 160) + 'px';
    }
  }, [input]);

  useEffect(() => {
    if (!loadedPlan) return;
    setMessages([
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Here's your saved plan for: "${loadedPlan.goal}"`,
        timestamp: new Date(),
      },
    ]);
    setGoal(loadedPlan.goal);
    setQaPairs(loadedPlan.qa_pairs);
    setPlan(loadedPlan.plan);
  }, [loadedPlan]);

  const addMsg = (role: 'user' | 'assistant', content: string) => {
    setMessages((m) => [
      ...m,
      { id: Date.now().toString() + Math.random(), role, content, timestamp: new Date() },
    ]);
  };

  const handleCopy = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(messageId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Helper: normalize/check fields safely
  const isImpossibleGoal = (p: any) => {
    const v = p?.realistic_hours_needed;
    if (!v) return false;
    if (typeof v === 'string' && v.toUpperCase() === 'IMPOSSIBLE') return true;
    return false;
  };
  const hasNoSteps = (p: any) => !p?.steps || !Array.isArray(p.steps) || p.steps.length === 0;
  const getRatio = (p: any): number | null => {
    const r = p?.feasibility_ratio;
    if (r === null || r === undefined) return null;
    const n = Number(r);
    return Number.isFinite(n) ? n : null;
  };
  const wasAdjusted = (p: any) => p?.timeline_adjusted === true || Boolean(p?.adjustment_explanation);

  const send = async () => {
    if (!input.trim() || isLoading) return;
    const text = input.trim();
    setInput('');
    addMsg('user', text);
    setIsLoading(true);

    try {
      if (state === 'idle') {
        // Initial goal submission
        setGoal(text);
        
        // First question is always about time
        const timeQuestion = "How much time do you have to achieve this goal? (e.g., '5 days', '3 months', '2 hours per week for 6 months')";
        setQuestions([timeQuestion]);
        setQIndex(0);
        setState('asking-questions');
        addMsg('assistant', timeQuestion);

      } else if (state === 'asking-questions') {
        // User answered a question
        const currentQ = questions[qIndex];
        const nextQA = [...qaPairs, { question: currentQ, answer: text }];
        setQaPairs(nextQA);

        // Check if we should ask more or generate plan
        const maxQuestions = 10;
        
        if (nextQA.length >= maxQuestions) {
          // Hit max questions - generate plan
          addMsg('assistant', '🎯 Generating your personalized plan…');
          const p = await generatePlan(goal, nextQA);
          setPlan(p);
          setState('plan-ready');
          
          const msg = buildPlanMessage(p);
          addMsg('assistant', msg);
          
          onPlanGenerated({
            id: Date.now().toString(),
            goal,
            timestamp: new Date(),
            qa_pairs: nextQA,
            plan: p,
          });
        } else {
          // Ask Gemini if it needs more info
          addMsg('assistant', '🤔 Thinking...');
          const decision = await continueConversation(goal, nextQA);
          
          // Remove "thinking" message
          setMessages((m) => m.slice(0, -1));
          
          if (decision.action === 'ask' && decision.question) {
            // Ask another question
            const newQuestions = [...questions, decision.question];
            setQuestions(newQuestions);
            setQIndex(qIndex + 1);
            
            // Show progress
            const progressMsg = `📋 Question ${nextQA.length + 1} of ${maxQuestions} max`;
            addMsg('assistant', `${progressMsg}\n\n${decision.question}`);
          } else {
            // Ready to generate plan
            addMsg('assistant', '🎯 I have enough information! Generating your personalized plan…');
            const p = await generatePlan(goal, nextQA);
            setPlan(p);
            setState('plan-ready');
            
            const msg = buildPlanMessage(p);
            addMsg('assistant', msg);
            
            onPlanGenerated({
              id: Date.now().toString(),
              goal,
              timestamp: new Date(),
              qa_pairs: nextQA,
              plan: p,
            });
          }
        }

      } else if (state === 'plan-ready') {
        // User can start a new goal
        setGoal(text);
        const timeQuestion = "How much time do you have to achieve this goal? (e.g., '5 days', '3 months', '2 hours per week for 6 months')";
        setQuestions([timeQuestion]);
        setQIndex(0);
        setQaPairs([]);
        setPlan(null);
        setState('asking-questions');
        addMsg('assistant', timeQuestion);
      }
    } catch (e) {
      console.error(e);
      addMsg('assistant', '❌ Sorry, something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to build plan message (add this before send())
  const buildPlanMessage = (p: Plan): string => {
    let msg = '';
    
    if (p.original_goal && p.goal_changed_reason) {
      msg = `⚠️ I've adjusted your goal to be more realistic.\n\nYour plan is ready below.`;
    } else {
      const impossible = isImpossibleGoal(p);
      const ratio = getRatio(p);
      const adjusted = wasAdjusted(p);
      const noSteps = hasNoSteps(p);
      const reason = (p as any)?.adjustment_explanation || '';

      if (impossible || noSteps) {
        msg =
          `🚫 Your goal is currently IMPOSSIBLE for an individual (requires a team/massive infrastructure).\n\n` +
          (reason ? `Why: ${reason}\n\n` : ``) +
          `I've created an achievable alternative you CAN do solo. See the warning and plan below.`;
      } else if (adjusted && ratio !== null) {
        if (ratio < 0.1) {
          msg = `⚠️ Your timeline was ABSURDLY short (less than 10% of what's needed).\n\nI've created a realistic plan with proper time allocation. See the warning below.`;
        } else if (ratio < 0.3) {
          msg = `⚠️ Your timeline was very unrealistic (~${Math.round(ratio * 100)}% of required time).\n\nI've adjusted the plan to be achievable. See the warning below.`;
        } else if (ratio < 0.7) {
          msg = `⚠️ Your timeline is aggressive (~${Math.round(ratio * 100)}% of required time) but possible with high intensity.\n\nHere's a challenging yet achievable plan. See details below.`;
        } else {
          msg = `✨ Your plan is ready! Your timeline looks realistic. Would you like me to create a schedule for you?`;
        }
      } else if (adjusted) {
        msg = `⚠️ I've adjusted your timeline to be more realistic.\n\n${reason ? `Why: ${reason}\n\n` : ``}Your plan is ready below.`;
      } else {
        msg = `✨ Your plan is ready!`;
      }
    }
    
    return msg;
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: colors.background,
        padding: 24,
        overflow: 'hidden',
      }}
    >
      {/* Messages Area */}
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: 16 }}>
        {/* Welcome Screen */}
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: 80, color: colors.textSecondary }}>
            <h2 style={{ fontSize: 24, marginBottom: 8, color: colors.textPrimary }}>
              What's your goal?
            </h2>
            <p style={{ fontSize: 16, marginBottom: 16 }}>
              Tell me what you want to achieve and I'll create a personalized plan.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
              {['Learn a skill', 'Start business', 'Get fit', 'Write book'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 20,
                    border: `1.5px solid ${colors.primary}`,
                    backgroundColor: 'transparent',
                    color: colors.primary,
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: 14,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.primary;
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = colors.primary;
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              marginBottom: 24,
              display: 'flex',
              justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div
              style={{
                maxWidth: '75%',
                backgroundColor: m.role === 'user' ? colors.primary : colors.surface,
                color: m.role === 'user' ? 'white' : colors.textPrimary,
                padding: '12px 16px',
                borderRadius: 16,
                boxShadow: colors.shadow,
                whiteSpace: 'pre-wrap',
                fontSize: 15,
                lineHeight: 1.5,
                position: 'relative',
              }}
            >
              {m.content}
              {m.role === 'assistant' && (
                <button
                  onClick={() => handleCopy(m.content, m.id)}
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    background: 'transparent',
                    border: 'none',
                    color: colors.primary,
                    cursor: 'pointer',
                    fontSize: 12,
                    opacity: copiedId === m.id ? 1 : 0.5,
                    transition: 'opacity 0.3s ease',
                  }}
                  title="Copy message"
                >
                  {copiedId === m.id ? '✓' : '📋'}
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Plan Display */}
        {plan && <PlanTable plan={plan} />}

        {/* Loading */}
        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 24 }}>
            <div
              style={{
                backgroundColor: colors.surface,
                padding: '12px 16px',
                borderRadius: 16,
                boxShadow: colors.shadow,
                color: colors.textSecondary,
                fontSize: 14,
              }}
            >
              Thinking...
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Input Area */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        style={{ display: 'flex', gap: 12, alignItems: 'center' }}
      >
        <textarea
          ref={taRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder="What's your goal?"
          rows={1}
          disabled={isLoading}
          style={{
            flex: 1,
            resize: 'none',
            padding: 12,
            borderRadius: 12,
            border: `1px solid ${colors.border}`,
            fontSize: 15,
            fontFamily: 'inherit',
            color: colors.textPrimary,
            backgroundColor: colors.surface,
            boxShadow: colors.shadow,
            outline: 'none',
            transition: 'border-color 0.2s ease',
            minHeight: 40,
            maxHeight: 160,
            overflowY: 'auto',
          }}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          style={{
            padding: '10px 20px',
            borderRadius: 12,
            border: 'none',
            backgroundColor: input.trim() && !isLoading ? colors.primary : colors.border,
            color: input.trim() && !isLoading ? 'white' : colors.textSecondary,
            fontWeight: 600,
            cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
            fontSize: 15,
            transition: 'background-color 0.2s ease',
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}