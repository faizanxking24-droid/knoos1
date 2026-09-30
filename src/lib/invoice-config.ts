/**
 * Centralized business configuration for KNOOS invoices and bills.
 *
 * Uses confirmed existing business details from KNOOS storefront contact records.
 * Does NOT invent unconfigured GSTIN or tax numbers.
 */

export interface InvoiceBusinessConfig {
  businessName: string;
  legalEntityName: string;
  tagline: string;
  supportEmail: string;
  supportPhone: string;
  website: string;
  businessAddress: string;
  operatingHours: string;
}

export const INVOICE_BUSINESS_CONFIG: InvoiceBusinessConfig = {
  businessName: "KNOOS",
  legalEntityName: "KRIPA KIRAN SHOE COMPANY",
  tagline: "Premium Footwear",
  supportEmail: "kkshoeco@gmail.com",
  supportPhone: "+91 70888 08882",
  website: "https://knoos.in",
  businessAddress: "15/5 Soron Ktra, Shahganj, Agra, Uttar Pradesh - 282010, India",
  operatingHours: "Mon – Sat: 10:00 AM – 7:00 PM IST",
};
