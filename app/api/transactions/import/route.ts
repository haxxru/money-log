import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import type { Category } from "@/lib/ledger";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type TxType = "income" | "expense";

const CATEGORIES: Category[] = ["식비", "주거", "교통", "쇼핑", "여가", "수입", "기타"];

function parseAmount(value: unknown) {
  const normalized = String(value ?? "").replace(/[^\d.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function parseTxType(value: unknown): TxType | null {
  const v = String(value ?? "").trim().toLowerCase();
  if (v === "income" || v === "수입") return "income";
  if (v === "expense" || v === "지출") return "expense";
  return null;
}

function parseCategory(value: unknown, txType: TxType): Category | null {
  const v = String(value ?? "").trim() as Category;
  if (!CATEGORIES.includes(v)) return txType === "income" ? "수입" : null;
  if (txType === "income" && v !== "수입") return null;
  if (txType === "expense" && v === "수입") return null;
  return v;
}

function toDateKey(value: unknown) {
  const str = String(value ?? "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const dt = new Date(str);
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toISOString().slice(0, 10);
}

export async function POST(req: Request) {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.redirect(new URL("/transactions?import=env_error", req.url));
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File) || !file.size) {
    return NextResponse.redirect(new URL("/transactions?import=file_missing", req.url));
  }

  const bytes = await file.arrayBuffer();
  const wb = XLSX.read(bytes, { type: "array", cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) return NextResponse.redirect(new URL("/transactions?import=sheet_missing", req.url));

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  if (!rows.length) return NextResponse.redirect(new URL("/transactions?import=empty", req.url));

  let inserted = 0;
  let skipped = 0;
  for (const row of rows) {
    const description = String(row.description ?? row["내용"] ?? "").trim();
    const txType = parseTxType(row.type ?? row["유형"] ?? row.tx_type);
    const date = toDateKey(row.date ?? row["날짜"] ?? row.created_at);
    const amount = parseAmount(row.amount ?? row["금액"]);
    if (!description || !txType || !date || !amount || Number.isNaN(amount)) {
      skipped += 1;
      continue;
    }

    const category = parseCategory(row.category ?? row["카테고리"], txType);
    if (!category) {
      skipped += 1;
      continue;
    }

    const absolute = Math.abs(amount);
    const primary = await supabase.from("expenses").insert({
      user_id: user.id,
      description,
      amount: absolute,
      tx_type: txType,
      category,
      created_at: `${date}T12:00:00.000Z`,
    });

    if (!primary.error) {
      inserted += 1;
      continue;
    }

    const legacy = await supabase.from("expenses").insert({
      user_id: user.id,
      description: `[${category}] ${description}`,
      amount: absolute,
      created_at: `${date}T12:00:00.000Z`,
    });

    if (legacy.error) {
      skipped += 1;
      continue;
    }

    inserted += 1;
  }

  const target = new URL("/transactions", req.url);
  target.searchParams.set("import", inserted > 0 ? "ok" : "none");
  target.searchParams.set("inserted", String(inserted));
  target.searchParams.set("skipped", String(skipped));
  return NextResponse.redirect(target);
}
