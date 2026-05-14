"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/ledger";

const CATEGORIES: Category[] = ["식비", "주거", "교통", "쇼핑", "여가", "수입", "기타"];

function mustUserId() {
  return async () => {
    const supabase = createSupabaseServerClient();
    if (!supabase) throw new Error("Supabase 환경변수가 필요합니다.");
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("로그인이 필요합니다.");
    return { supabase, userId: user.id };
  };
}

export async function addTransactionAction(formData: FormData) {
  const { supabase, userId } = await mustUserId()();
  const description = String(formData.get("description") ?? "").trim();
  const amount = Number(formData.get("amount") ?? 0);
  const date = String(formData.get("date") ?? "").trim();
  const type = String(formData.get("type") ?? "expense");
  const category = String(formData.get("category") ?? "기타");

  if (!description || !amount || Number.isNaN(amount)) throw new Error("유효한 거래 정보를 입력하세요.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("유효한 날짜를 입력하세요.");
  if (type !== "income" && type !== "expense") throw new Error("유형이 올바르지 않습니다.");
  if (!CATEGORIES.includes(category as Category)) throw new Error("카테고리가 올바르지 않습니다.");
  if (type === "income" && category !== "수입") throw new Error("수입 유형은 수입 카테고리만 선택할 수 있습니다.");
  if (type === "expense" && category === "수입") throw new Error("지출 유형은 수입 카테고리를 선택할 수 없습니다.");

  const absolute = Math.abs(amount);
  const primary = await supabase.from("expenses").insert({
    user_id: userId,
    description,
    amount: absolute,
    tx_type: type,
    category,
    created_at: `${date}T12:00:00.000Z`,
  });

  if (primary.error) {
    const legacy = await supabase.from("expenses").insert({
      user_id: userId,
      description: `[${category}] ${description}`,
      amount: absolute,
      created_at: `${date}T12:00:00.000Z`,
    });
    if (legacy.error) throw new Error(legacy.error.message);
  }

  revalidatePath("/");
  revalidatePath("/transactions");
  revalidatePath("/budget");
  revalidatePath("/analytics");
}

export async function deleteTransactionAction(formData: FormData) {
  const { supabase, userId } = await mustUserId()();
  const id = Number(formData.get("id") ?? 0);
  if (!id) throw new Error("삭제할 거래가 올바르지 않습니다.");

  const { error } = await supabase.from("expenses").delete().eq("id", id).eq("user_id", userId);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/transactions");
  revalidatePath("/budget");
  revalidatePath("/analytics");
}

export async function updateTransactionAction(formData: FormData) {
  const { supabase, userId } = await mustUserId()();
  const id = Number(formData.get("id") ?? 0);
  const description = String(formData.get("description") ?? "").trim();
  const amount = Number(formData.get("amount") ?? 0);
  const date = String(formData.get("date") ?? "").trim();
  const type = String(formData.get("type") ?? "expense");
  const category = String(formData.get("category") ?? "기타");

  if (!id) throw new Error("수정할 거래가 올바르지 않습니다.");
  if (!description || !amount || Number.isNaN(amount)) throw new Error("유효한 거래 정보를 입력하세요.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("유효한 날짜를 입력하세요.");
  if (type !== "income" && type !== "expense") throw new Error("유형이 올바르지 않습니다.");
  if (!CATEGORIES.includes(category as Category)) throw new Error("카테고리가 올바르지 않습니다.");
  if (type === "income" && category !== "수입") throw new Error("수입 유형은 수입 카테고리만 선택할 수 있습니다.");
  if (type === "expense" && category === "수입") throw new Error("지출 유형은 수입 카테고리를 선택할 수 없습니다.");

  const absolute = Math.abs(amount);
  const primary = await supabase
    .from("expenses")
    .update({
      description,
      amount: absolute,
      tx_type: type,
      category,
      created_at: `${date}T12:00:00.000Z`,
    })
    .eq("id", id)
    .eq("user_id", userId);

  if (primary.error) {
    const legacy = await supabase
      .from("expenses")
      .update({
        description: `[${category}] ${description}`,
        amount: absolute,
        created_at: `${date}T12:00:00.000Z`,
      })
      .eq("id", id)
      .eq("user_id", userId);
    if (legacy.error) throw new Error(legacy.error.message);
  }

  revalidatePath("/");
  revalidatePath("/transactions");
  revalidatePath("/budget");
  revalidatePath("/analytics");
}

export async function upsertBudgetAction(formData: FormData) {
  const { supabase, userId } = await mustUserId()();
  const category = String(formData.get("category") ?? "").trim();
  const monthlyLimit = Number(formData.get("monthly_limit") ?? 0);

  if (!category || !monthlyLimit || Number.isNaN(monthlyLimit)) throw new Error("유효한 예산 정보를 입력하세요.");

  const { error } = await supabase.from("budgets").upsert(
    { user_id: userId, category, monthly_limit: monthlyLimit },
    { onConflict: "user_id,category" }
  );
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/budget");
}

export async function addGoalAction(formData: FormData) {
  const { supabase, userId } = await mustUserId()();
  const title = String(formData.get("title") ?? "").trim();
  const targetAmount = Number(formData.get("target_amount") ?? 0);
  const currentAmount = Number(formData.get("current_amount") ?? 0);
  const dueDateRaw = String(formData.get("due_date") ?? "").trim();

  if (!title || !targetAmount || Number.isNaN(targetAmount)) throw new Error("유효한 목표 정보를 입력하세요.");

  const { error } = await supabase.from("goals").insert({
    user_id: userId,
    title,
    target_amount: targetAmount,
    current_amount: Number.isNaN(currentAmount) ? 0 : currentAmount,
    due_date: dueDateRaw || null,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/goals");
}

export async function updateGoalProgressAction(formData: FormData) {
  const { supabase, userId } = await mustUserId()();
  const id = Number(formData.get("id") ?? 0);
  const currentAmount = Number(formData.get("current_amount") ?? 0);
  if (!id || Number.isNaN(currentAmount)) throw new Error("유효한 목표 정보가 아닙니다.");

  const { error } = await supabase
    .from("goals")
    .update({ current_amount: currentAmount })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);

  revalidatePath("/goals");
}

export async function deleteGoalAction(formData: FormData) {
  const { supabase, userId } = await mustUserId()();
  const id = Number(formData.get("id") ?? 0);
  if (!id) throw new Error("삭제할 목표가 올바르지 않습니다.");

  const { error } = await supabase.from("goals").delete().eq("id", id).eq("user_id", userId);
  if (error) throw new Error(error.message);

  revalidatePath("/goals");
}
