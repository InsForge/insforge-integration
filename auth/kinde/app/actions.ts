'use server';

import { createInsForgeClient } from '@/lib/insforge';
import { revalidatePath } from 'next/cache';

export async function addTodo(formData: FormData) {
  const title = formData.get('title') as string;
  if (!title?.trim()) return;

  const insforge = await createInsForgeClient();
  await insforge.database.from('todos').insert([{ title: title.trim() }]);
  revalidatePath('/');
}

export async function toggleTodo(id: string, is_complete: boolean) {
  const insforge = await createInsForgeClient();
  await insforge.database
    .from('todos')
    .update({ is_complete: !is_complete })
    .eq('id', id);
  revalidatePath('/');
}

export async function deleteTodo(id: string) {
  const insforge = await createInsForgeClient();
  await insforge.database.from('todos').delete().eq('id', id);
  revalidatePath('/');
}

export async function updateTodo(id: string, title: string) {
  if (!title?.trim()) return;
  const insforge = await createInsForgeClient();
  await insforge.database
    .from('todos')
    .update({ title: title.trim() })
    .eq('id', id);
  revalidatePath('/');
}
