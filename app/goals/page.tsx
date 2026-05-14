import { LogOut, Trash2 } from "lucide-react";
import { signOutAction } from "@/app/actions/auth";
import { addGoalAction, deleteGoalAction, updateGoalProgressAction } from "@/app/actions/finance";
import AppFrame from "@/components/layout/app-frame";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getUserGoals, requireUser } from "@/lib/ledger";

export default async function GoalsPage() {
  const { user } = await requireUser();
  const goals = await getUserGoals(user.id);

  return (
    <AppFrame
      title="목표"
      subtitle="저축 목표를 생성하고 달성률을 관리하세요."
      right={<form action={signOutAction}><Button type="submit" variant="outline"><LogOut className="h-4 w-4" />로그아웃</Button></form>}
    >
      <Card>
        <CardHeader><CardTitle>목표 추가</CardTitle></CardHeader>
        <CardContent>
          <form action={addGoalAction} className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div>
              <Label htmlFor="title">목표명</Label>
              <Input id="title" name="title" placeholder="비상금 500만원" required />
            </div>
            <div>
              <Label htmlFor="target_amount">목표금액</Label>
              <Input id="target_amount" name="target_amount" type="number" min="1" step="1000" required />
            </div>
            <div>
              <Label htmlFor="current_amount">현재금액</Label>
              <Input id="current_amount" name="current_amount" type="number" min="0" step="1000" defaultValue={0} />
            </div>
            <div>
              <Label htmlFor="due_date">목표일</Label>
              <Input id="due_date" name="due_date" type="date" />
            </div>
            <div className="md:col-span-4">
              <Button type="submit">목표 저장</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="mt-6 space-y-4">
        {goals.map((g) => {
          const pct = g.target_amount > 0 ? Math.min(100, Math.round((g.current_amount / g.target_amount) * 100)) : 0;
          return (
            <Card key={g.id}>
              <CardHeader><CardTitle className="text-base">{g.title}</CardTitle></CardHeader>
              <CardContent>
                <p className="mb-2 text-sm text-muted-foreground">달성률 {pct}% · {g.current_amount.toLocaleString("ko-KR")} / {g.target_amount.toLocaleString("ko-KR")}원</p>
                <div className="mb-3 h-2 rounded bg-secondary"><div className="h-2 rounded bg-primary" style={{ width: `${pct}%` }} /></div>
                <div className="flex flex-wrap gap-2">
                  <form action={updateGoalProgressAction} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={g.id} />
                    <Input name="current_amount" type="number" min="0" step="1000" defaultValue={g.current_amount} className="w-44" />
                    <Button type="submit" size="sm">진행률 저장</Button>
                  </form>
                  <form action={deleteGoalAction}>
                    <input type="hidden" name="id" value={g.id} />
                    <Button type="submit" variant="ghost" size="icon"><Trash2 className="h-4 w-4" /></Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AppFrame>
  );
}
