# Testing GA4 Events — Quick Guide

## ✅ Current Status

Based on your screenshots:
- ✅ **Purchase tracking page is working** — `/checkout/thank-you` page loads correctly
- ⚠️ **view_item testing** — Need to use a real product handle (not `[any-product]`)

---

## 🧪 How to Test view_item Event

### Option 1: Use Homepage Products (Easiest)

1. **Visit homepage:** `http://localhost:3000`
2. **Click any product** from the "Featured" section
3. **Check Console:** Should see `[GA4] Event fired: view_item`
4. **Check Network tab:** Filter by `collect` → Should see request with `en=view_item`

### Option 2: Get Real Product Handle

1. **Visit homepage:** `http://localhost:3000`
2. **Open DevTools → Console**
3. **Run this to get a product handle:**
   ```javascript
   // This will show products from the homepage
   document.querySelectorAll('a[href^="/products/"]')[0]?.href
   ```
4. **Copy the handle** from the URL (e.g., if URL is `/products/modern-sofa`, handle is `modern-sofa`)
5. **Visit:** `http://localhost:3000/products/[paste-handle-here]`

### Option 3: Use Collections Page

1. **Visit:** `http://localhost:3000/collections`
2. **Click any collection**
3. **Click any product** from that collection
4. **Check Console/Network** for view_item event

---

## 🧪 How to Test purchase Event

### Current Test URL (Already Working!)

```
http://localhost:3000/checkout/thank-you?order_id=12345&total=299.99&currency=GBP
```

### With Items Array (Optional)

```
http://localhost:3000/checkout/thank-you?order_id=12345&total=599.98&currency=GBP&items=%5B%7B%22id%22%3A%22prod1%22%2C%22name%22%3A%22Sofa%22%2C%22price%22%3A299.99%2C%22quantity%22%3A1%7D%2C%7B%22id%22%3A%22prod2%22%2C%22name%22%3A%22Table%22%2C%22price%22%3A299.99%2C%22quantity%22%3A1%7D%5D
```

**Decoded items param:**
```json
[
  {"id":"prod1","name":"Sofa","price":299.99,"quantity":1},
  {"id":"prod2","name":"Table","price":299.99,"quantity":1}
]
```

### Verification Steps

1. **Visit the thank you URL** (with order params)
2. **Check Console:** Should see `[GA4] Event fired: purchase`
3. **Check Network tab:** Filter by `collect` → Should see request with `en=purchase`
4. **Refresh page:** Event should NOT fire again (sessionStorage guard working)
5. **Check sessionStorage:** 
   ```javascript
   sessionStorage.getItem('purchase_tracked_12345')
   // Should return: "true"
   ```

---

## 🔍 What to Look For

### Console Output (Dev Mode)

```
[GA4] Event fired: view_item {
  currency: "GBP",
  value: 299.99,
  items: [{ item_id: "...", item_name: "...", price: 299.99, quantity: 1 }]
}

[GA4] Event fired: purchase {
  transaction_id: "12345",
  currency: "GBP",
  value: 299.99,
  items: [...]
}
```

### Network Tab (collect Requests)

**view_item:**
- URL: `https://www.google-analytics.com/g/collect?...`
- Parameters: `en=view_item`, `ep.currency=GBP`, `ep.value=299.99`
- Status: `204` (success)

**purchase:**
- URL: `https://www.google-analytics.com/g/collect?...`
- Parameters: `en=purchase`, `ep.transaction_id=12345`, `ep.currency=GBP`
- Status: `204` (success)

---

## ✅ Success Indicators

- ✅ Console shows `[GA4] Event fired: [event_name]`
- ✅ Network tab shows `collect` request with `en=[event_name]`
- ✅ Status code is `204` (No Content = success)
- ✅ view_item does NOT fire on page refresh
- ✅ purchase does NOT fire on page refresh
- ✅ No TypeScript errors
- ✅ No runtime errors

---

## 🐛 Troubleshooting

### view_item Not Firing?

1. **Check product page loads:** Ensure product exists in Shopify
2. **Check Console for errors:** Look for red error messages
3. **Verify GA is loaded:** Check for `[GA4] GoogleAnalytics component loaded` message
4. **Check Network:** Ensure `gtag/js` script loaded successfully

### purchase Not Firing?

1. **Check URL params:** Ensure `order_id` and `total` are present
2. **Check Console:** Should see warning if params missing
3. **Verify sessionStorage:** Check if already tracked
4. **Check Network:** Ensure GA script loaded

---

**Your purchase page is working! Just need to test view_item with a real product URL.** ✅
