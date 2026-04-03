import { NextResponse } from 'next/server';
import { createInsForgeClient } from '@/lib/insforge';

async function getInsforge() {
  try {
    return await createInsForgeClient();
  } catch {
    return null;
  }
}

export async function GET() {
  const insforge = await getInsforge();
  if (!insforge) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await insforge.database
    .from('todos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const insforge = await getInsforge();
  if (!insforge) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { title } = await request.json();
  const { data, error } = await insforge.database
    .from('todos')
    .insert({ title })
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
  const insforge = await getInsforge();
  if (!insforge) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, title, is_complete } = await request.json();
  const updates: Record<string, unknown> = {};
  if (title !== undefined) updates.title = title;
  if (is_complete !== undefined) updates.is_complete = is_complete;

  const { data, error } = await insforge.database
    .from('todos')
    .update(updates)
    .eq('id', id)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const insforge = await getInsforge();
  if (!insforge) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await request.json();
  const { error } = await insforge.database
    .from('todos')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
