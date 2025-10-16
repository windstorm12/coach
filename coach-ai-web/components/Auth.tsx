// components/Auth.tsx
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AuthError } from '@supabase/supabase-js';
import { colors } from '@/app/page';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('Check your email for confirmation link!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error) {
      const authError = error as AuthError;
      setMessage(authError.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: 400,
        margin: '100px auto',
        padding: 40,
        backgroundColor: colors.surface,
        borderRadius: 16,
        boxShadow: colors.shadow,
      }}
    >
      <h2 style={{ marginBottom: 24, textAlign: 'center' }}>
        {isSignUp ? 'Sign Up' : 'Sign In'}
      </h2>

      <form onSubmit={handleAuth}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            width: '100%',
            padding: 12,
            marginBottom: 12,
            borderRadius: 8,
            border: `1px solid ${colors.border}`,
            fontSize: 15,
          }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            width: '100%',
            padding: 12,
            marginBottom: 12,
            borderRadius: 8,
            border: `1px solid ${colors.border}`,
            fontSize: 15,
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: 12,
            borderRadius: 8,
            border: 'none',
            backgroundColor: colors.primary,
            color: 'white',
            fontSize: 15,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: 12,
          }}
        >
          {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
        </button>
      </form>

      {message && (
        <p style={{ color: message.includes('error') ? colors.error : colors.success, fontSize: 14, textAlign: 'center' }}>
          {message}
        </p>
      )}

      <button
        onClick={() => setIsSignUp(!isSignUp)}
        style={{
          background: 'none',
          border: 'none',
          color: colors.primary,
          cursor: 'pointer',
          fontSize: 14,
          width: '100%',
          marginTop: 12,
        }}
      >
        {isSignUp ? 'Already have an account? Sign in' : "Don&apos;t have an account? Sign up"}
      </button>
    </div>
  );
}