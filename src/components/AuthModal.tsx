'use client';

import React, { useState } from 'react';
import { usePlayerStore } from '@/store/usePlayerStore';
import {
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from '@/lib/firebase';

export function AuthModal() {
  const isAuthModalOpen = usePlayerStore((s) => s.isAuthModalOpen);
  const setAuthModalOpen = usePlayerStore((s) => s.setAuthModalOpen);
  const showToast = usePlayerStore((s) => s.showToast);

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  if (!isAuthModalOpen) return null;

  function closeModal() {
    setError(null);
    setEmail('');
    setPassword('');
    setResetSent(false);
    setAuthModalOpen(false);
  }


  async function handlePasswordReset() {
    if (!email) {
      setError('Please enter your email address above to reset password.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
      showToast(`Password reset link sent to ${email}`);
    } catch (err: unknown) {
      console.error('Reset Password Error:', err);
      const msg = err instanceof Error ? err.message : 'Failed to send reset email.';
      setError(msg.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError(null);
    setResetSent(false);

    try {
      if (mode === 'signin') {
        try {
          await signInWithEmailAndPassword(auth, email, password);
          showToast('Successfully signed in! Cloud sync active.');
          closeModal();
          return;
        } catch (signInErr: unknown) {
          const code = (signInErr as { code?: string })?.code || '';
          const msg = signInErr instanceof Error ? signInErr.message : '';

          if (
            code === 'auth/invalid-credential' ||
            code === 'auth/wrong-password' ||
            code === 'auth/user-not-found' ||
            msg.includes('invalid-credential') ||
            msg.includes('user-not-found')
          ) {
            setError('Incorrect password or account not found. If you forgot your password, send a reset link below.');
            return;
          } else {
            setError(msg.replace('Firebase: ', ''));
            return;
          }
        }
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        showToast('Account created! Your library is now syncing.');
        closeModal();
        return;
      }
    } catch (err: unknown) {
      console.error('Email Auth Error:', err);
      const msg = err instanceof Error ? err.message : 'Authentication failed.';
      const code = (err as { code?: string })?.code || '';

      if (code === 'auth/email-already-in-use' || msg.includes('email-already-in-use')) {
        setError('An account with this email already exists. Try signing in or reset your password.');
      } else if (code === 'auth/weak-password' || msg.includes('weak-password')) {
        setError('Password should be at least 6 characters long.');
      } else if (code === 'auth/invalid-email' || msg.includes('invalid-email')) {
        setError('Invalid email address format.');
      } else {
        setError(msg.replace('Firebase: ', ''));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#121218]/95 p-6 md:p-8 shadow-2xl backdrop-blur-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={closeModal}
          className="absolute top-5 right-5 p-2 text-white/50 hover:text-white rounded-full hover:bg-white/10 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Title */}
        <div className="text-center mb-6">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center mb-3 shadow-lg shadow-indigo-500/20">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Sync Across All Devices</h2>
          <p className="text-xs text-white/60 mt-1">Sign in to sync your playlists and liked songs everywhere</p>
        </div>


        {/* Mode Toggle Tabs */}
        <div className="flex bg-white/5 rounded-xl p-1 mb-4">
          <button
            type="button"
            onClick={() => { setMode('signin'); setError(null); }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              mode === 'signin' ? 'bg-white/15 text-white shadow-sm' : 'text-white/50 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(null); }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              mode === 'signup' ? 'bg-white/15 text-white shadow-sm' : 'text-white/50 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Password Reset Alert */}
        {resetSent && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-start gap-2.5 leading-relaxed animate-fade-in">
            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div className="flex-1 break-words">
              <span>Password reset link sent to <strong>{email}</strong>. Please check your inbox or spam folder.</span>
            </div>
          </div>
        )}

        {/* Error alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2.5 leading-relaxed animate-fade-in">
            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1 break-words">
              <span>{error}</span>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
                {mode === 'signin' && (
                  <>
                    <button
                      type="button"
                      onClick={() => { setMode('signup'); setError(null); }}
                      className="font-semibold text-indigo-400 hover:text-indigo-300 underline cursor-pointer transition-colors"
                    >
                      Switch to Create Account →
                    </button>
                    <button
                      type="button"
                      onClick={handlePasswordReset}
                      className="font-semibold text-purple-400 hover:text-purple-300 underline cursor-pointer transition-colors"
                    >
                      Reset Password 🔑
                    </button>
                  </>
                )}
                {mode === 'signup' && (
                  <>
                    <button
                      type="button"
                      onClick={() => { setMode('signin'); setError(null); }}
                      className="font-semibold text-indigo-400 hover:text-indigo-300 underline cursor-pointer transition-colors"
                    >
                      Switch to Sign In →
                    </button>
                    <button
                      type="button"
                      onClick={handlePasswordReset}
                      className="font-semibold text-purple-400 hover:text-purple-300 underline cursor-pointer transition-colors"
                    >
                      Reset Password 🔑
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[11px] font-medium text-white/70 mb-1">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-medium text-white/70">Password</label>
              <button
                type="button"
                onClick={handlePasswordReset}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs transition-all active:scale-[0.98] shadow-md shadow-indigo-500/25 disabled:opacity-50 mt-2"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : mode === 'signin' ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
