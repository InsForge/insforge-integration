import { withAuth, signOut } from '@workos-inc/authkit-nextjs';
import { redirect } from 'next/navigation';
import TodoList from './todo-list';

export default async function Home() {
  const { user } = await withAuth();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-xl flex-col gap-8 py-16 px-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
            My Todos
          </h1>
          <div className="flex items-center gap-4">
            <p className="text-sm text-zinc-500">{user.email}</p>
            <form action={async () => {
              'use server';
              await signOut();
            }}>
              <button
                type="submit"
                className="text-sm text-red-400 hover:text-red-600"
              >
                Log out
              </button>
            </form>
          </div>
        </div>

        <TodoList />
      </main>
    </div>
  );
}
