import { LogOut } from "lucide-react";
import { signOutAction } from "@/app/actions/auth";
import { updateSalarySettingsAction } from "@/app/actions/finance";
import AppFrame from "@/components/layout/app-frame";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CurrencyInput from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getUserProfile, requireUser } from "@/lib/ledger";

export default async function SettingsPage() {
  const { user } = await requireUser();
  const profile = await getUserProfile(user.id);

  return (
    <AppFrame
      title="설정"
      subtitle="정기적인 급여 정보를 설정합니다."
      right={<form action={signOutAction}><Button type="submit" variant="outline"><LogOut className="h-4 w-4" />로그아웃</Button></form>}
    >
      <Card>
        <CardHeader>
          <CardTitle>정기적인 급여</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateSalarySettingsAction} className="grid grid-cols-1 gap-4 md:max-w-xl md:grid-cols-2">
            <div>
              <Label htmlFor="salary_day">월급일 (일)</Label>
              <Input id="salary_day" name="salary_day" type="number" min="1" max="31" defaultValue={profile?.salary_day ?? 25} required />
            </div>
            <div>
              <Label htmlFor="salary_amount">월급액 (원)</Label>
              <CurrencyInput id="salary_amount" name="salary_amount" defaultValue={profile?.salary_amount ?? 0} required />
            </div>
            <div className="md:col-span-2">
              <Button type="submit">급여 설정 저장</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AppFrame>
  );
}
