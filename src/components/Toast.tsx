'use client';

import { useEffect } from 'react';
import { usePlayerStore } from '@/store/usePlayerStore';

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4 text-[#1db954]">
      <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z" />
    </svg>
  );
}

export function Toast() {
  const toastMessage = usePlayerStore((s) => s.toastMessage);
  const showToast = usePlayerStore((s) => s.showToast);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      showToast(null);
    }, 2500);
    return () => clearTimeout(timer);
  }, [toastMessage, showToast]);

  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-24 right-8 z-50 flex items-center gap-2.5 rounded-lg bg-[#282828] px-4 py-3 text-xs font-semibold text-white shadow-xl border border-white/10 animate-bounce-short">
      <CheckIcon />
      <span className="truncate max-w-xs">{toastMessage}</span>
    </div>
  );
}
