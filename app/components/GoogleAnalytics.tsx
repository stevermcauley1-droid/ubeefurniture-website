'use client';

import Script from 'next/script';
import { isGAEnabled, getGAMeasurementId } from '@/lib/analytics';

export function GoogleAnalytics() {
  if (!isGAEnabled()) {
    console.log('[GA] GoogleAnalytics component: GA disabled (no measurement ID)');
    return null;
  }
  const id = getGAMeasurementId();
  console.log('[GA] GoogleAnalytics component loaded, ID:', id);
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="ga-config" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${id}');
        `}
      </Script>
    </>
  );
}
