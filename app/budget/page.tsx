import { LogOut } from "lucide-react";
import { signOutAction } from "@/app/actions/auth";
import { upsertBudgetAction } from "@/app/actions/finance";
import AppFrame from "@/components/layout/app-frame";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getUserBudgets, getUserExpenses, requireUser, type Category } from "@/lib/ledger";

const CATS: Category[] = ["식비", "주거", "교통", "쇼핑", "여가", "기타"];

export default async function BudgetPage() {
  const { user } = await requireUser();
  const [expenses, budgets] = await Promise.all([getUserExpenses(user.id), getUserBudgets(user.id)]);

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const monthlyExpenses = expenses.filter((e) => new Date(e.created_at) >= monthStart && e.amount < 0);

  const budgetMap = new Map(budgets.map((b) => [b.category, b.monthly_limit]));

  return (
    <AppFrame
      title="예산"
      subtitle="카테고리별 월 예산을 설정하고 사용률을 추적하세요."
      right={<form action={signOutAction}><Button type="submit" variant="outline"><LogOut className="h-4 w-4" />로그아웃</Button></form>}
    >
      <Card>
        <CardHeader><CardTitle>예산 설정</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {CATS.map((cat) => {
              const used = monthlyExpenses.filter((e) => e.category === cat).reduce((s, e) => s + -e.amount, 0);
              const limit = budgetMap.get(cat) ?? 0;
              const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;

              return (
                <form key={cat} action={upsertBudgetAction} className="rounded-md border border-border/60 p-3">
                  <input type="hidden" name="category" value={cat} />
                  <div className="mb-2 flex items-center justify-between">
                    <Label>{cat}</Label>
                    <span className="text-xs text-muted-foreground">사용 {used.toLocaleString("ko-KR")}원</span>
                  </div>
                  <Input name="monthly_limit" type="number" min="0" step="1000" defaultValue={limit} placeholder="월 예산" required />
                  <div className="mt-2 h-2 rounded bg-secondary"><div className="h-2 rounded bg-primary" style={{ width: `${pct}%` }} /></div>
                  <p className="mt-1 text-xs text-muted-foreground">{pct}% 소진</p>
                  <Button type="submit" className="mt-2" size="sm">저장</Button>
                </form>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </AppFrame>
  );
}
