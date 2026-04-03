'use client';

import { StytchProvider } from '@stytch/nextjs';
import { createStytchUIClient } from '@stytch/nextjs';

const stytch = createStytchUIClient(
  process.env.NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN!
);

export default function StytchProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StytchProvider stytch={stytch}>{children}</StytchProvider>;
}
