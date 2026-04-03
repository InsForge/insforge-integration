import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { LoginLink, LogoutLink, RegisterLink } from '@kinde-oss/kinde-auth-nextjs/components';
import { createInsForgeClient } from '@/lib/insforge';
import { TodoList } from './todo-list';

export default async function Home() {
  const { isAuthenticated, getUser } = getKindeServerSession();
  const authenticated = await isAuthenticated();
  const user = authenticated ? await getUser() : null;

  if (!authenticated) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-zinc-50 dark:bg-black">
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
          Todo App
        </h1>
        <p className="text-zinc-500">Sign in to manage your todos</p>
        <div className="flex gap-3">
          <LoginLink className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300">
            Sign In
          </LoginLink>
          <RegisterLink className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800">
            Sign Up
          </RegisterLink>
        </div>
      </div>
    );
  }

  const insforge = await createInsForgeClient();
  const { data: todos } = await insforge.database
    .from('todos')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Todo App
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-500">{user?.given_name ?? user?.email}</span>
          <LogoutLink className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800">
            Sign Out
          </LogoutLink>
        </div>
      </header>
      <main className="flex-1 py-8 px-4">
        <TodoList todos={todos ?? []} />
      </main>
    </div>
  );
}
