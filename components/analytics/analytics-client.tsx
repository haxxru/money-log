"use client";

import { Area, AreaChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  trendData: Array<{ label: string; value: number }>;
  categoryData: Array<{ name: string; value: number }>;
};

const COLORS = ["#6D63FF", "#8A5CF6", "#14B8A6", "#F4B339", "#0EA5E9", "#64748B"];

export default function AnalyticsClient({ trendData, categoryData }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
      <Card>
        <CardHeader><CardTitle>현금 흐름</CardTitle></CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <XAxis dataKey="label" />
                <YAxis tickFormatter={(v) => `${Math.round(v / 10000)}만`} />
                <Tooltip formatter={(v: number) => `₩${Math.round(v).toLocaleString("ko-KR")}`} />
                <Area dataKey="value" stroke="#6D63FF" fill="#6D63FF33" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>카테고리 비중</CardTitle></CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={70} outerRadius={105}>
                  {categoryData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => `₩${Math.round(v).toLocaleString("ko-KR")}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
