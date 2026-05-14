import { LogOut } from "lucide-react";
import { signOutAction } from "@/app/actions/auth";
import AppFrame from "@/components/layout/app-frame";
import AnalyticsClient from "@/components/analytics/analytics-client";
import { Button } from "@/components/ui/button";
import { getUserExpenses, requireUser } from "@/lib/ledger";

function daysAgo(dateStr: string) {
  const d = new Date(dateStr);
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

export default async function AnalyticsPage() {
  const { user } = await requireUser();
  const expenses = await getUserExpenses(user.id);

  const monthly = expenses.filter((e) => daysAgo(e.created_at) <= 30);

  const categoryMap = new Map<string, number>();
  monthly.forEach((e) => {
    if (e.amount >= 0) return;
    categoryMap.set(e.category, (categoryMap.get(e.category) ?? 0) + -e.amount);
  });

  const categoryData = Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }));

  const trendBase = Array.from({ length: 6 }, (_, i) => ({ label: `${30 - i * 5}일전`, value: 0 }));
  monthly.forEach((e) => {
    if (e.amount >= 0) return;
    const idx = Math.min(5, Math.floor(daysAgo(e.created_at) / 5));
    trendBase[5 - idx].value += -e.amount;
  });
  trendBase[5].label = "현재";

  return (
    <AppFrame
      title="분석"
      subtitle="월간 지출 패턴과 카테고리 비중을 시각화합니다."
      right={<form action={signOutAction}><Button type="submit" variant="outline"><LogOut className="h-4 w-4" />로그아웃</Button></form>}
    >
      <AnalyticsClient trendData={trendBase} categoryData={categoryData} />
    </AppFrame>
  );
}
