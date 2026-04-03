import { SignIn, SignUp } from '@clerk/clerk-react';

export function SignInPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-5xl justify-center px-6 py-10">
        <SignIn routing="path" path="/sign-in" />
      </div>
    </div>
  );
}

export function SignUpPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-5xl justify-center px-6 py-10">
        <SignUp routing="path" path="/sign-up" />
      </div>
    </div>
  );
}

