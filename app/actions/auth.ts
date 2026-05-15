"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function parseAmount(value: FormDataEntryValue | null, fallback = 0) {
  const normalized = String(value ?? "").replace(/[^\d.-]/g, "");
  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? fallback : parsed;
}

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
  const initialBalance = parseAmount(formData.get("initial_balance"), 0);
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!nickname) redirect("/signup?error=nickname");

  const normalizedInitialBalance = Number.isNaN(initialBalance) ? 0 : Math.max(0, Math.floor(initialBalance));

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nickname,
        initial_balance: normalizedInitialBalance,
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
