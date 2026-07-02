// ---------------------------------------------------------------------------
// Stripe Payment Links — TEST MODE.
// Create these in the Stripe dashboard (test mode) → Payment Links, one per
// price, then paste the URLs here. Before going live, replace with the
// live-mode links (they won't contain "/test_").
//
//   Pro monthly  $14/mo   |  Pro yearly  $120/yr
//   Team monthly $39/mo   |  Team yearly $349/yr
// ---------------------------------------------------------------------------
export const PAYMENT_LINKS = {
  pro_monthly:  "https://buy.stripe.com/test_6oU9AVdwC3b4h191Ee18c00", // paste test payment link
  pro_annual:   "https://buy.stripe.com/test_5kQ6oJdwC5jc12b0Aa18c05",
  team_monthly: "https://buy.stripe.com/test_3cI9AVgIO6ng7qz2Ii18c02",
  team_annual:  "https://buy.stripe.com/test_8x29AV78edPI3aj0Aa18c04",
} as const;

export type PlanPriceKey = keyof typeof PAYMENT_LINKS;

/**
 * Builds the checkout URL for a plan.
 *
 * - client_reference_id = Firebase UID → the webhook uses this to attach the
 *   subscription to the right user doc. Without it the purchase can't be
 *   linked, so we return null and the caller should block checkout.
 * - prefilled_email → locks the checkout email to the account email so the
 *   Stripe customer matches the LiveCue account.
 */
export function buildCheckoutUrl(
  key: PlanPriceKey,
  uid: string,
  email?: string | null
): string | null {
  const base = PAYMENT_LINKS[key];
  if (!base || !uid) return null;
  const params = new URLSearchParams({ client_reference_id: uid });
  if (email) params.set("prefilled_email", email);
  return `${base}?${params.toString()}`;
}

/** True once real payment links have been pasted in. */
export function paymentsEnabled(): boolean {
  return Object.values(PAYMENT_LINKS).every((url) => url.startsWith("https://"));
}
