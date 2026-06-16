import { getFunctions, httpsCallable } from "firebase/functions";

/**
 * Called once on login/signup. Invokes the applyGrant Cloud Function which
 * uses admin SDK to check _grants and write planOverride — plan fields cannot
 * be written by client code directly (blocked by Firestore security rules).
 */
export async function applyGrantIfExists(_uid: string, _email: string): Promise<void> {
  try {
    const fns = getFunctions();
    await httpsCallable(fns, "applyGrant")({});
  } catch {
    // Silently fail — grant check must never block login
  }
}
