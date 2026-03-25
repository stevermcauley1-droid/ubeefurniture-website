# Where to set Shopify custom app API scopes

Use this to fix **"Access denied for productVariants field"** when running the FTG import.

---

## If you use the Dev Dashboard app "Ubee Automation" (dev.shopify.com)

Your screenshots show **Ubee Automation** in the **Shopify Dev Dashboard** with scopes set correctly on **Versions → ubee-automation-2**: `read_products`, `write_products`, `read_publications`, `write_publications`. That is the right place for this type of app.

The missing link: the token in `.env.local` must be an **Admin API token from an installation** of this app on **ubee-furniture.myshopify.com**, and that installation must be using the version that has these scopes. Old tokens or tokens from before the scoped version was released do not get the new scopes.

### What to do

1. **Install or reinstall the app on your store**  
   In Dev Dashboard → **Ubee Automation** → **Overview** → click **Install app** (or open your app’s **Settings** / **Distribution** and install the app on **ubee-furniture**). If the app is already installed, **uninstall it from the store**, then **install it again** so the store gets a new token for the current version (ubee-automation-2 with scopes).

2. **Get the new Admin API access token**  
   After install (or reinstall), the token is created for that store. In Dev Dashboard, look for:
   - **API credentials**, or  
   - **Installations** (select the store ubee-furniture), or  
   - The install flow / OAuth callback that shows the token.  
   Copy the **Admin API access token** (not the client ID/secret).

3. **Put the token in `.env.local`**  
   Set:
   ```env
   SHOPIFY_STORE_DOMAIN=ubee-furniture.myshopify.com
   SHOPIFY_ADMIN_API_TOKEN=<paste the new token here>
   ```
   Save the file.

4. **Verify and run import**  
   From project root:
   ```bash
   node scripts/import/ftg/check-shopify-token.mjs
   npm run ftg:import
   ```

If you use a **store-admin custom app** (created under the store’s Settings → Apps → Develop apps) instead of the Dev Dashboard app, follow the section below.

---

## Right place (store admin custom app): Configuration → Admin API

1. **Log in to Shopify Admin**  
   `https://ubee-furniture.myshopify.com/admin` (or your store URL).

2. **Go to Settings**  
   Bottom-left: **Settings** (gear icon).

3. **Open Apps and sales channels**  
   In Settings, click **Apps and sales channels**.

4. **Develop apps**  
   Click **Develop apps** (or **Develop apps for your store**).  
   If you don’t see it, your user needs the **Develop apps** permission (store owner can grant it in Settings → Users and permissions).

5. **Open your app**  
   Click the **name of your custom app** (the one whose token you put in `.env.local`).  
   If you haven’t created one yet: **Create an app** → **Create custom app**, then name it (e.g. “FTG Import”).

6. **Configuration tab**  
   In the app, open the **Configuration** tab.

7. **Admin API integration**  
   Find the **Admin API integration** section.  
   Click **Edit** (or **Configure** or **Select scopes**).

8. **Select these scopes**  
   In the list of **Admin API access scopes**, enable:
   - **Read products** (`read_products`) – needed to look up products/variants by SKU.
   - **Write products** (`write_products`) – needed to create/update products and variants.
   - Optionally, if you use publications: **Read publications**, **Write publications**.

   Use the search/filter if needed and tick the boxes for **Read products** and **Write products**.

9. **Save**  
   Click **Save** in that section.

10. **Reinstall the app so the token gets the new scopes**  
    Changing scopes does **not** update an existing token. You need a new token with the new scopes:

    - **Option A:** In the app’s Configuration, under **API credentials**, **Reveal** the token once, then **Regenerate** (or delete and reinstall the app to get a new token).
    - **Option B:** In **Settings → Apps and sales channels**, find the app, click **Uninstall**, then **Develop apps** → your app → **Install app** (or **Select store** and install again). After install, **Reveal** and copy the new **Admin API access token**.

11. **Update `.env.local`**  
    Set `SHOPIFY_ADMIN_API_TOKEN=` to the **new** token (the one generated after the scope change). Save the file.

12. **Run the import again**  
    From project root:
    ```bash
    npm run ftg:import
    ```

---

## Wrong places (these are not where custom app scopes are set)

- **Settings → Checkout** – checkout settings, not API scopes.
- **Settings → Notifications** – notifications, not API scopes.
- **Theme or Online Store** – no API scopes there.
- **Apps listed under “Apps” that you didn’t create** – those are third‑party apps; you can’t change their scopes in your admin.

Scopes for **your** custom app are only under:  
**Settings → Apps and sales channels → Develop apps → [Your app] → Configuration → Admin API integration → Edit (scopes).**

---

## Quick token check (no secrets printed)

From project root, with `.env.local` containing `SHOPIFY_STORE_DOMAIN` and `SHOPIFY_ADMIN_API_TOKEN`:

```bash
node scripts/import/ftg/check-shopify-token.mjs
```

- If it prints **Token OK** and a product count, the token has at least `read_products` and the import should be able to look up by SKU.
- If it prints **Access denied for productVariants**, the token still doesn’t have the right scopes or wasn’t regenerated after you added them.
