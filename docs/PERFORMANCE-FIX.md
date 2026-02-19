# Performance Fix — Slow Page Load (6.5+ minutes)

## Issues Identified

1. **GA4 Script Loading Too Late**
   - Was using `strategy="lazyOnload"` which waits for full page load
   - Changed to `strategy="afterInteractive"` to load earlier

2. **Shopify API Timeout Too Long**
   - Fetch timeout was 15 seconds
   - Reduced to 10 seconds for faster failure
   - Added page-level timeout wrapper (12s) to prevent hanging

3. **No Timeout Protection on Homepage**
   - Homepage API calls could hang indefinitely
   - Added Promise.race with timeout to ensure page renders even if Shopify is slow

## Fixes Applied

### 1. GoogleAnalytics.tsx
- Changed Script strategy from `lazyOnload` → `afterInteractive`
- GA will now load as soon as page becomes interactive, not after full load

### 2. lib/shopify.ts
- Reduced `FETCH_TIMEOUT_MS` from 15000 → 10000 (10 seconds)

### 3. app/page.tsx
- Added 12-second timeout wrapper around Shopify API calls
- Page will render with empty products/collections if API times out
- Prevents 6+ minute hangs

## Expected Results

- **Page load:** Should complete in < 15 seconds even if Shopify is slow
- **GA4 tracking:** Will fire earlier (afterInteractive vs lazyOnload)
- **User experience:** Page renders immediately, shows error if API fails

## Testing

1. Hard refresh browser (Ctrl+Shift+R)
2. Check Network tab — should see GA collect requests much earlier
3. Check Console — should see `[GA] GoogleAnalytics component loaded` message
4. Page should load in < 15 seconds even if Shopify API is slow

## Next Steps

If still slow:
1. Check Shopify API response times
2. Verify `.env.local` has correct `SHOPIFY_STOREFRONT_ACCESS_TOKEN`
3. Check browser console for errors
4. Consider adding loading states/skeletons for better UX
