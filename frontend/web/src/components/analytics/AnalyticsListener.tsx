'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { logEvent } from 'firebase/analytics';
import { initAnalytics } from '@/lib/firebase';

/**
 * Ensures Firebase Analytics is initialized on the client and logs SPA page views.
 * Note: Do NOT include PII (email/phone/name) in params.
 */
export default function AnalyticsListener() {
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const analytics = await initAnalytics();
      if (!analytics || cancelled) return;

      // For SPA navigation, explicitly log page views.
      logEvent(analytics, 'page_view', {
        page_path: pathname,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return null;
}

