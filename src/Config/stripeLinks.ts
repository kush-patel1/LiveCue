// ---------------------------------------------------------------------------
// Stripe Payment Links — LIVE MODE.
//   Pro monthly  $14/mo   |  Pro yearly  $120/yr
//   Team monthly $39/mo   |  Team yearly $349/yr
// ---------------------------------------------------------------------------
export const PAYMENT_LINKS = {
  pro_monthly:  "https://buy.stripe.com/8x29AV78edPI3aj0Aa18c04",
  pro_annual:   "https://buy.stripe.com/5kQ6oJdwC5jc12b0Aa18c05",
  team_monthly: "https://buy.stripe.com/9B64gBgIO2708uDdmW18c06",
  team_annual:  "https://buy.stripe.com/bJe6oJ64a8voaCLciS18c07",
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
