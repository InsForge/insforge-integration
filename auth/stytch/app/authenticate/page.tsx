'use client';

import { Suspense } from 'react';
import { useStytch, useStytchSession } from '@stytch/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';

function AuthenticateInner() {
  const stytch = useStytch();
  const { session } = useStytchSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const authenticating = useRef(false);

  useEffect(() => {
    if (session) {
      router.replace('/');
      return;
    }

    const token = searchParams.get('token');
    const type = searchParams.get('stytch_token_type');

    if (token && type === 'magic_links' && !authenticating.current) {
      authenticating.current = true;
      stytch.magicLinks
        .authenticate(token, { session_duration_minutes: 60 })
        .then(() => {
          router.replace('/');
        })
        .catch((err) => {
          console.error('Stytch authenticate error:', err);
          router.replace('/login');
        });
    }
  }, [stytch, session, router, searchParams]);

  return <p className="text-zinc-500">Authenticating...</p>;
}

export default function Authenticate() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <Suspense fallback={<p className="text-zinc-500">Loading...</p>}>
        <AuthenticateInner />
      </Suspense>
    </div>
  );
}
