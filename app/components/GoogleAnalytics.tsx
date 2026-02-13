'use client';

import Script from 'next/script';
import { isGAEnabled, getGAMeasurementId } from '@/lib/analytics';

export function GoogleAnalytics() {
  if (!isGAEnabled()) return null;
  const id = getGAMeasurementId();
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="lazyOnload"
      />
      <Script id="ga-config" strategy="lazyOnload">
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
