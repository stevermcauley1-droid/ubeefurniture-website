# FTG Supplier Feed Importer

Imports the FTG (Furniture Trade Group) product details CSV into the `SupplierProduct` table.

## Prerequisites

- `DATABASE_URL` in `.env` or `.env.local`
- CSV file path (see below)

## CSV file

The actual product feed file is **`Product Details for ALL PRODUCTS.csv`**.

**Easiest:** Place `Product Details for ALL PRODUCTS.csv` in your project root (same folder as `package.json`) and run:

```bash
npm run ftg:import:details
```

The script looks for that filename in the current working directory by default.

**Custom path:** Set `FTG_CSV_PATH` to the full path if the file is elsewhere:

```bash
# Windows (PowerShell)
$env:FTG_CSV_PATH = "C:\path\to\Product Details for ALL PRODUCTS.csv"
npm run ftg:import:details

# Linux/macOS
FTG_CSV_PATH=/path/to/Product Details for ALL PRODUCTS.csv npm run ftg:import:details
```

A **sample CSV** for testing is at `scripts/ftg/fixtures/sample-ftg-details.csv`.

---

## Price list file

The price/stock feed file is **`FTG-Price-List-2026-02-17.csv`**.

**Easiest:** Place `FTG-Price-List-2026-02-17.csv` in your project root (same folder as `package.json`) and run:

```bash
npm run ftg:import:price
```

**Custom path:** Set `FTG_PRICE_CSV_PATH` (or `FTG_CSV_PATH`) to the full path if the file is elsewhere:

```powershell
# Windows (PowerShell)
$env:FTG_PRICE_CSV_PATH = "C:\path\to\FTG-Price-List-2026-02-17.csv"
npm run ftg:import:price
```

A sample price CSV for testing is at `scripts/ftg/fixtures/sample-ftg-price.csv`.

---

## Run import

**Details (product info):**

```bash
npm run ftg:import:details
```

**Price/stock:**

```bash
npm run ftg:import:price
```

**Both (details then price):**

```bash
npm run ftg:sync:all
```

**Sync FTG products to Shopify** (after details + price are imported):

```bash
npm run ftg:sync:shopify
```

By default this creates up to 50 products. Use `--all` for full sync or `--limit=N`:

```bash
npx tsx scripts/ftg/sync-ftg-to-shopify.ts --limit=100
npx tsx scripts/ftg/sync-ftg-to-shopify.ts --all
```

Requires **SHOPIFY_STORE_DOMAIN** and **SHOPIFY_ADMIN_ACCESS_TOKEN** (Admin API with `write_products` scope). Each product is created with computed sell price (from cost/RRP) and SKU; `shopifyProductId` is stored on `SupplierProduct` so the same product is not created again.

---

This will:

1. Parse the CSV (2-row header: group row + column names)
2. Upsert each row into `SupplierProduct` (unique by `supplier` + `sku`)
3. Print progress and a final count

## Database

Ensure migrations are applied so `SupplierProduct` exists:

```bash
npm run db:migrate
```

## Parse only (no DB)

To only parse the CSV and output JSON (e.g. for debugging or piping):

```bash
npx tsx scripts/ftg/parse-ftg-details.ts
# or with path
FTG_CSV_PATH=./path/to/file.csv npx tsx scripts/ftg/parse-ftg-details.ts
```
