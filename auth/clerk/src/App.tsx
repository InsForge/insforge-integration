import { Navigate, Route, Routes } from 'react-router-dom';
import { SignedIn, SignedOut, SignIn, SignUp, UserButton, useUser } from '@clerk/clerk-react';
import './App.css';
import { ThemeToggle } from './components/theme-toggle';
import { TodosDisplay } from './components/todos-display';

function HomePage() {
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
        <a
          href="/sign-in"
          className="rounded-md bg-[var(--btn-primary-bg)] px-6 py-2.5 text-sm font-medium text-[var(--btn-primary-fg)] hover:bg-[var(--btn-primary-hover)] transition"
        >
          Sign in
        </a>
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

function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <SignedIn>
        <Navigate to="/" replace />
      </SignedIn>
      <SignedOut>
        <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" forceRedirectUrl="/" />
      </SignedOut>
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <SignedIn>
        <Navigate to="/" replace />
      </SignedIn>
      <SignedOut>
        <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" forceRedirectUrl="/" />
      </SignedOut>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/sign-in/*" element={<SignInPage />} />
      <Route path="/sign-up/*" element={<SignUpPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
