/**
 * 모바일 명함(/profile/[slug]) 공통 회사 정보.
 *
 * 모든 직원 명함에 공통으로 표시·삽입되는 값입니다.
 * 회사 정보가 바뀌면 이 파일만 수정하면 모든 명함에 즉시 반영됩니다.
 *
 * 직원 개별 정보(이름/연락처 등)는 Firestore + /admin/business-cards 에서 관리합니다.
 */

export const COMPANY_INFO = {
  /** vCard ORG 필드, 페이지 헤더에 표시 */
  name: 'Cebu Direct Club',

  /** 명함 상단 브랜드 밴드에 표시되는 문구 (대문자로 렌더링됨) */
  brandLine: 'CDC Travel & Tours',

  /** vCard ADR;TYPE=WORK 와 페이지 하단에 표시되는 회사 주소 */
  address:
    'Unit 09-11, Phase 2 Gaisano Mactan Island Mall, M.L. Quezon National Highway, Pajo, Lapu-Lapu City, Cebu 6015, Philippines',

  /** 회사 대표 사무실 전화 — 모든 직원 명함에 공통으로 표시 */
  officePhone: '+63 32 345 8908',

  /** vCard URL 필드 */
  website: 'https://unik.ph',

  /** 밝은 배경용 회사 로고 — 짙은 틸 선 / 흰 배경 (public/ 기준 경로) */
  logoUrl: '/cebu-direct-logo.jpg',

  /** 브랜드 컬러·사진 위에 얹는 흰색 선 로고 (배경 투명). 명함 히어로에서 사용. */
  logoWhiteUrl: '/cdc-logo-white.png',

  /** 명함 페이지에 노출되는 회사 대표 이메일 */
  representativeEmail: 'ticket@cebudirectclub.com',
} as const;

export type CompanyInfo = typeof COMPANY_INFO;
