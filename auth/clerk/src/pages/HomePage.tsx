import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/clerk-react';
import { Link, Navigate } from 'react-router-dom';

export function HomePage() {
  return (
    <>
      <SignedIn>
        <Navigate to="/app" replace />
      </SignedIn>
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <header className="mx-auto flex w-full max-w-4xl items-center justify-between px-6 py-5">
          <Link to="/" className="font-semibold tracking-tight">
            CRM
          </Link>
          <div className="flex items-center gap-3">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="rounded-md bg-slate-800 px-3 py-2 text-sm hover:bg-slate-700">Sign in</button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="rounded-md bg-indigo-600 px-3 py-2 text-sm hover:bg-indigo-500">Sign up</button>
              </SignUpButton>
            </SignedOut>
            <UserButton />
          </div>
        </header>
      </div>
    </>
  );
}

