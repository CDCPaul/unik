import type { Metadata } from 'next';

/**
 * /profile/* 전용 미니멀 레이아웃.
 * (public) 그룹의 Navbar/Footer/AnalyticsListener/Theme 컨텍스트를 의도적으로 제외해
 * NFC 로 진입한 사용자가 깔끔한 명함 한 화면만 보도록 한다.
 */

export const metadata: Metadata = {
  robots: { index: false, follow: false }, // 내부 명함 — 검색 인덱싱 차단
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
