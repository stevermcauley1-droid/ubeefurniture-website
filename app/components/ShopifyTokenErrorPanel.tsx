interface ShopifyTokenErrorPanelProps {
  status: 'domain_ok' | 'token_missing' | 'token_invalid' | 'wrong_type';
  message?: string;
}

export function ShopifyTokenErrorPanel({ status, message }: ShopifyTokenErrorPanelProps) {
  const bullets: string[] = [];
  if (status === 'domain_ok') {
    bullets.push('Domain: OK');
  } else {
    bullets.push('Domain: check SHOPIFY_STORE_DOMAIN or NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN');
  }
  if (status === 'token_missing') {
    bullets.push('Token: missing');
    bullets.push('Next step: paste Storefront API token into SHOPIFY_STOREFRONT_ACCESS_TOKEN in .env');
  } else if (status === 'wrong_type') {
    bullets.push('Token: wrong type (you pasted app secret shpss_...)');
    bullets.push('Next step: get Storefront access token from Storefront API integration');
  } else if (status === 'token_invalid') {
    bullets.push('Token: invalid or expired');
    bullets.push('Next step: paste the correct Storefront token and restart dev server');
  }

  return (
    <div
      style={{
        margin: '1.5rem 0',
        padding: '1.25rem',
        background: '#fff5f5',
        border: '1px solid #feb2b2',
        borderRadius: 8,
      }}
    >
      <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: '#c53030' }}>
        Shopify token not configured
      </h3>
      {message && <p style={{ marginBottom: '0.75rem', fontSize: '0.875rem' }}>{message}</p>}
      <ul style={{ margin: '0 0 0.75rem', paddingLeft: '1.25rem', fontSize: '0.875rem' }}>
        {bullets.map((b, i) => (
          <li key={i}>{b}</li>
        ))}
      </ul>
      <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 600 }}>
        First troubleshooting step: Run <code style={{ background: '#fff', padding: '0.125rem 0.25rem', borderRadius: 4 }}>npm run shopify:smoke</code>
      </p>
      <p style={{ marginTop: '0.5rem', fontSize: '0.8125rem', color: '#555' }}>
        Token must come from: Shopify Admin → Settings → Apps → Develop apps → [Your app] → Storefront API integration → reveal Storefront access token. Do not paste shpss_ (app secret).
      </p>
    </div>
  );
}
