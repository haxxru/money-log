import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type Category = "식비" | "주거" | "교통" | "쇼핑" | "여가" | "수입" | "기타";

export type Expense = {
  id: number;
  user_id: string;
  description: string;
  amount: number;
  tx_type: "income" | "expense";
  category: Category;
  created_at: string;
};

function parseLegacyDescription(description: string) {
  const m = description.match(/^\[(식비|주거|교통|쇼핑|여가|수입|기타)\]\s*(.*)$/);
  if (!m) return { category: null as Category | null, name: description };
  return { category: m[1] as Category, name: m[2] || description };
}

export type UserProfile = {
  user_id: string;
  nickname: string;
  initial_balance: number;
  salary_day: number;
  salary_amount: number;
  created_at?: string;
};

export type Budget = {
  id: number;
  user_id: string;
  category: Category;
  monthly_limit: number;
};

export type Goal = {
  id: number;
  user_id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  due_date: string | null;
  created_at: string;
};

export function detectCategory(name: string): Category {
  if (/월급|급여|입금|수입|페이/.test(name)) return "수입";
  if (/식|카페|커피|편의점|점심|저녁/.test(name)) return "식비";
  if (/월세|전기|수도|가스|관리/.test(name)) return "주거";
  if (/지하철|버스|택시|교통/.test(name)) return "교통";
  if (/쇼핑|쿠팡|올리브영|마켓/.test(name)) return "쇼핑";
  if (/영화|넷플릭스|여가|게임/.test(name)) return "여가";
  return "기타";
}

export async function requireUser() {
  const supabase = createSupabaseServerClient();
  if (!supabase) redirect("/login?error=config");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return { supabase, user };
}

export async function getUserExpenses(userId: string): Promise<Expense[]> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return [];

  const nextQuery = await supabase
    .from("expenses")
    .select("id, user_id, description, amount, tx_type, category, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const rows = nextQuery.error
    ? (
      await supabase
        .from("expenses")
        .select("id, user_id, description, amount, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
    )
    : nextQuery;

  if (rows.error) throw new Error(rows.error.message);

  return (rows.data ?? []).map((raw) => {
    const row = raw as {
      id: number;
      user_id: string;
      description: string;
      amount: number;
      tx_type?: string;
      category?: string;
      created_at: string;
    };
    const legacy = parseLegacyDescription(row.description);
    const txType =
      row.tx_type === "income" || row.tx_type === "expense"
        ? row.tx_type
        : legacy.category === "수입"
          ? "income"
          : "expense";
    const category = (row.category as Category) || legacy.category || (txType === "income" ? "수입" : detectCategory(row.description));
    const normalizedAmount = txType === "income" ? Math.abs(Number(row.amount)) : -Math.abs(Number(row.amount));
    return { ...row, description: legacy.name, amount: normalizedAmount, tx_type: txType, category };
  });
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("user_profiles")
    .select("user_id, nickname, initial_balance, salary_day, salary_amount, created_at")
    .eq("user_id", userId)
    .single();

  if (error) return null;
  return data;
}

export async function getUserBudgets(userId: string): Promise<Budget[]> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("budgets")
    .select("id, user_id, category, monthly_limit")
    .eq("user_id", userId)
    .order("category", { ascending: true });

  if (error) return [];
  return data ?? [];
}

export async function getUserGoals(userId: string): Promise<Goal[]> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("goals")
    .select("id, user_id, title, target_amount, current_amount, due_date, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data ?? [];
}

export async function ensureCurrentMonthSalary(userId: string) {
  const supabase = createSupabaseServerClient();
  if (!supabase) return;

  const profile = await getUserProfile(userId);
  if (!profile || !profile.salary_amount || !profile.salary_day) return;

  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const lastDay = new Date(y, m + 1, 0).getDate();
  const day = Math.max(1, Math.min(profile.salary_day, lastDay));
  const salaryDate = new Date(y, m, day);

  // 가입한 달에는 "월급일 < 가입일"이면 자동 월급을 생성하지 않는다.
  if (profile.created_at) {
    const joinedAt = new Date(profile.created_at);
    const sameYearMonth = joinedAt.getFullYear() === y && joinedAt.getMonth() === m;
    if (sameYearMonth && salaryDate < joinedAt) return;
  }

  if (now < salaryDate) return;

  const dateKey = salaryDate.toISOString().slice(0, 10);
  const salaryDesc = `월급 자동 입금 ${dateKey}`;

  const existsNext = await supabase
    .from("expenses")
    .select("id")
    .eq("user_id", userId)
    .eq("tx_type", "income")
    .eq("category", "수입")
    .eq("created_at", `${dateKey}T09:00:00.000Z`)
    .maybeSingle();

  const existsLegacy = existsNext.error
    ? await supabase
      .from("expenses")
      .select("id")
      .eq("user_id", userId)
      .eq("description", `[수입] ${salaryDesc}`)
      .eq("created_at", `${dateKey}T09:00:00.000Z`)
      .maybeSingle()
    : existsNext;

  if (existsLegacy.data) return;

  const primaryInsert = await supabase.from("expenses").insert({
    user_id: userId,
    description: salaryDesc,
    amount: Math.abs(profile.salary_amount),
    tx_type: "income",
    category: "수입",
    created_at: `${dateKey}T09:00:00.000Z`,
  });

  if (!primaryInsert.error) return;

  await supabase.from("expenses").insert({
    user_id: userId,
    description: `[수입] ${salaryDesc}`,
    amount: Math.abs(profile.salary_amount),
    created_at: `${dateKey}T09:00:00.000Z`,
  });
}
