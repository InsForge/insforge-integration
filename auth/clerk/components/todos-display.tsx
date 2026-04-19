'use client';

import { useCallback, useEffect, useState } from 'react';
import { useInsforgeClient } from '@/lib/insforge';
import { AddTodoForm } from './add-todo-form';
import { TodoItem, type Todo } from './todo-item';

export function TodosDisplay() {
  const { client: insforge, isReady } = useInsforgeClient();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTodos = useCallback(async () => {
    const { data, error: dbError } = await insforge.database
      .from('todos')
      .select('*')
      .order('created_at', { ascending: false });

    if (dbError) {
      setError(dbError.message ?? 'Failed to load todos');
      return;
    }

    setError(null);
    setTodos((data as Todo[]) ?? []);
  }, [insforge]);

  useEffect(() => {
    if (!isReady) return;
    void (async () => {
      await fetchTodos();
      setIsLoading(false);
    })();
  }, [isReady, fetchTodos]);

  const handleRefresh = useCallback(async () => {
    await fetchTodos();
  }, [fetchTodos]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="auth-callback-spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-red-400">Error loading todos</h3>
              <p className="mt-1 text-sm text-red-300/80">{error}</p>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void handleRefresh()}
          className="app-button app-button--secondary"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AddTodoForm insforge={insforge} onAdded={() => void handleRefresh()} />
      {todos.length > 0 ? (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--muted-foreground)]">
              {todos.length} {todos.length === 1 ? 'todo' : 'todos'}
            </p>
          </div>
          <ul className="space-y-3">
            {todos.map((todo) => (
              <TodoItem key={todo.id} todo={todo} insforge={insforge} onChanged={() => void handleRefresh()} />
            ))}
          </ul>
        </>
      ) : (
        <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-muted)] px-4 py-6 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">
            No todos yet. Add your first todo above!
          </p>
        </div>
      )}
    </div>
  );
}
