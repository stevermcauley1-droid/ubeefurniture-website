# VAT / Invoice path (Phase 4)

Business customers (including landlords) often need VAT invoices. This doc describes how we capture the necessary details and deliver invoices.

---

## Where business details are captured

1. **Shopify Checkout**  
   At checkout, the buyer can enter a **company name** and **VAT number** (if applicable). Shopify stores this with the order.

2. **Billing address**  
   Checkout collects full billing address. For B2B, the billing address is the one that appears on the invoice.

3. **Optional: Quote / Landlord form**  
   The [Landlord hub](/landlord) “Request a quote” form captures name, email, property type, and message. When you follow up with a quote, you can ask for company name and VAT number before creating a draft order or sending a checkout link.

---

## What to ensure for VAT invoices

- **Shopify settings:** Enable collection of company name (and VAT number if available in your region) in Checkout settings. (Settings → Checkout → Form options.)
- **Tax settings:** Configure VAT correctly (inclusive vs exclusive, rates) in Shopify so invoices show the right totals.
- **Invoice delivery:** Use a Shopify app (e.g. invoice generator / PDF) or your accounting workflow to generate and send VAT invoices from order data. Shopify does not produce a formal VAT invoice by default; many merchants use an app or export order data to their accounting system.

---

## Summary

- **Capture:** Company name and VAT number (and billing address) at Shopify Checkout; optionally gather details earlier via the landlord quote form.
- **Output:** Use Shopify order data plus an invoice app or accounting workflow to produce and send VAT invoices. Document your chosen app or process here when decided.
