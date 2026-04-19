import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <SignUp path="/sign-up" signInUrl="/sign-in" forceRedirectUrl="/" />
    </div>
  );
}
