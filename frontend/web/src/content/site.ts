import { COMPANY_INFO } from '@/lib/businessCardConfig';

export const SITE = {
  name: 'UNIK',
  operator: 'UNIK',
  address: COMPANY_INFO.address,
  phone: COMPANY_INFO.officePhone,
  email: COMPANY_INFO.representativeEmail,
  url: 'https://unik.ph',
} as const;

export const NAV_LINKS = [
  { href: '/seoul-marathon', label: 'Seoul Marathon' },
  { href: '/tour', label: 'The Tour' },
  { href: '/artjoy', label: 'Run with Artjoy' },
  { href: '/faq', label: 'FAQ' },
] as const;

/** 모바일 메뉴에만 더하는 링크 (데스크톱 헤더는 NAV_LINKS 만, 이 링크들은 푸터에 있다) */
export const MOBILE_EXTRA_LINKS = [
  { href: '/past-tours', label: 'Past tours' },
  { href: '/contact', label: 'Contact' },
] as const;

export const FOOTER_LINKS = [
  { href: '/past-tours', label: 'Past tours' },
  { href: '/contact', label: 'Contact' },
  { href: '/terms', label: 'Terms' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/refund-policy', label: 'Refund policy' },
] as const;
