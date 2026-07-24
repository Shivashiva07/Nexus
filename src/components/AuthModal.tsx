'use client';

import React, { useState } from 'react';
import { usePlayerStore } from '@/store/usePlayerStore';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithRedirect,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
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

  if (!isAuthModalOpen) return null;

  function closeModal() {
    setError(null);
    setEmail('');
    setPassword('');
    setAuthModalOpen(false);
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      showToast('Signed in with Google! Cloud sync active.');
      closeModal();
      setLoading(false);
    } catch (err: unknown) {
      console.error('Google Sign-In popup error:', err);
      const code = (err as { code?: string })?.code || '';
      const msg = err instanceof Error ? err.message : 'Google sign in failed.';

      // User manually closed popup
      if (code === 'auth/popup-closed-by-user' || msg.includes('popup-closed-by-user')) {
        setLoading(false);
        return;
      }

      // Domain not authorized in Firebase Console
      if (code === 'auth/unauthorized-domain' || msg.includes('unauthorized-domain')) {
        setError('This domain is not authorized for Google Sign-In in Firebase Console (Authentication > Settings > Authorized domains).');
        setLoading(false);
        return;
      }

      // Google Provider not enabled in Firebase Console
      if (code === 'auth/operation-not-allowed' || msg.includes('operation-not-allowed')) {
        setError('Google Sign-In is disabled. Enable Google under Firebase Console > Authentication > Sign-in method.');
        setLoading(false);
        return;
      }

      // If popup blocked or COOP error, try redirect fallback
      if (code === 'auth/popup-blocked' || msg.includes('popup-blocked')) {
        console.warn('Popup blocked, attempting redirect fallback...');
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectErr: unknown) {
          console.error('Google Redirect Auth error:', redirectErr);
          const rMsg = redirectErr instanceof Error ? redirectErr.message : 'Google sign in failed.';
          setError(rMsg.replace('Firebase: ', ''));
          setLoading(false);
          return;
        }
      }

      // Display the actual error message
      setError(msg.replace('Firebase: Error (', '').replace(').', '').replace('Firebase: ', ''));
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
            code === 'auth/user-not-found' ||
            code === 'auth/invalid-credential' ||
            msg.includes('user-not-found') ||
            msg.includes('invalid-credential')
          ) {
            setError('Account not found or password incorrect. Try switching to Create Account.');
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
        setError('An account with this email already exists. Try switching to Sign In.');
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

        {/* Google Sign In Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white text-black font-semibold text-sm hover:bg-white/90 active:scale-[0.99] transition-all shadow-md mb-4 disabled:opacity-50 cursor-pointer"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Continue with Google
        </button>

        <div className="relative flex items-center justify-center my-4">
          <div className="w-full border-t border-white/10"></div>
          <span className="absolute px-3 bg-[#121218] text-[10px] text-white/40 uppercase tracking-widest">or email</span>
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

        {/* Error alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2.5 leading-relaxed animate-fade-in">
            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1 break-words">
              <span>{error}</span>
              {mode === 'signin' && (error.includes('Create Account') || error.includes('not found')) && (
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setError(null); }}
                  className="block mt-1.5 font-semibold text-indigo-400 hover:text-indigo-300 underline cursor-pointer transition-colors"
                >
                  Switch to Create Account →
                </button>
              )}
              {mode === 'signup' && error.includes('Sign In') && (
                <button
                  type="button"
                  onClick={() => { setMode('signin'); setError(null); }}
                  className="block mt-1.5 font-semibold text-indigo-400 hover:text-indigo-300 underline cursor-pointer transition-colors"
                >
                  Switch to Sign In →
                </button>
              )}
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
            <label className="block text-[11px] font-medium text-white/70 mb-1">Password</label>
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
