import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import CurrencyInput from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  mode: "login" | "signup";
  action: (formData: FormData) => Promise<void>;
  errorMessage?: string;
};

export default function AuthShell({ mode, action, errorMessage }: Props) {
  const isSignup = mode === "signup";

  return (
    <div className="relative grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block" style={{ background: "var(--gradient-primary)" }}>
        <div className="absolute -left-20 top-1/3 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-10 h-[28rem] w-[28rem] rounded-full bg-white/10 blur-3xl" />
        <div className="relative z-10 flex h-full flex-col justify-between p-12 text-primary-foreground">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 overflow-hidden rounded-full ring-1 ring-white/20">
              <Image src="/logo.png" alt="머니로그 로고" width={40} height={40} className="h-full w-full object-cover" />
            </div>
            <div>
              <p className="text-sm font-semibold">머니로그</p>
              <p className="text-[11px] opacity-70">Personal Ledger</p>
            </div>
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-semibold leading-tight tracking-tight">
              돈의 흐름이 보이면
              <br />
              인생이 가벼워집니다.
            </h2>
            <p className="max-w-sm text-sm opacity-80">매일의 작은 거래부터 월 예산까지, 머니로그가 한눈에 정리해드려요.</p>
          </div>
          <div className="flex items-center gap-3 text-xs opacity-70">
            <span>© 2026 머니로그</span>
            <span>·</span>
            <span>개인정보 처리방침</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <Card className="w-full max-w-sm border-border/60 bg-card/90 backdrop-blur">
          <CardHeader>
            <CardDescription>{isSignup ? "Get started" : "Welcome back"}</CardDescription>
            <CardTitle className="text-2xl">{isSignup ? "계정 만들기" : "다시 만나서 반가워요"}</CardTitle>
            <p className="text-sm text-muted-foreground">{isSignup ? "이메일로 30초 만에 시작하세요." : "이메일로 로그인하세요."}</p>
          </CardHeader>
          <CardContent>
            {errorMessage ? (
              <p className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {errorMessage}
              </p>
            ) : null}
            <form action={action} className="space-y-4">
              {isSignup ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="nickname">이름</Label>
                    <Input id="nickname" name="nickname" placeholder="홍길동" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="initial_balance">현재 잔액 (원)</Label>
                    <CurrencyInput id="initial_balance" name="initial_balance" placeholder="5,000,000" required />
                  </div>
                </>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="email" name="email" type="email" placeholder="you@example.com" required className="pl-9" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">비밀번호</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="password" name="password" type="password" placeholder="8자 이상" required minLength={6} className="pl-9" />
                </div>
              </div>
              <Button type="submit" className="w-full" style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}>
                {isSignup ? "계정 만들기" : "로그인"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              {isSignup ? (
                <>
                  이미 계정이 있나요? <Link href="/login" className="text-primary hover:underline">로그인</Link>
                </>
              ) : (
                <>
                  계정이 없나요? <Link href="/signup" className="text-primary hover:underline">회원가입</Link>
                </>
              )}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
