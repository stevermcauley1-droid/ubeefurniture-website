'use client';

import Script from 'next/script';

/**
 * Heatmaps and session replay analytics.
 * Supports Hotjar and Microsoft Clarity.
 * Only loads if IDs are configured in env.
 */

const HOTJAR_ID = process.env.NEXT_PUBLIC_HOTJAR_ID;
const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID;

export function HeatmapAnalytics() {
  return (
    <>
      {HOTJAR_ID && <HotjarScript id={HOTJAR_ID} />}
      {CLARITY_ID && <ClarityScript id={CLARITY_ID} />}
    </>
  );
}

function HotjarScript({ id }: { id: string }) {
  return (
    <Script id="hotjar" strategy="lazyOnload">
      {`
        (function(h,o,t,j,a,r){
          h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
          h._hjSettings={hjid:${id},hjsv:6};
          a=o.getElementsByTagName('head')[0];
          r=o.createElement('script');r.async=1;
          r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
          a.appendChild(r);
        })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
      `}
    </Script>
  );
}

function ClarityScript({ id }: { id: string }) {
  return (
    <Script id="clarity" strategy="lazyOnload">
      {`
        (function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "${id}");
      `}
    </Script>
  );
}
