// components/PlanTable.tsx
'use client';

import { useState } from 'react';
import { Plan } from '@/types';
import { colors } from '@/app/page';

interface PlanTableProps {
  plan: Plan;
}

export default function PlanTable({ plan }: PlanTableProps) {
  // Helper: format minutes into "Xh Ym" or "Xm"
  const formatMinutes = (mins: number | undefined) => {
    const m = Math.max(0, Number(mins || 0));
    const h = Math.floor(m / 60);
    const r = m % 60;
    if (h > 0 && r > 0) return `${h}h ${r}m`;
    if (h > 0) return `${h}h`;
    return `${r}m`;
  };

  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());

  const toggleComplete = (stepNumber: number) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepNumber)) next.delete(stepNumber);
      else next.add(stepNumber);
      return next;
    });
  };

  const toggleExpand = (stepNumber: number) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepNumber)) next.delete(stepNumber);
      else next.add(stepNumber);
      return next;
    });
  };

  const progressPercentage =
    plan.steps.length > 0 ? (completedSteps.size / plan.steps.length) * 100 : 0;

  // Timeline assessment fields (optional in backend)
  const wasAdjusted = (plan as any).timeline_adjusted;
  const adjustmentExplanation = (plan as any).adjustment_explanation;
  const userRequestedHours = (plan as any).user_requested_hours;
  const realisticHoursNeeded = (plan as any).realistic_hours_needed;
  const realisticGoalLevel = (plan as any).realistic_goal_level;
  const isImpossible = realisticHoursNeeded === 'IMPOSSIBLE';

  return (
    <div style={{ marginTop: 24 }}>
      {/* IMPOSSIBLE GOAL WARNING */}
      {isImpossible && (
        <div
          style={{
            backgroundColor: '#fee2e2',
            border: '3px solid #ef4444',
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <div style={{ fontSize: 48 }}>🚫</div>
            <div style={{ flex: 1 }}>
              <h3
                style={{
                  margin: '0 0 12px 0',
                  fontSize: 24,
                  fontWeight: 700,
                  color: '#dc2626',
                }}
              >
                IMPOSSIBLE GOAL DETECTED
              </h3>
              <p
                style={{
                  margin: '0 0 16px 0',
                  fontSize: 16,
                  color: '#991b1b',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {adjustmentExplanation ||
                  'This goal cannot be achieved by an individual due to team/infrastructure requirements.'}
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 12,
                  marginTop: 16,
                  paddingTop: 16,
                  borderTop: '1px solid #fca5a5',
                }}
              >
                <div>
                  <div style={{ fontSize: 12, color: '#991b1b', marginBottom: 4, fontWeight: 600 }}>
                    Your Goal
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#dc2626' }}>{plan.goal}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#991b1b', marginBottom: 4, fontWeight: 600 }}>
                    Assessment
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#dc2626' }}>
                    Requires Team/Infrastructure
                  </div>
                </div>
              </div>

              <div
                style={{
                  marginTop: 16,
                  padding: 12,
                  backgroundColor: '#fef3c7',
                  borderRadius: 8,
                  border: '1px solid #fbbf24',
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 600, color: '#92400e', marginBottom: 4 }}>
                  💡 Achievable Alternative:
                </div>
                <div style={{ fontSize: 14, color: '#78350f' }}>
                  {realisticGoalLevel || 'See the plan below for an achievable path'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 🆕 GOAL CHANGE WARNING - ADD THIS ENTIRE BLOCK */}
      {plan.original_goal && plan.goal_changed_reason && !isImpossible && (
        <div
          style={{
            backgroundColor: '#FFF4E6',
            border: '2px solid #FF9800',
            borderRadius: 16,
            padding: 20,
            marginBottom: 24,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <span style={{ fontSize: 24 }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <h3
                style={{
                  margin: '0 0 12px 0',
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#E65100',
                }}
              >
                Goal Adjusted for Realism
              </h3>
              
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>
                  <strong>Your original goal:</strong>
                </div>
                <div
                  style={{
                    fontSize: 15,
                    color: '#333',
                    fontStyle: 'italic',
                    textDecoration: 'line-through',
                    opacity: 0.7,
                  }}
                >
                  {plan.original_goal}
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>
                  <strong>Adjusted to:</strong>
                </div>
                <div
                  style={{
                    fontSize: 15,
                    color: '#2E7D32',
                    fontWeight: 600,
                  }}
                >
                  {plan.goal}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>
                  <strong>Why:</strong>
                </div>
                <div
                  style={{
                    fontSize: 14,
                    color: '#333',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {plan.goal_changed_reason}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timeline Adjustment Warning */}
      {wasAdjusted && !isImpossible && adjustmentExplanation && (
        <div
          style={{
            backgroundColor: '#fff3cd',
            border: '2px solid #ffc107',
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
            <div style={{ fontSize: 24 }}>⚠️</div>
            <div style={{ flex: 1 }}>
              <h3
                style={{
                  margin: '0 0 8px 0',
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#856404',
                }}
              >
                Timeline Adjusted for Realism
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  color: '#856404',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {adjustmentExplanation}
              </p>
            </div>
          </div>

          {userRequestedHours && realisticHoursNeeded && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 12,
                marginTop: 16,
                paddingTop: 16,
                borderTop: '1px solid #ffc107',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: '#856404', marginBottom: 4, fontWeight: 600 }}>
                  You Requested
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#856404' }}>
                  {userRequestedHours}h
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: '#856404', marginBottom: 4, fontWeight: 600 }}>
                  Realistic Need
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#856404' }}>
                  {typeof realisticHoursNeeded === 'number'
                    ? `${realisticHoursNeeded}h`
                    : String(realisticHoursNeeded)}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: '#856404', marginBottom: 4, fontWeight: 600 }}>
                  Goal Level
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#856404' }}>
                  {realisticGoalLevel || 'Adjusted'}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Header Card */}
      <div
        style={{
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 24,
          boxShadow: colors.shadow,
          marginBottom: 20,
          border: isImpossible ? '2px solid #fbbf24' : `2px solid ${colors.primary}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  backgroundColor: isImpossible ? '#fbbf24' : colors.primary,
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                }}
              >
                {isImpossible ? '💡' : '🎯'}
              </div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 24,
                  fontWeight: 700,
                  color: colors.textPrimary,
                }}
              >
                {isImpossible ? `Alternative: ${realisticGoalLevel || 'Achievable Path'}` : plan.goal}
              </h2>
            </div>
            <p style={{ margin: '8px 0 0 52px', color: colors.textSecondary, fontSize: 14 }}>
              {isImpossible
                ? "Since your original goal requires a team, here's what you CAN achieve individually"
                : 'Your personalized roadmap to success'}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginTop: 20 }}>
          <div style={{ backgroundColor: colors.primaryLighter, padding: 16, borderRadius: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: colors.primary }}>{plan.steps.length}</div>
            <div style={{ fontSize: 12, color: colors.textSecondary, fontWeight: 600 }}>Total Steps</div>
          </div>
          <div style={{ backgroundColor: '#fef3c7', padding: 16, borderRadius: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#d97706' }}>{Math.round(progressPercentage)}%</div>
            <div style={{ fontSize: 12, color: colors.textSecondary, fontWeight: 600 }}>Complete</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary }}>Progress</span>
            <span style={{ fontSize: 13, color: colors.textSecondary }}>
              {completedSteps.size} of {plan.steps.length} steps
            </span>
          </div>
          <div
            style={{
              width: '100%',
              height: 10,
              backgroundColor: '#e5e7eb',
              borderRadius: 10,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progressPercentage}%`,
                height: '100%',
                backgroundColor: colors.primary,
                borderRadius: 10,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {plan.steps.map((step) => {
          const isCompleted = completedSteps.has(step.step_number);
          const isExpanded = expandedSteps.has(step.step_number);

          return (
            <div
              key={step.step_number}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                boxShadow: colors.shadow,
                border: isCompleted ? `2px solid ${colors.success}` : '1px solid #e5e7eb',
                overflow: 'hidden',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ padding: 20 }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleComplete(step.step_number)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      border: `2px solid ${isCompleted ? colors.success : colors.border}`,
                      backgroundColor: isCompleted ? colors.success : 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {isCompleted && (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>

                  {/* Step Number */}
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: isCompleted ? colors.success : colors.primary,
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 16,
                      flexShrink: 0,
                    }}
                  >
                    {step.step_number}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3
                      style={{
                        margin: '0 0 8px 0',
                        fontSize: 18,
                        fontWeight: 600,
                        color: isCompleted ? colors.success : colors.textPrimary,
                        textDecoration: isCompleted ? 'line-through' : 'none',
                      }}
                    >
                      {step.do}
                    </h3>

                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
                      {step.resources.length > 0 && (                        <span
                          style={{
                            fontSize: 13,
                            color: colors.textSecondary,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          📚 {step.resources.length} resources
                        </span>
                      )}
                    </div>

                    {/* Why */}
                    <div
                      style={{
                        padding: 12,
                        backgroundColor: '#f9fafb',
                        borderRadius: 8,
                        borderLeft: `3px solid ${colors.primary}`,
                      }}
                    >
                      <p style={{ margin: 0, fontSize: 14, color: colors.textSecondary, lineHeight: 1.6 }}>
                        <strong style={{ color: colors.textPrimary }}>Why:</strong> {step.why}
                      </p>
                    </div>

                    {/* Expand button */}
                    <button
                      onClick={() => toggleExpand(step.step_number)}
                      style={{
                        marginTop: 12,
                        padding: '8px 16px',
                        borderRadius: 8,
                        border: `1px solid ${colors.border}`,
                        backgroundColor: 'white',
                        color: colors.primary,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = colors.primaryLighter;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                      }}
                    >
                      {isExpanded ? '↑ Show Less' : '↓ Show Details'}
                    </button>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${colors.border}` }}>
                        {/* Check */}
                        <div
                          style={{
                            padding: 12,
                            backgroundColor: '#f0fdf4',
                            borderRadius: 8,
                            borderLeft: `3px solid ${colors.success}`,
                            marginBottom: 12,
                          }}
                        >
                          <p style={{ margin: 0, fontSize: 14, color: colors.textSecondary, lineHeight: 1.6 }}>
                            <strong style={{ color: colors.success }}>✓ How to verify:</strong> {step.check}
                          </p>
                        </div>

                        {/* Resources */}
                        {step.resources.length > 0 && (
                          <div>
                            <h4
                              style={{
                                margin: '0 0 8px 0',
                                fontSize: 14,
                                fontWeight: 600,
                                color: colors.textPrimary,
                              }}
                            >
                              📚 Resources:
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {step.resources.map((resource, i) => (
                                <div
                                  key={i}
                                  style={{
                                    padding: 10,
                                    backgroundColor: colors.primaryLighter,
                                    borderRadius: 8,
                                    fontSize: 13,
                                    color: colors.primary,
                                    fontWeight: 500,
                                  }}
                                >
                                  • {resource}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tips */}
      {plan.tips.length > 0 && (
        <div
          style={{
            marginTop: 20,
            backgroundColor: '#fffbeb',
            borderRadius: 12,
            padding: 24,
            border: '2px solid #fbbf24',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div
              style={{
                width: 40,
                height: 40,
                backgroundColor: '#fbbf24',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
              }}
            >
              💡
            </div>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#92400e' }}>Pro Tips for Success</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {plan.tips.map((tip, i) => (
              <div
                key={i}
                style={{
                  padding: 14,
                  backgroundColor: 'white',
                  borderRadius: 8,
                  fontSize: 14,
                  color: colors.textSecondary,
                  lineHeight: 1.6,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                }}
              >
                <strong style={{ color: '#d97706' }}>Tip {i + 1}:</strong> {tip}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}