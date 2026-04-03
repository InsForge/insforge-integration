import { NextRequest, NextResponse } from "next/server";
import { createInsForgeClient } from "@/lib/insforge";

export async function GET() {
  const insforge = await createInsForgeClient();
  const { data, error } = await insforge.database
    .from("todos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const { title } = await req.json();
  const insforge = await createInsForgeClient();
  const { data, error } = await insforge.database
    .from("todos")
    .insert({ title, is_complete: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, ...updates } = body;
  const insforge = await createInsForgeClient();
  const { data, error } = await insforge.database
    .from("todos")
    .update(updates)
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  const insforge = await createInsForgeClient();
  const { data, error } = await insforge.database
    .from("todos")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
