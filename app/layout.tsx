import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Review Pulse — 앱 리뷰 분석 서비스",
  description: "앱스토어/플레이스토어 리뷰를 수집·분석해 제품팀이 빠르게 인사이트를 얻을 수 있는 서비스",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
        {/* Google Analytics 4 */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-Y8N7MD4ERX" />
        <script dangerouslySetInnerHTML={{ __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-Y8N7MD4ERX');
        `}} />
      </head>
      <body>{children}</body>
    </html>
  );
}
