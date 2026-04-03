'use client';

import { useStytch, useStytchSession, useStytchUser } from '@stytch/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import AddTodo from './add-todo';
import TodoItem from './todo-item';

interface Todo {
  id: string;
  title: string;
  is_complete: boolean;
}

export default function Home() {
  const stytch = useStytch();
  const { session, isInitialized } = useStytchSession();
  const { user } = useStytchUser();
  const router = useRouter();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTodos = useCallback(async () => {
    const res = await fetch('/api/todos');
    const data = await res.json();
    if (Array.isArray(data)) {
      setTodos(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    if (!session) {
      router.replace('/login');
      return;
    }
    fetchTodos();
  }, [isInitialized, session, router, fetchTodos]);

  async function handleLogout() {
    await stytch.session.revoke();
    router.replace('/login');
  }

  if (!isInitialized || !session || loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-xl flex-col gap-8 py-16 px-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
            My Todos
          </h1>
          <div className="flex items-center gap-4">
            <p className="text-sm text-zinc-500">{user?.emails?.[0]?.email}</p>
            <button
              onClick={handleLogout}
              className="text-sm text-red-400 hover:text-red-600"
            >
              Log out
            </button>
          </div>
        </div>

        <AddTodo onAdded={fetchTodos} />

        <ul className="flex flex-col gap-2">
          {todos.length > 0 ? (
            todos.map((todo) => (
              <TodoItem key={todo.id} todo={todo} onChanged={fetchTodos} />
            ))
          ) : (
            <p className="text-zinc-500">No todos yet.</p>
          )}
        </ul>
      </main>
    </div>
  );
}
