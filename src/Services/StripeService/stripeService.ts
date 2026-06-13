import { getFunctions, httpsCallable } from "firebase/functions";

const functions = getFunctions();

interface CheckoutParams {
  priceKey: "pro_monthly" | "pro_annual" | "team_monthly" | "team_annual";
}

interface CheckoutResult {
  url: string;
}

interface PortalResult {
  url: string;
}

/**
 * Redirects the current browser tab to Stripe Checkout.
 * priceKey must match one of the keys in PRICE_IDS in functions/src/index.ts.
 */
export async function redirectToCheckout(params: CheckoutParams): Promise<void> {
  const fn = httpsCallable<CheckoutParams & { successUrl: string; cancelUrl: string }, CheckoutResult>(
    functions,
    "createCheckoutSession"
  );

  const base = window.location.origin + window.location.pathname;
  const { data } = await fn({
    ...params,
    successUrl: `${base}#/checkout-success`,
    cancelUrl:  `${base}#/pricing`,
  });

  if (data.url) window.location.href = data.url;
}

/**
 * Opens the Stripe Customer Portal so the user can manage / cancel their subscription.
 */
export async function redirectToCustomerPortal(): Promise<void> {
  const fn = httpsCallable<{ returnUrl: string }, PortalResult>(
    functions,
    "createPortalSession"
  );

  const base = window.location.origin + window.location.pathname;
  const { data } = await fn({ returnUrl: `${base}#/settings` });

  if (data.url) window.location.href = data.url;
}
