'use client';

import { SignedIn, UserButton, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';
import { TodosDisplay } from '@/components/todos-display';

export default function HomePage() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="auth-callback-spinner" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6">
        <h1 className="text-3xl font-bold text-[var(--fg)]">Todo List</h1>
        <p className="text-[var(--fg-muted)]">Sign in to manage your todos</p>
        <Link
          href="/sign-in"
          className="rounded-md bg-[var(--btn-primary-bg)] px-6 py-2.5 text-sm font-medium text-[var(--btn-primary-fg)] hover:bg-[var(--btn-primary-hover)] transition"
        >
          Sign in
        </Link>
        <div className="fixed bottom-4 right-4">
          <ThemeToggle />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-[var(--fg)]">Todo List</h1>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--fg-muted)]">
              {user.fullName || user.primaryEmailAddress?.emailAddress}
            </span>
            <UserButton />
            <ThemeToggle />
          </div>
        </div>

        <SignedIn>
          <TodosDisplay />
        </SignedIn>
      </div>
    </div>
  );
}
