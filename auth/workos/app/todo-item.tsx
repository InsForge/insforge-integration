'use client';

import { useState } from 'react';

interface Todo {
  id: string;
  title: string;
  is_complete: boolean;
}

export default function TodoItem({ todo, onChanged }: { todo: Todo; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(todo.title);

  async function toggleComplete() {
    await fetch('/api/todos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: todo.id, is_complete: !todo.is_complete }),
    });
    onChanged();
  }

  async function saveEdit() {
    if (!title.trim()) return;
    await fetch('/api/todos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: todo.id, title: title.trim() }),
    });
    setEditing(false);
    onChanged();
  }

  async function deleteTodo() {
    await fetch('/api/todos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: todo.id }),
    });
    onChanged();
  }

  return (
    <li className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
      <input
        type="checkbox"
        checked={todo.is_complete}
        onChange={toggleComplete}
        className="h-4 w-4 shrink-0"
      />

      {editing ? (
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={saveEdit}
          onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
          autoFocus
          className="flex-1 border-b border-zinc-300 bg-transparent text-black outline-none dark:border-zinc-700 dark:text-zinc-50"
        />
      ) : (
        <span
          className={`flex-1 text-black dark:text-zinc-50 ${
            todo.is_complete ? 'line-through text-zinc-400 dark:text-zinc-600' : ''
          }`}
        >
          {todo.title}
        </span>
      )}

      <button
        onClick={() => { setTitle(todo.title); setEditing(!editing); }}
        className="text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
      >
        {editing ? 'Cancel' : 'Edit'}
      </button>
      <button
        onClick={deleteTodo}
        className="text-sm text-red-400 hover:text-red-600"
      >
        Delete
      </button>
    </li>
  );
}
