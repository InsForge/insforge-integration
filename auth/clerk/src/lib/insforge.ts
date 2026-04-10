import { createClient, type InsForgeClient } from '@insforge/sdk';
import { useAuth } from '@clerk/clerk-react';
import { useEffect, useMemo, useState } from 'react';

export function getInsforgeConfig() {
  const baseUrl = import.meta.env.VITE_INSFORGE_BASE_URL?.trim();
  const anonKey = import.meta.env.VITE_INSFORGE_ANON_KEY?.trim();

  return {
    baseUrl: baseUrl ?? '',
    anonKey: anonKey ?? '',
    isConfigured: Boolean(baseUrl),
  };
}

export function useInsforgeClient(): { client: InsForgeClient; isReady: boolean } {
  const { getToken, isSignedIn } = useAuth();
  const [isReady, setIsReady] = useState(false);

  const client = useMemo(() => {
    const { baseUrl, anonKey } = getInsforgeConfig();

    if (!baseUrl || !anonKey) {
      throw new Error(
        'Missing InsForge configuration. Set VITE_INSFORGE_BASE_URL and VITE_INSFORGE_ANON_KEY.',
      );
    }

    return createClient({ baseUrl, anonKey });
  }, []);

  useEffect(() => {
    if (!isSignedIn) {
      setIsReady(false);
      return;
    }

    void (async () => {
      const token = await getToken({ template: 'insforge' });
      if (token) {
        client.getHttpClient().setAuthToken(token);
      }
      setIsReady(true);
    })();
  }, [client, getToken, isSignedIn]);

  return { client, isReady };
}
