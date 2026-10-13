'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { savePromoCode } from '@/lib/promo/storage';
import { browserStore } from '@/lib/store';

/** 어느 공개 페이지든 ?code=XXX 로 들어오면 30일간 기억한다. */
export function PromoCodeCapture() {
  const params = useSearchParams();
  const code = params.get('code');
  useEffect(() => {
    if (code) savePromoCode(browserStore(), code, Date.now());
  }, [code]);
  return null;
}
