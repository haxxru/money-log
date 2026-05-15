import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { detectCategory, type Category } from "@/lib/ledger";

type TxType = "income" | "expense";

function parseLegacyDescription(description: string) {
  const m = description.match(/^\[(식비|주거|교통|쇼핑|여가|수입|기타)\]\s*(.*)$/);
  if (!m) return { category: null as Category | null, name: description };
  return { category: m[1] as Category, name: m[2] || description };
}

function normalizeRow(raw: {
  id: number;
  description: string;
  amount: number;
  tx_type?: string;
  category?: string;
  created_at: string;
}) {
  const legacy = parseLegacyDescription(raw.description);
  const txType: TxType =
    raw.tx_type === "income" || raw.tx_type === "expense"
      ? raw.tx_type
      : legacy.category === "수입"
        ? "income"
        : "expense";
  const category = (raw.category as Category) || legacy.category || (txType === "income" ? "수입" : detectCategory(raw.description));
  return {
    id: raw.id,
    date: new Date(raw.created_at).toISOString().slice(0, 10),
    type: txType === "income" ? "수입" : "지출",
    category,
    description: legacy.name,
    amount: Math.abs(Number(raw.amount)),
  };
}

export async function GET(req: Request) {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Missing Supabase environment variables." }, { status: 500 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const format = url.searchParams.get("format") === "csv" ? "csv" : "xlsx";
  const nextQuery = await supabase
    .from("expenses")
    .select("id, description, amount, tx_type, category, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const rows = nextQuery.error
    ? await supabase
      .from("expenses")
      .select("id, description, amount, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
    : nextQuery;

  if (rows.error) return NextResponse.json({ error: rows.error.message }, { status: 500 });

  const data = (rows.data ?? []).map((row) =>
    normalizeRow(
      row as {
        id: number;
        description: string;
        amount: number;
        tx_type?: string;
        category?: string;
        created_at: string;
      }
    )
  );
  const filenameBase = `transactions-${new Date().toISOString().slice(0, 10)}`;

  if (format === "csv") {
    const header = "id,date,type,category,description,amount";
    const body = data
      .map((r) => [r.id, r.date, r.type, r.category, r.description, r.amount].map((v) => `"${String(v).replace(/"/g, "\"\"")}"`).join(","))
      .join("\n");
    const csv = `\uFEFF${header}\n${body}\n`;
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filenameBase}.csv"`,
      },
    });
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "transactions");
  const xlsxBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(xlsxBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filenameBase}.xlsx"`,
    },
  });
}
