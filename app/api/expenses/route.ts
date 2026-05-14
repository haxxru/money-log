import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Missing Supabase environment variables." }, { status: 500 });
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const nextQuery = await supabase
    .from("expenses")
    .select("id, user_id, description, amount, tx_type, category, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const rows = nextQuery.error
    ? await supabase
      .from("expenses")
      .select("id, user_id, description, amount, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
    : nextQuery;

  if (rows.error) {
    return NextResponse.json({ error: rows.error.message }, { status: 500 });
  }

  const total = (rows.data ?? []).reduce((sum, item) => sum + Number(item.amount), 0);

  return NextResponse.json({ expenses: rows.data ?? [], total });
}

export async function POST(req: Request) {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Missing Supabase environment variables." }, { status: 500 });
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const description = String(body.description ?? "").trim();
  const amount = Number(body.amount);
  const txType = String(body.tx_type ?? "expense");
  const category = String(body.category ?? "기타");

  if (!description || Number.isNaN(amount) || amount <= 0) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  if (txType !== "income" && txType !== "expense") {
    return NextResponse.json({ error: "Invalid tx_type" }, { status: 400 });
  }
  if (txType === "income" && category !== "수입") {
    return NextResponse.json({ error: "Income must use 수입 category" }, { status: 400 });
  }

  const absolute = Math.abs(amount);
  const primary = await supabase
    .from("expenses")
    .insert({ user_id: user.id, description, amount: absolute, tx_type: txType, category })
    .select("id, user_id, description, amount, tx_type, category, created_at")
    .single();

  if (primary.error) {
    const legacy = await supabase
      .from("expenses")
      .insert({ user_id: user.id, description: `[${category}] ${description}`, amount: absolute })
      .select("id, user_id, description, amount, created_at")
      .single();
    if (legacy.error) {
      return NextResponse.json({ error: legacy.error.message }, { status: 500 });
    }
    return NextResponse.json({ expense: legacy.data }, { status: 201 });
  }

  return NextResponse.json({ expense: primary.data }, { status: 201 });
}
