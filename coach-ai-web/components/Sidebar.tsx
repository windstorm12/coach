// components/Sidebar.tsx
'use client';

import { SavedPlan } from '@/types';
import { colors } from '@/app/page';

interface SidebarProps {
  plans: SavedPlan[];
  currentPlanId: string | null;
  onSelectPlan: (plan: SavedPlan) => void;
  onDeletePlan: (id: string) => void;
  onNewChat: () => void;
  onSignOut: () => void;
  userEmail: string;
}

export default function Sidebar({
  plans,
  currentPlanId,
  onSelectPlan,
  onDeletePlan,
  onNewChat,
  onSignOut,
  userEmail,
}: SidebarProps) {
  return (
    <aside
      style={{
        width: 280,
        height: '100vh',
        backgroundColor: colors.surface,
        borderRight: `1px solid ${colors.border}`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: 24,
          borderBottom: `1px solid ${colors.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            backgroundColor: colors.primary,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
          </svg>
        </div>
        <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>CoachAI</h1>
      </div>

      {/* New Goal Button */}
      <div style={{ padding: 16, borderBottom: `1px solid ${colors.border}` }}>
        <button
          onClick={onNewChat}
          style={{
            width: '100%',
            padding: '10px 0',
            borderRadius: 8,
            border: 'none',
            backgroundColor: colors.primaryLighter,
            color: colors.primary,
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: 14,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.primaryLight;
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.primaryLighter;
            e.currentTarget.style.color = colors.primary;
          }}
        >
          + New Goal
        </button>
      </div>

      {/* Plans List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        <h3
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: colors.textSecondary,
            marginBottom: 8,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Your Goals
        </h3>
        {plans.length === 0 ? (
          <p
            style={{
              color: colors.textSecondary,
              fontSize: 14,
              textAlign: 'center',
              marginTop: 40,
              padding: '0 20px',
              lineHeight: 1.5,
            }}
          >
            No goals yet. Click "New Goal" to get started!
          </p>
        ) : (
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
            }}
          >
            {plans.map((plan) => {
              const selected = currentPlanId === plan.id;
              return (
                <li
                  key={plan.id}
                  onClick={() => onSelectPlan(plan)}
                  style={{
                    padding: '10px 12px',
                    marginBottom: 8,
                    borderRadius: 8,
                    backgroundColor: selected ? colors.primaryLighter : 'transparent',
                    color: selected ? colors.primary : colors.textPrimary,
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    userSelect: 'none',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!selected) {
                      e.currentTarget.style.backgroundColor = '#f5f5f5';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selected) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <span
                    style={{
                      flex: 1,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      fontSize: 14,
                      fontWeight: selected ? 600 : 400,
                    }}
                  >
                    {plan.goal}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePlan(plan.id);
                    }}
                    aria-label="Delete goal"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: colors.error,
                      cursor: 'pointer',
                      fontSize: 18,
                      fontWeight: 'bold',
                      lineHeight: 1,
                      padding: '0 4px',
                      marginLeft: 8,
                      opacity: 0.7,
                      transition: 'opacity 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '1';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '0.7';
                    }}
                  >
                    ×
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* User Info & Sign Out */}
      <div
        style={{
          padding: 16,
          borderTop: `1px solid ${colors.border}`,
          backgroundColor: colors.background,
        }}
      >
        <div
          style={{
            fontSize: 12,
            color: colors.textSecondary,
            marginBottom: 8,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={userEmail}
        >
          {userEmail}
        </div>
        <button
          onClick={onSignOut}
          style={{
            width: '100%',
            padding: 8,
            borderRadius: 8,
            border: `1px solid ${colors.border}`,
            backgroundColor: 'transparent',
            color: colors.textSecondary,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.error;
            e.currentTarget.style.color = 'white';
            e.currentTarget.style.borderColor = colors.error;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = colors.textSecondary;
            e.currentTarget.style.borderColor = colors.border;
          }}
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}