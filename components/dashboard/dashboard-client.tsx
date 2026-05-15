"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownRight,
  ArrowUpRight,
  Plus,
  TrendingUp,
  Wallet,
  PiggyBank,
  CreditCard,
  Coffee,
  ShoppingBag,
  Bus,
  Home,
  Film,
  Utensils,
  MoreHorizontal,
  Search,
  Download,
  Pencil,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from "recharts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { addTransactionAction, deleteTransactionAction, updateTransactionAction } from "@/app/actions/finance";

type Cat = "식비" | "주거" | "교통" | "쇼핑" | "여가" | "수입" | "기타";

type Tx = {
  id: string;
  name: string;
  cat: Cat;
  amount: number;
  date: string;
};

type Props = {
  nickname: string;
  tx: Tx[];
  initialBalance: number;
};

const CATS: Cat[] = ["식비", "주거", "교통", "쇼핑", "여가", "수입", "기타"];

const CAT_COLOR: Record<Cat, string> = {
  식비: "oklch(0.62 0.22 280)",
  주거: "oklch(0.55 0.2 295)",
  교통: "oklch(0.72 0.16 165)",
  쇼핑: "oklch(0.78 0.15 75)",
  여가: "oklch(0.6 0.18 220)",
  수입: "oklch(0.7 0.16 145)",
  기타: "oklch(0.6 0.04 275)",
};

const CAT_ICON: Record<Cat, React.ElementType> = {
  식비: Utensils,
  주거: Home,
  교통: Bus,
  쇼핑: ShoppingBag,
  여가: Film,
  수입: ArrowDownRight,
  기타: Coffee,
};

type Budget = { name: Cat; total: number };
const initialBudgets: Budget[] = [
  { name: "식비", total: 800000 },
  { name: "쇼핑", total: 350000 },
  { name: "교통", total: 250000 },
  { name: "여가", total: 200000 },
];

type Period = "1W" | "1M" | "3M" | "1Y";
const PERIODS: { v: Period; label: string; days: number; bucketDays: number }[] = [
  { v: "1W", label: "1주", days: 7, bucketDays: 1 },
  { v: "1M", label: "1개월", days: 30, bucketDays: 5 },
  { v: "3M", label: "3개월", days: 90, bucketDays: 15 },
  { v: "1Y", label: "1년", days: 365, bucketDays: 30 },
];

const krw = (n: number) => `₩${Math.abs(n).toLocaleString("ko-KR")}`;
const isInitialBalanceTx = (name: string) => name === "초기 잔액" || name === "[수입] 초기 잔액";
const digitsOnly = (value: string) => value.replace(/[^\d]/g, "");

