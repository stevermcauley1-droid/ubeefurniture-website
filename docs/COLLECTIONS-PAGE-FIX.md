# Collections Page Fix Summary

## Problem
- `/collections` page showed "No collections available"
- Chrome DevTools showed 404s (these are Next.js RSC requests, not API routes)
- Collections weren't loading despite being created in Shopify

## Root Cause
1. **Storefront API Limitation**: Storefront API only returns collections that have products. Empty collections aren't visible.
2. **Admin API Fallback**: The fallback logic wasn't properly detecting Client Credentials Grant tokens.

## Solution Implemented

### A) Port Confirmation
- **Dev Server**: Running on port **3000** (PID 28316)
- **Browser**: Should use `http://localhost:3000/collections`

### B) Page Architecture
- `/collections` is a **Server Component** (not a client-side page)
- No API route needed - it calls `getCollections()` directly on the server
- The 404s in DevTools are Next.js RSC (React Server Components) internal requests - these are normal

### C) Admin API Fallback Enhancement
**File**: `lib/shopify.ts`

1. **Added `hasAdminAccess()` function**: Checks for both:
   - Direct `SHOPIFY_ADMIN_ACCESS_TOKEN` env var
   - Client Credentials Grant (via `shopify-auth.ts`)

2. **Updated `getCollections()` logic**:
   - Tries Storefront API first
   - If Storefront only returns "frontpage", automatically falls back to Admin API
   - Admin API returns all published collections (even empty ones)
   - Filters to only show collections published to Online Store

3. **Updated `adminFetch()`**: Already supports Client Credentials Grant token exchange

### D) Deduplication
**File**: `app/collections/page.tsx`

- Added deduplication logic to show only the latest version of each collection
- Prevents showing duplicate collections (e.g., "sofas-1", "sofas-2", "sofas-3")

## Verification Steps

1. **Visit**: `http://localhost:3000/collections`
2. **Expected Result**: 
   - Page loads successfully (200 status)
   - Shows list of collections: Sofas, Beds, Mattresses, Wardrobes, Dining, Package Deals, Landlord Packs, Sale
   - Each collection is a clickable link to `/collections/{handle}`

3. **Check Server Logs**: Should see:
   ```
   [getCollections] Storefront API only returned frontpage, trying Admin API fallback
   [getCollections] Falling back to Admin API
   [getCollections] Using Admin API fallback
   [getCollections] Admin API returned: { publishedCollections: 8, ... }
   ```

## Current Status

✅ **Fixed**: Admin API fallback now works with Client Credentials Grant  
✅ **Fixed**: Collections page deduplicates collections  
✅ **Working**: Page should now display all 8 published collections  

## Notes

- Collections are empty (no products yet) - this is why Storefront API doesn't show them
- Once products are synced via `npm run ftg:sync:shopify`, collections will populate
- Storefront API will then show collections automatically
- Admin API fallback ensures collections are visible even when empty

## Files Modified

1. `lib/shopify.ts`:
   - Added `hasAdminAccess()` async function
   - Updated `getCollections()` to use Admin API fallback when Storefront only returns frontpage
   - Enhanced Admin API query to include publication status

2. `app/collections/page.tsx`:
   - Added deduplication logic to prevent showing duplicate collections
