export const PAYMENT_LINKS = {
  pro_monthly:  "https://buy.stripe.com/test_6oU9AVdwC3b4h191Ee18c00",
  pro_annual:   "https://buy.stripe.com/test_aFadRb0JQeTM7qzfv418c01",
  team_monthly: "https://buy.stripe.com/test_3cI9AVgIO6ng7qz2Ii18c02",
  team_annual:  "https://buy.stripe.com/test_cNi14p78edPI8uDciS18c03",
} as const;

export type PlanPriceKey = keyof typeof PAYMENT_LINKS;

/** Returns the payment URL for a given plan key, or null if the key is invalid. */
export function getPaymentLink(key: string | null): string | null {
  if (!key) return null;
  return (PAYMENT_LINKS as Record<string, string>)[key] ?? null;
}
