export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  body: string;
}

export const BLOG_POSTS: BlogPost[] = [
  { slug: 'furniture-for-rental-properties', title: 'Best furniture for rental properties', description: 'How to choose durable, attractive furniture for furnished lets.', body: '<p>Furnished rental properties need furniture that stands up to tenant use. Focus on neutral colours, sturdy frames, and easy-to-clean fabrics. Our packages balance cost and durability for landlords.</p>' },
  { slug: 'landlord-furnishing-guide', title: 'Landlord furnishing guide', description: 'Step-by-step guide to furnishing a buy-to-let property.', body: '<p>Start with beds, sofa, dining table and chairs, and storage. Stick to a consistent style. Our landlord packages cover a full room or property in one go. We can provide VAT invoices for your records.</p>' },
  { slug: 'best-sofas-for-rentals', title: 'Best sofas for rentals', description: 'Which sofas last longest in furnished rentals?', body: '<p>Choose sofas with hardwood or metal frames and removable, washable covers. Neutral colours hide wear. We stock sofas popular with landlords for durability and value.</p>' },
  { slug: 'furnished-let-checklist', title: 'Furnished let checklist', description: 'What to include when furnishing a rental.', body: '<p>Every room needs basics: bed and mattress, storage, lighting. Living room: sofa, table. Kitchen: table and chairs. Document what you provide in the inventory. Our packages can cover the main items.</p>' },
  { slug: 'buy-to-let-furniture-tips', title: 'Buy-to-let furniture tips', description: 'Furnish a rental on a budget without cutting corners.', body: '<p>Buy in bundles; package deals offer better value. Focus spend on high-use items (beds, sofas). Order in one go for one delivery. We support business invoicing at checkout.</p>' },
  { slug: 'quick-furnish-rental', title: 'How to furnish a rental quickly', description: 'Get your property let-ready in days.', body: '<p>Use a pre-defined package and add to cart once. We confirm delivery dates and get everything to you as fast as possible. Need a custom mix? Use our landlord quote form.</p>' },
  { slug: 'durable-furniture-rentals', title: 'Durable furniture for rentals', description: 'Materials and construction that last.', body: '<p>Solid wood or quality MDF outlasts chipboard. Metal frames are hard-wearing. For upholstery, look for stain-resistant treatments. Our range includes items tagged for landlord use.</p>' },
  { slug: 'landlord-packages-explained', title: 'Landlord packages explained', description: 'What our packages include and how to order.', body: '<p>Each package is a single product (e.g. 2-bed package) listed on the product page. Add to cart and checkout once. We handle delivery. Need something different? Request a quote from our landlord hub.</p>' },
  { slug: 'vat-on-furniture-landlords', title: 'VAT on furniture for landlords', description: 'VAT and furniture purchases for landlords.', body: '<p>Furniture for rentals is a business expense. If you are VAT registered, you may reclaim VAT on qualifying purchases. Enter company name and VAT number at checkout for invoices. We do not give tax advice.</p>' },
  { slug: 'furnished-vs-unfurnished', title: 'Furnished vs unfurnished lets', description: 'Pros and cons of offering furnished or unfurnished.', body: '<p>Furnished can attract short-term tenants and professionals and command a premium. Unfurnished can mean less wear. If you choose furnished, decent furniture pays off in tenant satisfaction; our packages are built for that.</p>' },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
