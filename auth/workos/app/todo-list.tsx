'use client';

import { useEffect, useState, useCallback } from 'react';
import AddTodo from './add-todo';
import TodoItem from './todo-item';

interface Todo {
  id: string;
  title: string;
  is_complete: boolean;
}

export default function TodoList() {
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
    fetchTodos();
  }, [fetchTodos]);

  if (loading) {
    return <p className="text-zinc-500">Loading...</p>;
  }

  return (
    <>
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
    </>
  );
}