function percentChange(current: number, previous: number) {
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

function formatDelta(change: number | null) {
  if (change === null) return { text: "데이터 없음", positive: true, hasData: false };
  const rounded = Math.abs(change).toFixed(1);
  return { text: `${change >= 0 ? "+" : "-"}${rounded}%`, positive: change >= 0, hasData: true };
}

export default function DashboardClient({ nickname, tx, initialBalance }: Props) {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Tx[]>(tx);
  const [budgets, setBudgets] = useState<Budget[]>(initialBudgets);
  const [query, setQuery] = useState("");
  const [filterCat, setFilterCat] = useState<"all" | Cat>("all");
  const [period, setPeriod] = useState<Period>("1M");
  const [addOpen, setAddOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  useEffect(() => {
    setTransactions(tx);
  }, [tx]);

  const today = useMemo(() => new Date(), []);

  const filteredTx = useMemo(() => {
    const q = query.trim().toLowerCase();
    return transactions
      .filter((t) => (filterCat === "all" ? true : t.cat === filterCat))
      .filter((t) => (q ? t.name.toLowerCase().includes(q) || t.cat.toLowerCase().includes(q) : true))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, query, filterCat]);

  const periodMeta = PERIODS.find((p) => p.v === period)!;
  const operationalTransactions = useMemo(
    () => transactions.filter((t) => !isInitialBalanceTx(t.name)),
    [transactions]
  );

  const trendData = useMemo(() => {
    const cutoff = new Date(today);
    cutoff.setDate(cutoff.getDate() - periodMeta.days);
    const buckets = Math.ceil(periodMeta.days / periodMeta.bucketDays);
    const arr = Array.from({ length: buckets }, (_, i) => ({
      d: `${(buckets - i) * periodMeta.bucketDays}일전`,
      수입: 0,
      지출: 0,
    }));
    for (const t of operationalTransactions) {
      const td = new Date(t.date);
      if (td < cutoff) continue;
      const diffDays = Math.floor((today.getTime() - td.getTime()) / 86400000);
      const idx = Math.min(buckets - 1, buckets - 1 - Math.floor(diffDays / periodMeta.bucketDays));
      if (t.amount > 0) arr[idx].수입 += t.amount;
      else arr[idx].지출 += -t.amount;
    }
    return arr.map((a, i) => ({ ...a, d: i === arr.length - 1 ? "현재" : a.d }));
  }, [operationalTransactions, periodMeta, today]);

  const monthSpend = useMemo(() => {
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
    return operationalTransactions.filter((t) => t.date >= monthStart && t.amount < 0).reduce((s, t) => s + -t.amount, 0);
  }, [operationalTransactions, today]);

  const monthIncome = useMemo(() => {
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
    return operationalTransactions.filter((t) => t.date >= monthStart && t.amount > 0).reduce((s, t) => s + t.amount, 0);
  }, [operationalTransactions, today]);

  const categoryData = useMemo(() => {
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
    const map = new Map<Cat, number>();
    for (const t of operationalTransactions) {
      if (t.date < monthStart || t.amount >= 0) continue;
      map.set(t.cat, (map.get(t.cat) ?? 0) + -t.amount);
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value, color: CAT_COLOR[name] }));
  }, [operationalTransactions, today]);

  const totalSpent = categoryData.reduce((s, c) => s + c.value, 0);
  const balance = useMemo(
    () => initialBalance + operationalTransactions.reduce((sum, item) => sum + item.amount, 0),
    [initialBalance, operationalTransactions]
  );
  const savings = Math.max(0, monthIncome - monthSpend);

  const budgetWithUsage = useMemo(() => {
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
    return budgets.map((b) => {
      const used = transactions
        .filter((t) => !isInitialBalanceTx(t.name))
        .filter((t) => t.cat === b.name && t.date >= monthStart && t.amount < 0)
        .reduce((s, t) => s + -t.amount, 0);
      return { ...b, used, color: CAT_COLOR[b.name] };
    });
  }, [budgets, transactions, today]);

  const savingTip = useMemo(() => {
    if (monthSpend <= 0) {
      return "아직 이번 달 지출이 없어요. 첫 거래를 입력하면 맞춤 절약 팁을 보여드릴게요.";
    }

    const overBudget = budgetWithUsage
      .filter((b) => b.total > 0 && b.used > b.total)
      .sort((a, b) => b.used - b.total - (a.used - a.total))[0];
    if (overBudget) {
      const over = overBudget.used - overBudget.total;
      return `${overBudget.name} 예산을 ₩${over.toLocaleString("ko-KR")} 초과했어요. 이번 주 ${overBudget.name} 지출 상한을 낮춰보세요.`;
    }

    const topCategory = categoryData
      .filter((c) => c.name !== "수입")
      .sort((a, b) => b.value - a.value)[0];
    if (topCategory && totalSpent > 0) {
      const ratio = Math.round((topCategory.value / totalSpent) * 100);
      return `이번 달 ${topCategory.name} 지출 비중이 ${ratio}%로 가장 커요. 다음 결제 전 필요 여부를 한 번 더 확인해보세요.`;
    }

    if (monthIncome > 0) {
      const remain = Math.max(0, monthIncome - monthSpend);
      return `이번 달 예상 잔여 여력은 ₩${remain.toLocaleString("ko-KR")}입니다. 고정지출을 제외한 금액을 먼저 분리해보세요.`;
    }

    return "최근 거래 데이터를 바탕으로 절약 패턴을 분석 중입니다.";
  }, [monthSpend, budgetWithUsage, categoryData, totalSpent, monthIncome]);

  const spendRatioText = useMemo(() => {
    if (monthIncome <= 0) return "이번 달 수입 데이터가 없어 지출 비율을 계산할 수 없어요.";
    const ratio = Math.round((monthSpend / monthIncome) * 100);
    if (!Number.isFinite(ratio) || ratio > 999) return "이번 달 지출이 수입 대비 매우 큰 상태예요. 지출 점검이 필요해요.";
    return `이번 달 지출은 ${ratio}% — 잘 관리하고 계세요.`;
  }, [monthIncome, monthSpend]);

  const monthStartDate = useMemo(() => new Date(today.getFullYear(), today.getMonth(), 1), [today]);
  const prevMonthStartDate = useMemo(() => new Date(today.getFullYear(), today.getMonth() - 1, 1), [today]);
  const prevMonthEndDate = monthStartDate;

  const prevMonthIncome = useMemo(
    () =>
      operationalTransactions
        .filter((t) => {
          const d = new Date(t.date);
          return d >= prevMonthStartDate && d < prevMonthEndDate && t.amount > 0;
        })
        .reduce((s, t) => s + t.amount, 0),
    [operationalTransactions, prevMonthStartDate, prevMonthEndDate]
  );

  const prevMonthSpend = useMemo(
    () =>
      operationalTransactions
        .filter((t) => {
          const d = new Date(t.date);
          return d >= prevMonthStartDate && d < prevMonthEndDate && t.amount < 0;
        })
        .reduce((s, t) => s + -t.amount, 0),
    [operationalTransactions, prevMonthStartDate, prevMonthEndDate]
  );

  const prevMonthSavings = Math.max(0, prevMonthIncome - prevMonthSpend);
  const prevMonthBalance = useMemo(
    () =>
      initialBalance +
      operationalTransactions
        .filter((t) => new Date(t.date) < monthStartDate)
        .reduce((s, t) => s + t.amount, 0),
    [initialBalance, operationalTransactions, monthStartDate]
  );

  const balanceDelta = formatDelta(percentChange(balance, prevMonthBalance));
  const incomeDelta = formatDelta(percentChange(monthIncome, prevMonthIncome));
  const spendDeltaRaw = percentChange(monthSpend, prevMonthSpend);
  const spendDelta = spendDeltaRaw === null ? { text: "데이터 없음", positive: true, hasData: false } : formatDelta(-spendDeltaRaw);
  const savingsDelta = formatDelta(percentChange(savings, prevMonthSavings));

  const handleSaveBudget = (name: Cat, total: number) => {
    setBudgets((prev) => prev.map((b) => (b.name === name ? { ...b, total } : b)));
    setEditingBudget(null);
  };

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-8 md:py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{today.getFullYear()}년 {today.getMonth() + 1}월</p>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight md:text-3xl">안녕하세요, {nickname}님 👋</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {spendRatioText}
          </p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <button
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
              style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
            >
              <Plus className="h-4 w-4" /> 거래 추가
            </button>
          </DialogTrigger>
          <AddTxDialog onSubmitted={() => setAddOpen(false)} />
        </Dialog>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="잔액" value={krw(balance)} delta={balanceDelta.text} positive={balanceDelta.positive} hasDeltaData={balanceDelta.hasData} icon={Wallet} gradient />
        <StatCard label="이번 달 수입" value={krw(monthIncome)} delta={incomeDelta.text} positive={incomeDelta.positive} hasDeltaData={incomeDelta.hasData} icon={TrendingUp} />
        <StatCard label="이번 달 지출" value={krw(monthSpend)} delta={spendDelta.text} positive={spendDelta.positive} hasDeltaData={spendDelta.hasData} icon={CreditCard} />
        <StatCard label="저축" value={krw(savings)} delta={savingsDelta.text} positive={savingsDelta.positive} hasDeltaData={savingsDelta.hasData} icon={PiggyBank} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border/60 bg-surface p-5 lg:col-span-2" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">현금 흐름</h2>
              <p className="text-xs text-muted-foreground">{periodMeta.label} 동안 수입과 지출 추이</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden gap-2 text-xs sm:flex">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> 수입</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-warning" /> 지출</span>
              </div>
              <div className="flex rounded-full border border-border/60 bg-background/40 p-0.5">
                {PERIODS.map((p) => (
                  <button
                    key={p.v}
                    onClick={() => setPeriod(p.v)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                      period === p.v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.62 0.22 280)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="oklch(0.62 0.22 280)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.78 0.15 75)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="oklch(0.78 0.15 75)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="d" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                    color: "var(--popover-foreground)",
                  }}
                  formatter={(v: number) => krw(v)}
                  labelStyle={{ color: "var(--foreground)" }}
                />
                <Area type="monotone" dataKey="수입" stroke="oklch(0.62 0.22 280)" strokeWidth={2.5} fill="url(#g1)" />
                <Area type="monotone" dataKey="지출" stroke="oklch(0.78 0.15 75)" strokeWidth={2.5} fill="url(#g2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-surface p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <h2 className="text-base font-semibold">카테고리별 지출</h2>
          <p className="text-xs text-muted-foreground">이번 달 비중</p>
          <div className="relative mx-auto mt-2 h-44 w-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} dataKey="value" innerRadius={56} outerRadius={84} paddingAngle={3} stroke="none">
                  {categoryData.map((c, i) => (
                    <Cell key={i} fill={c.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">총 지출</span>
              <span className="text-lg font-semibold tabular">{krw(totalSpent)}</span>
            </div>
          </div>
          <ul className="mt-4 space-y-2.5">
            {categoryData.map((c) => (
              <li key={c.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                  <span>{c.name}</span>
                </span>
                <span className="tabular text-muted-foreground">{krw(c.value)}</span>
              </li>
            ))}
            {categoryData.length === 0 && <li className="text-center text-xs text-muted-foreground">이번 달 지출이 없습니다</li>}
          </ul>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border/60 bg-surface p-5 lg:col-span-2" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">거래 내역</h2>
              <p className="text-xs text-muted-foreground">{filteredTx.length}건</p>
            </div>
            <a
              href="/api/transactions/export?format=xlsx"
              className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/40 px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
            >
              <Download className="h-3.5 w-3.5" /> 엑셀 내보내기
            </a>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <div className="relative min-w-[180px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="거래 검색…"
                className="w-full rounded-full border border-border/60 bg-background/40 py-2 pl-9 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <Select value={filterCat} onValueChange={(v) => setFilterCat(v as "all" | Cat)}>
              <SelectTrigger className="w-[140px] rounded-full border-border/60 bg-background/40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 카테고리</SelectItem>
                {CATS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ul className="mt-4 divide-y divide-border/60">
            {filteredTx.slice(0, 10).map((t) => {
              const Icon = CAT_ICON[t.cat];
              const positive = t.amount > 0;
              return (
                <li key={t.id} className="flex items-center gap-4 py-3.5">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-background/60 ring-1 ring-border/60">
                    <Icon className={`h-4 w-4 ${positive ? "text-success" : "text-muted-foreground"}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.cat} · {t.date}</p>
                  </div>
                  <span className={`tabular text-sm font-semibold ${positive ? "text-success" : ""}`}>
                    {positive ? "+" : "-"}
                    {krw(t.amount)}
                  </span>
                  <TxManageDialog tx={t} />
                </li>
              );
            })}
            {filteredTx.length === 0 && <li className="py-8 text-center text-sm text-muted-foreground">검색 결과가 없습니다</li>}
          </ul>
        </div>

        <div className="rounded-2xl border border-border/60 bg-surface p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">예산 현황</h2>
            <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success">정상</span>
          </div>
          <p className="text-xs text-muted-foreground">카테고리별 소진율 — 클릭하여 수정</p>
          <div className="mt-5 space-y-5">
            {budgetWithUsage.map((b) => {
              const pct = Math.min(100, Math.round((b.used / b.total) * 100));
              const over = b.used > b.total;
              return (
                <button key={b.name} onClick={() => setEditingBudget({ name: b.name, total: b.total })} className="block w-full rounded-xl p-2 text-left transition hover:bg-background/50">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 font-medium">
                      {b.name}
                      <Pencil className="h-3 w-3 text-muted-foreground/60" />
                    </span>
                    <span className="tabular text-muted-foreground">
                      {krw(b.used)} <span className="text-muted-foreground/60">/ {krw(b.total)}</span>
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-background/70">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        background: over
                          ? "linear-gradient(90deg, var(--destructive), oklch(0.7 0.22 22))"
                          : `linear-gradient(90deg, ${b.color}, oklch(0.62 0.22 280))`,
                      }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
                    <span>{pct}% 소진</span>
                    <span className="tabular">{over ? `초과 ${krw(b.used - b.total)}` : `남은 ${krw(b.total - b.used)}`}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-6 rounded-xl border border-border/60 bg-background/50 p-4">
            <p className="text-xs font-semibold text-primary">💡 절약 팁</p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {savingTip}
            </p>
          </div>
        </div>
      </div>

      <EditBudgetDialog budget={editingBudget} onClose={() => setEditingBudget(null)} onSave={handleSaveBudget} />
    </div>
  );
}

function TxManageDialog({ tx }: { tx: Tx }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"expense" | "income">(tx.amount > 0 ? "income" : "expense");
  const [cat, setCat] = useState<Cat>(tx.amount > 0 ? "수입" : tx.cat);

  const submitUpdate = async (formData: FormData) => {
    setOpen(false);
    await updateTransactionAction(formData);
    router.refresh();
  };

  const submitDelete = async (formData: FormData) => {
    setOpen(false);
    await deleteTransactionAction(formData);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="text-muted-foreground hover:text-foreground">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>거래 관리</DialogTitle>
          <DialogDescription>거래를 수정하거나 삭제할 수 있습니다.</DialogDescription>
        </DialogHeader>
        <form action={submitUpdate} className="space-y-3">
          <input type="hidden" name="id" value={tx.id} />
          <input type="hidden" name="category" value={type === "income" ? "수입" : cat} />
          <div>
            <Label htmlFor={`edit-name-${tx.id}`}>내용</Label>
            <Input id={`edit-name-${tx.id}`} name="description" defaultValue={tx.name} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor={`edit-amount-${tx.id}`}>금액</Label>
              <Input id={`edit-amount-${tx.id}`} name="amount" type="number" min="1" step="1" defaultValue={Math.abs(tx.amount)} required />
            </div>
            <div>
              <Label htmlFor={`edit-date-${tx.id}`}>날짜</Label>
              <Input id={`edit-date-${tx.id}`} name="date" type="date" defaultValue={tx.date} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor={`edit-type-${tx.id}`}>유형</Label>
              <select
                id={`edit-type-${tx.id}`}
                name="type"
                defaultValue={type}
                onChange={(e) => setType(e.target.value as "income" | "expense")}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              >
                <option value="expense">지출</option>
                <option value="income">수입</option>
              </select>
            </div>
            <div>
              <Label htmlFor={`edit-category-${tx.id}`}>카테고리</Label>
              <select
                id={`edit-category-${tx.id}`}
                value={type === "income" ? "수입" : cat}
                onChange={(e) => setCat(e.target.value as Cat)}
                disabled={type === "income"}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm disabled:opacity-70"
              >
                {CATS.filter((c) => (type === "income" ? c === "수입" : c !== "수입")).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button type="submit" className="flex-1">수정 저장</Button>
            <Button formAction={submitDelete} type="submit" variant="destructive" className="flex-1">
              삭제
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function StatCard({
  label,
  value,
  delta,
  positive,
  hasDeltaData = true,
  icon: Icon,
  gradient,
}: {
  label: string;
  value: string;
  delta: string;
  positive?: boolean;
  hasDeltaData?: boolean;
  icon: React.ElementType;
  gradient?: boolean;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-border/60 p-5"
      style={{
        background: gradient ? "var(--gradient-primary)" : "var(--surface)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {gradient && <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-white/10 blur-3xl" />}
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium ${gradient ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{label}</span>
        <div className={`grid h-8 w-8 place-items-center rounded-lg ${gradient ? "bg-white/15" : "bg-background/60"}`}>
          <Icon className={`h-4 w-4 ${gradient ? "text-primary-foreground" : "text-muted-foreground"}`} />
        </div>
      </div>
      <div className={`tabular mt-4 text-2xl font-semibold tracking-tight ${gradient ? "text-primary-foreground" : ""}`}>{value}</div>
      <div className={`mt-1 flex items-center gap-1 text-xs ${gradient ? "text-primary-foreground/85" : !hasDeltaData ? "text-muted-foreground" : positive ? "text-success" : "text-destructive"}`}>
        {hasDeltaData ? (positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />) : null}
        <span className="tabular">{delta}</span>
        <span className={gradient ? "text-primary-foreground/70" : "text-muted-foreground"}>{hasDeltaData ? "지난달 대비" : ""}</span>
      </div>
    </div>
  );
}

function AddTxDialog({ onSubmitted }: { onSubmitted: () => void }) {
  const router = useRouter();
  const [type, setType] = useState<"expense" | "income">("expense");
  const [name, setName] = useState("");
  const [cat, setCat] = useState<Cat>("식비");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const submitAdd = async (formData: FormData) => {
    onSubmitted();
    await addTransactionAction(formData);
    router.refresh();
  };

  return (
    <DialogContent className="sm:max-w-[440px]">
      <DialogHeader>
        <DialogTitle>거래 추가</DialogTitle>
        <DialogDescription>새로운 수입 또는 지출을 기록하세요.</DialogDescription>
      </DialogHeader>
      <form action={submitAdd} className="space-y-4">
        <input type="hidden" name="type" value={type} />
        <input type="hidden" name="category" value={type === "income" ? "수입" : cat} />
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
          {(["expense", "income"] as const).map((t) => (
            <button key={t} type="button" onClick={() => setType(t)} className={`rounded-lg py-2 text-sm font-medium transition ${type === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>
              {t === "expense" ? "지출" : "수입"}
            </button>
          ))}
        </div>
        <div>
          <Label htmlFor="tx-name">내용</Label>
          <Input id="tx-name" name="description" value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 스타벅스 강남점" maxLength={100} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="tx-amount">금액 (₩)</Label>
            <Input
              id="tx-amount"
              name="amount"
              inputMode="numeric"
              type="text"
              value={amount}
              onChange={(e) => {
                const raw = digitsOnly(e.target.value);
                setAmount(raw ? Number(raw).toLocaleString("ko-KR") : "");
              }}
              placeholder="10,000"
              required
            />
          </div>
          <div>
            <Label htmlFor="tx-date">날짜</Label>
            <Input id="tx-date" name="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
        </div>
        {type === "expense" && (
          <div>
            <Label>카테고리</Label>
            <Select value={cat} onValueChange={(v) => setCat(v as Cat)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATS.filter((c) => c !== "수입").map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <DialogFooter>
          <Button type="submit" className="w-full">
            추가하기
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function EditBudgetDialog({
  budget,
  onClose,
  onSave,
}: {
  budget: Budget | null;
  onClose: () => void;
  onSave: (name: Cat, total: number) => void;
}) {
  const [val, setVal] = useState("");
  return (
    <Dialog open={!!budget} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{budget?.name} 예산 수정</DialogTitle>
          <DialogDescription>월 예산 한도를 설정하세요.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Label htmlFor="bgt">월 예산 (₩)</Label>
          <Input id="bgt" inputMode="numeric" defaultValue={budget?.total ?? 0} onChange={(e) => setVal(e.target.value)} placeholder="0" />
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button
            onClick={() => {
              const n = Number((val || String(budget?.total ?? 0)).replace(/[^0-9]/g, ""));
              if (budget && n > 0) onSave(budget.name, n);
            }}
          >
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
