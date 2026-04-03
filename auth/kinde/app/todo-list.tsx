'use client';

import { useState } from 'react';
import { addTodo, toggleTodo, deleteTodo, updateTodo } from './actions';

interface Todo {
  id: string;
  title: string;
  is_complete: boolean;
  created_at: string;
}

export function TodoList({ todos }: { todos: Todo[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  function startEdit(todo: Todo) {
    setEditingId(todo.id);
    setEditTitle(todo.title);
  }

  async function saveEdit(id: string) {
    await updateTodo(id, editTitle);
    setEditingId(null);
  }

  return (
    <div className="w-full max-w-xl mx-auto">
      <form action={addTodo} className="flex gap-2 mb-6">
        <input
          name="title"
          type="text"
          placeholder="Add a new todo..."
          required
          className="flex-1 rounded-lg border border-zinc-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
        <button
          type="submit"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Add
        </button>
      </form>

      {todos.length === 0 ? (
        <p className="text-center text-zinc-500 py-8">No todos yet. Add one above!</p>
      ) : (
        <ul className="space-y-2">
          {todos.map((todo) => (
            <li
              key={todo.id}
              className="flex items-center gap-3 rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-700"
            >
              <button
                onClick={() => toggleTodo(todo.id, todo.is_complete)}
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                  todo.is_complete
                    ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                    : 'border-zinc-300 dark:border-zinc-600'
                }`}
              >
                {todo.is_complete && (
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>

              {editingId === todo.id ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveEdit(todo.id);
                  }}
                  className="flex flex-1 gap-2"
                >
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="flex-1 rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                    autoFocus
                  />
                  <button type="submit" className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400">
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="text-sm text-zinc-400 hover:text-zinc-600"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <>
                  <span
                    className={`flex-1 text-sm ${
                      todo.is_complete ? 'text-zinc-400 line-through' : 'text-zinc-900 dark:text-zinc-100'
                    }`}
                  >
                    {todo.title}
                  </span>
                  <button
                    onClick={() => startEdit(todo)}
                    className="text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="text-sm text-red-400 hover:text-red-600"
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
  );
}
