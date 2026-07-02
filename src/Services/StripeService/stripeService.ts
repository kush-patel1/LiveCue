import { getFunctions, httpsCallable } from "firebase/functions";

/**
 * Opens the Stripe Customer Portal — the one place users manage billing:
 * cancel, switch monthly↔yearly, upgrade/downgrade Pro↔Team, update card,
 * and download invoices. The return URL is fixed server-side.
 */
export async function redirectToCustomerPortal(): Promise<void> {
  const fn = httpsCallable<Record<string, never>, { url: string }>(
    getFunctions(),
    "createPortalSession"
  );
  const { data } = await fn({});
  if (data.url) window.location.href = data.url;
}
