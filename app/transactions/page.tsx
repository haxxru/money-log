import { LogOut, Save, Trash2 } from "lucide-react";
import { signOutAction } from "@/app/actions/auth";
import { addTransactionAction, deleteTransactionAction, updateTransactionAction } from "@/app/actions/finance";
import AppFrame from "@/components/layout/app-frame";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CurrencyInput from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getUserExpenses, requireUser, type Category } from "@/lib/ledger";

const krw = (n: number) => `₩${Math.abs(n).toLocaleString("ko-KR")}`;
const CATS: Category[] = ["식비", "주거", "교통", "쇼핑", "여가", "수입", "기타"];

type SearchParams = { [key: string]: string | string[] | undefined };

function readOne(params: SearchParams, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function TransactionsPage({ searchParams }: { searchParams?: SearchParams }) {
  const { user } = await requireUser();
  const expenses = await getUserExpenses(user.id);
  const importStatus = readOne(searchParams ?? {}, "import");
  const inserted = Number(readOne(searchParams ?? {}, "inserted") ?? 0);
  const skipped = Number(readOne(searchParams ?? {}, "skipped") ?? 0);

  const importMessage =
    importStatus === "ok"
      ? `가져오기 완료: ${inserted}건 저장, ${skipped}건 건너뜀`
      : importStatus === "none"
        ? `가져오기 결과: 저장된 데이터 없음 (${skipped}건 건너뜀)`
        : importStatus === "empty"
          ? "업로드 파일이 비어 있습니다."
          : importStatus === "file_missing"
            ? "업로드할 파일을 선택해 주세요."
            : importStatus === "sheet_missing"
              ? "시트를 찾을 수 없는 파일입니다."
              : importStatus === "env_error"
                ? "Supabase 환경변수 오류로 가져오기에 실패했습니다."
                : null;

  return (
    <AppFrame
      title="거래 내역"
      subtitle="거래를 추가/조회/삭제할 수 있습니다."
      right={
        <form action={signOutAction}>
          <Button type="submit" variant="outline"><LogOut className="h-4 w-4" />로그아웃</Button>
        </form>
      }
    >
      <Card>
        <CardHeader><CardTitle>거래 추가</CardTitle></CardHeader>
        <CardContent>
          <form action={addTransactionAction} className="grid grid-cols-1 gap-3 md:grid-cols-[2fr_1fr_1fr_1fr_auto]">
            <div>
              <Label htmlFor="description">내용</Label>
              <Input id="description" name="description" placeholder="예: 스타벅스 강남점" required />
            </div>
            <div>
              <Label htmlFor="category">카테고리</Label>
              <select id="category" name="category" className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
                {CATS.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="amount">금액</Label>
              <CurrencyInput id="amount" name="amount" min={1} placeholder="10,000" required />
            </div>
            <div>
              <Label htmlFor="date">날짜</Label>
              <Input id="date" name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
            </div>
            <div>
              <Label htmlFor="type">유형</Label>
              <select id="type" name="type" className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
                <option value="expense">지출</option>
                <option value="income">수입</option>
              </select>
            </div>
            <div className="md:col-span-5">
              <Button type="submit">거래 저장</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader><CardTitle>전체 거래 {expenses.length}건</CardTitle></CardHeader>
        <CardContent>
          <div className="mb-4 grid gap-3 rounded-lg border border-border/60 bg-muted/20 p-3 md:grid-cols-[1fr_auto_auto] md:items-end">
            <form action="/api/transactions/import" method="post" encType="multipart/form-data" className="grid gap-2">
              <Label htmlFor="import-file">CSV/XLSX 가져오기</Label>
              <Input id="import-file" name="file" type="file" accept=".csv,.xlsx,.xls" required />
              <Button type="submit" size="sm" className="w-fit">가져오기 실행</Button>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>템플릿:</span>
                <a href="/templates/transactions-template.csv" className="underline underline-offset-2">CSV</a>
                <a href="/templates/transactions-template.xlsx" className="underline underline-offset-2">XLSX</a>
              </div>
            </form>
            <a href="/api/transactions/export?format=csv" className="inline-flex h-9 items-center justify-center rounded-md border border-input px-3 text-sm">
              CSV 내보내기
            </a>
            <a href="/api/transactions/export?format=xlsx" className="inline-flex h-9 items-center justify-center rounded-md border border-input px-3 text-sm">
              XLSX 내보내기
            </a>
          </div>
          {importMessage && <p className="mb-4 text-xs text-muted-foreground">{importMessage}</p>}

          <div className="space-y-2">
            {expenses.map((e) => {
              const type = e.amount > 0 ? "income" : "expense";
              return (
                <div key={e.id} className="rounded-md border border-border/60 p-3 text-sm">
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto_auto] md:items-end">
                    <form action={updateTransactionAction} className="contents">
                      <input type="hidden" name="id" value={e.id} />
                      <div>
                        <Label className="mb-1 block text-xs text-muted-foreground">내용</Label>
                        <Input name="description" defaultValue={e.description} required />
                      </div>
                      <div>
                        <Label className="mb-1 block text-xs text-muted-foreground">카테고리</Label>
                        <select name="category" defaultValue={e.category} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
                          {CATS.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label className="mb-1 block text-xs text-muted-foreground">금액</Label>
                        <Input name="amount" type="number" min="1" step="1" defaultValue={Math.abs(e.amount)} required />
                      </div>
                      <div>
                        <Label className="mb-1 block text-xs text-muted-foreground">날짜</Label>
                        <Input name="date" type="date" defaultValue={new Date(e.created_at).toISOString().slice(0, 10)} required />
                      </div>
                      <div>
                        <Label className="mb-1 block text-xs text-muted-foreground">유형</Label>
                        <select name="type" defaultValue={type} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
                          <option value="expense">지출</option>
                          <option value="income">수입</option>
                        </select>
                      </div>
                      <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
                        <span>{new Date(e.created_at).toLocaleDateString("ko-KR")}</span>
                        <strong className={e.amount > 0 ? "text-emerald-400" : ""}>{e.amount > 0 ? "+" : "-"}{krw(e.amount)}</strong>
                      </div>
                      <div className="flex gap-1">
                        <Button type="submit" size="icon" variant="secondary"><Save className="h-4 w-4" /></Button>
                      </div>
                    </form>
                    <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
                      <span>삭제</span>
                      <form action={deleteTransactionAction}>
                        <input type="hidden" name="id" value={e.id} />
                        <Button type="submit" variant="ghost" size="icon"><Trash2 className="h-4 w-4" /></Button>
                      </form>
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    현재 {e.category} · {type === "income" ? "수입" : "지출"}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </AppFrame>
  );
}
