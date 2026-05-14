import { LogOut } from "lucide-react";
import { signOutAction } from "@/app/actions/auth";
import AppFrame from "@/components/layout/app-frame";
import { Button } from "@/components/ui/button";
import DashboardClient from "@/components/dashboard/dashboard-client";
import { ensureCurrentMonthSalary, getUserExpenses, getUserProfile, requireUser } from "@/lib/ledger";

export default async function Home() {
  const { user } = await requireUser();
  await ensureCurrentMonthSalary(user.id);
  const [expenses, profile] = await Promise.all([getUserExpenses(user.id), getUserProfile(user.id)]);
  const nickname = String(profile?.nickname ?? user.user_metadata?.nickname ?? "서연");
  const initialBalance = Number(profile?.initial_balance ?? user.user_metadata?.initial_balance ?? 0);

  const tx = expenses.map((e) => ({
    id: String(e.id),
    name: e.description,
    cat: e.category,
    amount: e.amount,
    date: new Date(e.created_at).toISOString().slice(0, 10),
  }));

  return (
    <AppFrame
      title="대시보드"
      subtitle="이번 달 수입·지출·예산을 한눈에 보는 가계부 대시보드."
      right={
        <form action={signOutAction}>
          <Button type="submit" variant="outline">
            <LogOut className="h-4 w-4" />로그아웃
          </Button>
        </form>
      }
    >
      <DashboardClient nickname={nickname} tx={tx} initialBalance={initialBalance} />
    </AppFrame>
  );
}
