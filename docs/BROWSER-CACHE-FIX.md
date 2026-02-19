# Browser Cache Issue — Network Tab Empty

## Problem
- Network tab shows **0/62 requests** despite page loading
- Load times showing **10+ minutes** (likely stale data)
- No GA4 collect requests visible

## Root Cause
Browser is showing **cached/stale Network tab data** from a previous session. The dev server logs show GA is actually loading correctly.

## Solution — Clear Browser Cache & Hard Refresh

### Step 1: Clear Network Tab
1. Open Chrome DevTools (F12)
2. Go to **Network** tab
3. Right-click in the Network tab → **Clear browser cache**
4. Or click the **Clear** button (circle with line through it)

### Step 2: Hard Refresh Page
- **Windows/Linux:** `Ctrl + Shift + R` or `Ctrl + F5`
- **Mac:** `Cmd + Shift + R`

### Step 3: Disable Cache (Temporary)
1. In DevTools → Network tab
2. Check **"Disable cache"** checkbox
3. Keep DevTools open while testing

### Step 4: Verify GA4 is Loading
1. Open **Console** tab in DevTools
2. Look for: `[GA] GoogleAnalytics component loaded, ID: G-L926SSHFY8`
3. If you see this, GA component is loading correctly

### Step 5: Check Network Requests
1. In **Network** tab, remove any filters
2. Reload page (hard refresh)
3. You should see:
   - HTML document request
   - CSS files
   - JavaScript chunks
   - **GA script:** `gtag/js?id=G-L926SSHFY8`
   - **GA collect requests:** `google-analytics.com/g/collect`

## If Still Not Working

### Check Browser Extensions
- **Ad blockers** (uBlock Origin, AdBlock Plus) can block GA
- **Privacy extensions** (Privacy Badger, Ghostery) can block tracking
- **Disable extensions** temporarily to test

### Check Console for Errors
1. Open **Console** tab
2. Look for red error messages
3. Common issues:
   - CORS errors
   - Script loading errors
   - Network errors

### Verify Dev Server
- Check terminal: Should show `✓ Ready` and `[GA] GoogleAnalytics component loaded`
- If not, restart: Stop server (Ctrl+C) and run `npm run dev`

## Expected Results After Fix

✅ Network tab shows all requests  
✅ Load time: < 5 seconds (not 10+ minutes)  
✅ GA script loads: `gtag/js?id=G-L926SSHFY8`  
✅ GA collect requests appear: `google-analytics.com/g/collect`  
✅ Console shows: `[GA] GoogleAnalytics component loaded, ID: G-L926SSHFY8`

---

**The dev server is running correctly. The issue is browser cache showing stale Network tab data.**
