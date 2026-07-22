'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { completeSpotifyAuthorization } from '@/lib/spotifyAuth';
import { usePlayerStore } from '@/store/usePlayerStore';

function SpotifyCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setSpotifyAccessToken = usePlayerStore((s) => s.setSpotifyAccessToken);
  const setSpotifyPremium = usePlayerStore((s) => s.setSpotifyPremium);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const authError = searchParams.get('error');

    if (authError) {
      setError(`Spotify denied the request: ${authError}`);
      return;
    }
    if (!code) {
      setError('Missing authorization code from Spotify.');
      return;
    }

    completeSpotifyAuthorization(code)
      .then(({ accessToken, isPremium }) => {
        setSpotifyAccessToken(accessToken);
        setSpotifyPremium(isPremium);
        router.replace('/');
      })
      .catch((err: Error) => setError(err.message));
  }, [searchParams, router, setSpotifyAccessToken, setSpotifyPremium]);

  return (
    <div className="flex h-full min-h-screen w-full items-center justify-center bg-black text-zinc-100">
      {error ? (
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-red-400">{error}</p>
          <Link href="/" className="text-sm text-zinc-400 underline hover:text-zinc-200">
            Return to app
          </Link>
        </div>
      ) : (
        <p className="text-sm text-zinc-400">Connecting your Spotify account…</p>
      )}
    </div>
  );
}

export default function SpotifyCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full min-h-screen w-full items-center justify-center bg-black text-zinc-100">
          <p className="text-sm text-zinc-400">Connecting your Spotify account…</p>
        </div>
      }
    >
      <SpotifyCallbackInner />
    </Suspense>
  );
}
