import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "2026 서평단 북리뷰",
  description: "모란글샘 독서 서평단 — 우리, 함께, 가치 읽기",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
