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
      : searchParams?.error === "invalid_credentials"
        ? "이메일 또는 비밀번호가 올바르지 않습니다."
        : searchParams?.error
          ? decodeURIComponent(searchParams.error)
      : undefined;

  return <AuthShell mode="login" action={signInAction} errorMessage={errorMessage} />;
}
