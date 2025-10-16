// app/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { SavedPlan } from '@/types';
import { getAllPlans, savePlan, deletePlan } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import ChatInterface from '@/components/ChatInterface';
import Auth from '@/components/Auth';

// Define colors with proper typing
export const colors = {
  background: '#fafafa',
  surface: '#fff',
  border: '#e0e0e0',
  textPrimary: '#222',
  textSecondary: '#555',
  primary: '#2563eb',
  primaryLight: '#3b82f6',
  primaryLighter: '#dbeafe',
  success: '#10b981',
  error: '#ef4444',
  shadow: '0 1px 3px rgba(0,0,0,0.1)',
} as const;

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<SavedPlan[]>([]);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [loadedPlan, setLoadedPlan] = useState<SavedPlan | null>(null);
  const [chatKey, setChatKey] = useState(0);

  // Check auth status
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load plans when user logs in
  useEffect(() => {
    if (user) {
      loadPlans();
    } else {
      setPlans([]);
    }
  }, [user]);

  const loadPlans = async () => {
    const userPlans = await getAllPlans();
    setPlans(userPlans);
  };

  const handlePlanGenerated = async (plan: SavedPlan) => {
    await savePlan(plan);
    await loadPlans();
    setCurrentPlanId(plan.id);
  };

  const handleSelectPlan = (plan: SavedPlan) => {
    setCurrentPlanId(plan.id);
    setLoadedPlan(plan);
  };

  const handleDeletePlan = async (id: string) => {
    if (confirm('Delete this plan?')) {
      await deletePlan(id);
      await loadPlans();
      if (currentPlanId === id) {
        setCurrentPlanId(null);
        setLoadedPlan(null);
        setChatKey((prev) => prev + 1);
      }
    }
  };

  const handleNewChat = () => {
    setCurrentPlanId(null);
    setLoadedPlan(null);
    setChatKey((prev) => prev + 1);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: colors.background }}>
      <Sidebar
        plans={plans}
        currentPlanId={currentPlanId}
        onSelectPlan={handleSelectPlan}
        onDeletePlan={handleDeletePlan}
        onNewChat={handleNewChat}
        onSignOut={handleSignOut}
        userEmail={user.email || 'User'}
      />
      <ChatInterface key={chatKey} onPlanGenerated={handlePlanGenerated} loadedPlan={loadedPlan} />
    </div>
  );
}