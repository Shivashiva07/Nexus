const PKCE_VERIFIER_KEY = 'spotify_pkce_verifier';
const SCOPES = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-modify-playback-state',
  'user-read-playback-state',
].join(' ');

function base64UrlEncode(bytes: ArrayBuffer): string {
  const binary = Array.from(new Uint8Array(bytes), (b) => String.fromCharCode(b)).join('');
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function generateCodeVerifier(): string {
  const bytes = new Uint8Array(64);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes.buffer).slice(0, 128);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64UrlEncode(digest);
}

function getRedirectUri(): string {
  const origin = window.location.origin.replace('localhost', '127.0.0.1');
  return `${origin}/spotify/callback`;
}

/** Kicks off the Authorization Code + PKCE flow by redirecting to Spotify's consent screen. */
export async function redirectToSpotifyAuthorize(): Promise<void> {
  const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
  if (!clientId) {
    throw new Error('NEXT_PUBLIC_SPOTIFY_CLIENT_ID is not configured.');
  }

  const verifier = generateCodeVerifier();
  window.sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier);
  const challenge = await generateCodeChallenge(verifier);

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: getRedirectUri(),
    code_challenge_method: 'S256',
    code_challenge: challenge,
    scope: SCOPES,
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

interface SpotifyProfile {
  product: 'premium' | 'free' | 'open';
}

export interface SpotifySessionResult {
  accessToken: string;
  isPremium: boolean;
}

/** Completes the PKCE flow: exchanges the auth code for a token and checks the account tier. */
export async function completeSpotifyAuthorization(code: string): Promise<SpotifySessionResult> {
  const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
  if (!clientId) {
    throw new Error('NEXT_PUBLIC_SPOTIFY_CLIENT_ID is not configured.');
  }

  const verifier = window.sessionStorage.getItem(PKCE_VERIFIER_KEY);
  if (!verifier) {
    throw new Error('Missing PKCE verifier; restart the Spotify connect flow.');
  }

  const redirectUri = getRedirectUri();

  const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      code_verifier: verifier,
    }),
  });

  const tokenText = await tokenResponse.text();
  if (!tokenResponse.ok) {
    throw new Error(`Spotify token exchange failed (${tokenResponse.status}): ${tokenText}`);
  }

  let token: SpotifyTokenResponse;
  try {
    token = JSON.parse(tokenText);
  } catch {
    throw new Error(`Invalid token response from Spotify: ${tokenText}`);
  }

  window.sessionStorage.removeItem(PKCE_VERIFIER_KEY);

  let isPremium = true;
  try {
    const profileResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });
    if (profileResponse.ok) {
      const profileText = await profileResponse.text();
      const profile = JSON.parse(profileText) as SpotifyProfile;
      isPremium = profile.product === 'premium';
    }
  } catch {
    // Fall back to assuming Premium if /v1/me is restricted in dev mode
  }

  return {
    accessToken: token.access_token,
    isPremium,
  };
}


