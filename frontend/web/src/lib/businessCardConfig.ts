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

  /** vCard ADR;TYPE=WORK 와 페이지 하단에 표시되는 회사 주소 */
  address:
    'Unit 09-11, Phase 2 Gaisano Mactan Island Mall, M.L. Quezon National Highway, Pajo, Lapu-Lapu City, Cebu 6015, Philippines',

  /** 회사 대표 사무실 전화 — 모든 직원 명함에 공통으로 표시 */
  officePhone: '+63 32 345 8908',

  /** vCard URL 필드 */
  website: 'https://unik.ph',

  /** 페이지 상단에 표시되는 회사 로고 (public/ 기준 경로) */
  logoUrl: '/cebu-direct-logo.jpg',

  /** 명함 페이지에 노출되는 회사 대표 이메일 */
  representativeEmail: 'ticket@cebudirectclub.com',
} as const;

export type CompanyInfo = typeof COMPANY_INFO;
