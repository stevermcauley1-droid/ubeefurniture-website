# Landlord Catalogue PDF

## Supabase table (for lead capture)

If you use Supabase for leads, run the SQL in `supabase/migrations/20250210000000_catalogue_leads.sql` in the **Supabase Dashboard → SQL Editor**. That creates the `catalogue_leads` table with the required columns. If the table already exists from Prisma with different columns, either run the migration on a new project or rely on the fallback (leads saved to `data/catalogue-leads.json` and console).

## Adding the real PDF

1. Place your PDF in the project's `public` folder:
   - **Filename:** `landlord-catalogue.pdf`
   - **Full path:** `public/landlord-catalogue.pdf`

2. It will be served at: **`/landlord-catalogue.pdf`**

3. The catalogue download page (`/landlords/catalogue`) shows the download button after lead capture. The form component uses this path; no code change needed once the file is in `public/`.

4. If the file is not present, the download link may 404; the success message already tells users "Catalogue coming this week" or that we'll email the link.
