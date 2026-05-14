import { redirect } from "next/navigation";
import AuthShell from "@/components/auth/auth-shell";
import { signUpAction } from "@/app/actions/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SignupPageProps = {
  searchParams?: {
    error?: string;
  };
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
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
      : searchParams?.error === "nickname"
        ? "닉네임을 입력해주세요."
        : searchParams?.error === "database_new_user"
          ? "회원가입 DB 초기화 중 오류가 발생했습니다. Supabase 트리거 SQL을 최신 버전으로 적용해주세요."
          : searchParams?.error
            ? decodeURIComponent(searchParams.error)
      : undefined;

  return <AuthShell mode="signup" action={signUpAction} errorMessage={errorMessage} />;
}
