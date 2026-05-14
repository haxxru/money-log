"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function signInAction(formData: FormData) {
  const supabase = createSupabaseServerClient();
  if (!supabase) redirect("/login?error=config");

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.message.includes("Invalid login credentials")) {
      redirect("/login?error=invalid_credentials");
    }
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  redirect("/");
}

export async function signUpAction(formData: FormData) {
  const supabase = createSupabaseServerClient();
  if (!supabase) redirect("/signup?error=config");

  const nickname = String(formData.get("nickname") ?? "").trim();
  const initialBalance = Number(formData.get("initial_balance") ?? 0);
  const salaryDay = Number(formData.get("salary_day") ?? 25);
  const salaryAmount = Number(formData.get("salary_amount") ?? 0);
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!nickname) redirect("/signup?error=nickname");

  const normalizedInitialBalance = Number.isNaN(initialBalance) ? 0 : Math.max(0, Math.floor(initialBalance));
  const normalizedSalaryDay = Number.isNaN(salaryDay) ? 25 : Math.min(31, Math.max(1, Math.floor(salaryDay)));
  const normalizedSalaryAmount = Number.isNaN(salaryAmount) ? 0 : Math.max(0, Math.floor(salaryAmount));

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nickname,
        initial_balance: normalizedInitialBalance,
        salary_day: normalizedSalaryDay,
        salary_amount: normalizedSalaryAmount,
      }
    }
  });
  if (error) {
    if (error.message.includes("Database error saving new user")) {
      redirect("/signup?error=database_new_user");
    }
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/login");
}

export async function signOutAction() {
  const supabase = createSupabaseServerClient();
  if (!supabase) redirect("/login?error=config");

  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);

  redirect("/login");
}
