import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "머니로그 | MONEY LOG",
  description: "지출 내역을 입력하고 합계를 확인하는 앱",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
