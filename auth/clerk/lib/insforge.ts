'use client';

import { createClient, type InsForgeClient } from '@insforge/sdk';
import { useAuth } from '@clerk/nextjs';
import { useEffect, useMemo, useState } from 'react';

export function getInsforgeConfig() {
  const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_BASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY?.trim();

  return {
    baseUrl: baseUrl ?? '',
    anonKey: anonKey ?? '',
    isConfigured: Boolean(baseUrl),
  };
}

// Clerk JWT templates default to 60s expiry — refresh before that.
const TOKEN_REFRESH_MS = 50_000;

export function useInsforgeClient(): { client: InsForgeClient; isReady: boolean } {
  const { getToken, isSignedIn } = useAuth();
  const [isReady, setIsReady] = useState(false);

  const client = useMemo(() => {
    const { baseUrl, anonKey } = getInsforgeConfig();

    if (!baseUrl || !anonKey) {
      throw new Error(
        'Missing InsForge configuration. Set NEXT_PUBLIC_INSFORGE_BASE_URL and NEXT_PUBLIC_INSFORGE_ANON_KEY.',
      );
    }

    return createClient({ baseUrl, anonKey });
  }, []);

  useEffect(() => {
    if (!isSignedIn) {
      client.getHttpClient().setAuthToken(null);
      setIsReady(false);
      return;
    }

    let cancelled = false;

    const refresh = async () => {
      const token = await getToken({ template: 'insforge' });
      if (cancelled) return;
      client.getHttpClient().setAuthToken(token ?? null);
      setIsReady(true);
    };

    void refresh();
    const interval = setInterval(() => void refresh(), TOKEN_REFRESH_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [client, getToken, isSignedIn]);

  return { client, isReady };
}
