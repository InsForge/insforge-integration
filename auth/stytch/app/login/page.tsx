'use client';

import { Products, StytchLogin } from '@stytch/nextjs';

export default function Login() {
  const config = {
    products: [Products.emailMagicLinks],
    emailMagicLinksOptions: {
      loginRedirectURL: `${typeof window !== 'undefined' ? window.location.origin : ''}/authenticate`,
      loginExpirationMinutes: 30,
      signupRedirectURL: `${typeof window !== 'undefined' ? window.location.origin : ''}/authenticate`,
      signupExpirationMinutes: 30,
    },
  };

  return (
    <div className="flex flex-1 items-center justify-center">
      <StytchLogin config={config} />
    </div>
  );
}
