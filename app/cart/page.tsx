import Link from 'next/link';
import Image from 'next/image';
import { getCartIdFromCookie, getCartForPage } from '@/app/actions/cart';
import { getProducts } from '@/lib/shopify';
import { CheckoutButton } from './CheckoutButton';

export default async function CartPage() {
  const cartId = await getCartIdFromCookie();
  const cart = await getCartForPage(cartId);

  // Upsells: "You may also like" — first 4 products (simple version)
  const upsellsRes = await getProducts(4);
  const upsells = upsellsRes.products.edges.map((e) => e.node);

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1rem' }}>
      <Link href="/" style={{ display: 'inline-block', marginBottom: '1rem' }}>← Home</Link>
      <h1>Your cart</h1>

      {!cart || cart.lines.edges.length === 0 ? (
        <p style={{ marginTop: '1rem' }}>Your cart is empty. <Link href="/">Continue shopping</Link>.</p>
      ) : (
        <>
          <ul style={{ listStyle: 'none', marginTop: '1rem' }}>
            {cart.lines.edges.map(({ node: line }) => (
              <li
                key={line.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '80px 1fr auto',
                  gap: '1rem',
                  alignItems: 'center',
                  padding: '0.75rem 0',
                  borderBottom: '1px solid #eee',
                }}
              >
                {line.merchandise.product.featuredImage && (
                  <Image
                    src={line.merchandise.product.featuredImage.url}
                    alt={line.merchandise.product.featuredImage.altText ?? line.merchandise.product.title}
                    width={80}
                    height={80}
                    style={{ objectFit: 'cover', borderRadius: 4 }}
                  />
                )}
                <div>
                  <Link href={`/products/${line.merchandise.product.handle}`}>
                    <strong>{line.merchandise.product.title}</strong>
                  </Link>
                  {line.merchandise.title !== 'Default Title' && (
                    <span style={{ color: '#666', fontSize: '0.875rem' }}> — {line.merchandise.title}</span>
                  )}
                  <p style={{ marginTop: '0.25rem', fontSize: '0.875rem' }}>
                    {line.merchandise.price.currencyCode} {line.merchandise.price.amount} × {line.quantity}
                  </p>
                </div>
                <div>
                  {line.merchandise.price.currencyCode}{' '}
                  {(parseFloat(line.merchandise.price.amount) * line.quantity).toFixed(2)}
                </div>
              </li>
            ))}
          </ul>

          <p style={{ marginTop: '1rem', padding: '0.75rem', background: '#f5f5f5', borderRadius: 4, fontSize: '0.875rem' }}>
            <strong>Delivery & lead time:</strong> Standard delivery applies. Lead times vary by product; we will confirm after order.
          </p>

          <div style={{ marginTop: '1.5rem' }}>
            <CheckoutButton
              checkoutUrl={cart.checkoutUrl}
              cartValue={cart.lines.edges.reduce(
                (sum, { node }) => sum + parseFloat(node.merchandise.price.amount) * node.quantity,
                0
              )}
              cartCurrency={cart.lines.edges[0]?.node?.merchandise?.price?.currencyCode ?? 'GBP'}
              cartItems={cart.lines.edges.map(({ node }) => ({
                id: node.merchandise.product.id,
                name: node.merchandise.product.title,
                price: parseFloat(node.merchandise.price.amount),
                quantity: node.quantity,
              }))}
            />
          </div>
        </>
      )}

      {upsells.length > 0 && (
        <section style={{ marginTop: '2.5rem' }}>
          <h2 style={{ fontSize: '1.125rem' }}>You may also like</h2>
          <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', listStyle: 'none', marginTop: '0.5rem' }}>
            {upsells.map((p) => (
              <li key={p.id}>
                <Link href={`/products/${p.handle}`}>
                  {p.featuredImage && (
                    <Image
                      src={p.featuredImage.url}
                      alt={p.featuredImage.altText ?? p.title}
                      width={p.featuredImage.width ?? 200}
                      height={p.featuredImage.height ?? 200}
                      sizes="150px"
                      style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 8 }}
                    />
                  )}
                  <span style={{ fontSize: '0.875rem' }}>{p.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
