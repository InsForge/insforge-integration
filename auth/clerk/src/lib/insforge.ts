import { createClient } from '@insforge/sdk';

const baseUrl = import.meta.env.VITE_INSFORGE_BASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_INSFORGE_ANON_KEY as string | undefined;

if (!baseUrl) {
  throw new Error('Missing VITE_INSFORGE_BASE_URL in .env');
}

export type ClerkGetToken = (opts?: { template?: string }) => Promise<string | null>;

export async function getRequiredClerkToken(getToken: ClerkGetToken) {
  const token = await getToken({ template: 'insforge' });
  if (!token) {
    throw new Error('Missing Clerk token for template "insforge". Check Clerk JWT template name and claims.');
  }
  return token;
}

export function createInsforgeClient(token?: string) {
  return createClient({
    baseUrl,
    anonKey: token ? undefined : anonKey,
    edgeFunctionToken: token,
  });
}

