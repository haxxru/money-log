import { redirect } from "next/navigation";
import AuthShell from "@/components/auth/auth-shell";
import { signInAction } from "@/app/actions/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type LoginPageProps = {
  searchParams?: {
    error?: string;
  };
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  if (user) {
    redirect("/");
  }

  const errorMessage =
    searchParams?.error === "config"
      ? "Supabase 환경변수가 설정되지 않았습니다. .env.local을 확인해주세요."
      : undefined;

  return <AuthShell mode="login" action={signInAction} errorMessage={errorMessage} />;
}
