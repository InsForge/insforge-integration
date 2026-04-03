"use client";

import { useUser } from "@auth0/nextjs-auth0/client";
import { useState, useEffect, useCallback } from "react";
import { ThemeSwitcher } from "@/components/theme-switcher";

interface Todo {
  id: string; // uuid
  user_id: string;
  title: string;
  is_complete: boolean;
  created_at: string;
}

export default function Home() {
  const { user, error, isLoading } = useUser();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchTodos = useCallback(async () => {
    const res = await fetch("/api/todos");
    if (res.ok) {
      const data = await res.json();
      setTodos(data);
    }
  }, []);

  useEffect(() => {
    if (user) fetchTodos();
  }, [user, fetchTodos]);

  async function addTodo(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setLoading(true);
    await fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle.trim() }),
    });
    setNewTitle("");
    await fetchTodos();
    setLoading(false);
  }

  async function toggleTodo(id: string, is_complete: boolean) {
    await fetch("/api/todos", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_complete: !is_complete }),
    });
    await fetchTodos();
  }

  async function deleteTodo(id: string) {
    await fetch("/api/todos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await fetchTodos();
  }

  async function updateTodo(id: string) {
    if (!editTitle.trim()) return;
    await fetch("/api/todos", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, title: editTitle.trim() }),
    });
    setEditingId(null);
    setEditTitle("");
    await fetchTodos();
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[var(--muted-foreground)]">Loading...</p>
      </div>
    );
  }

  if (!user || error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6">
        <h1 className="text-3xl font-bold text-[var(--foreground)]">Todo List</h1>
        <p className="text-[var(--muted-foreground)]">Sign in to manage your todos</p>
        <a
          href="/auth/login"
          className="rounded-md bg-[var(--foreground)] px-6 py-2.5 text-sm font-medium text-[var(--surface)] hover:opacity-90 transition"
        >
          Sign in
        </a>
        <div className="fixed bottom-4 right-4">
          <ThemeSwitcher />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Todo List</h1>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--muted-foreground)]">
              {user.name || user.email}
            </span>
            <a
              href="/auth/logout"
              className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
            >
              Logout
            </a>
            <ThemeSwitcher />
          </div>
        </div>

        <form onSubmit={addTodo} className="flex gap-2 mb-6">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Add a new todo..."
            className="flex-1 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none focus:border-[var(--foreground)]"
          />
          <button
            type="submit"
            disabled={loading || !newTitle.trim()}
            className="rounded-md bg-[var(--foreground)] px-4 py-2 text-sm font-medium text-[var(--surface)] hover:opacity-90 transition disabled:opacity-50"
          >
            Add
          </button>
        </form>

        {todos.length === 0 ? (
          <p className="text-center text-sm text-[var(--muted-foreground)] py-8">
            No todos yet. Add one above!
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {todos.map((todo) => (
              <li
                key={todo.id}
                className="flex items-center gap-3 rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
              >
                <button
                  onClick={() => toggleTodo(todo.id, todo.is_complete)}
                  className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition ${
                    todo.is_complete
                      ? "bg-[var(--foreground)] border-[var(--foreground)]"
                      : "border-[var(--border)] hover:border-[var(--muted-foreground)]"
                  }`}
                >
                  {todo.is_complete && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--surface)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>

                {editingId === todo.id ? (
                  <form
                    onSubmit={(e) => { e.preventDefault(); updateTodo(todo.id); }}
                    className="flex-1 flex gap-2"
                  >
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      autoFocus
                      className="flex-1 rounded border border-[var(--border)] bg-[var(--surface-muted)] px-2 py-1 text-sm text-[var(--foreground)] outline-none"
                    />
                    <button type="submit" className="text-xs text-[var(--foreground)] hover:underline">Save</button>
                    <button type="button" onClick={() => setEditingId(null)} className="text-xs text-[var(--muted-foreground)] hover:underline">Cancel</button>
                  </form>
                ) : (
                  <>
                    <span className={`flex-1 text-sm ${todo.is_complete ? "line-through text-[var(--muted-foreground)]" : "text-[var(--foreground)]"}`}>
                      {todo.title}
                    </span>
                    <button
                      onClick={() => { setEditingId(todo.id); setEditTitle(todo.title); }}
                      className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteTodo(todo.id)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
