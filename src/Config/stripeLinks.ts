export const PAYMENT_LINKS = {
  pro_monthly:  "https://buy.stripe.com/3cI9AVgIO6ng7qz2Ii18c02",
  pro_annual:   "https://buy.stripe.com/cNi14p78edPI8uDciS18c03",
  team_monthly: "https://buy.stripe.com/6oU9AVdwC3b4h191Ee18c00",
  team_annual:  "https://buy.stripe.com/aFadRb0JQeTM7qzfv418c01",
} as const;

export type PlanPriceKey = keyof typeof PAYMENT_LINKS;
