import { db, doc } from "../../Backend/firebase";
import { getDoc, setDoc, collection } from "firebase/firestore";
import { Plan } from "../../Config/planLimits";

/**
 * Called once on login/signup. Checks the private _grants collection for
 * the user's email. If a grant exists, writes planOverride to the user doc.
 * The _grants collection is populated manually via Firebase console only —
 * no public API or UI exists to add entries.
 */
export async function applyGrantIfExists(uid: string, email: string): Promise<void> {
  try {
    const grantRef = doc(collection(db, "_grants"), email.toLowerCase());
    const grantSnap = await getDoc(grantRef);
    if (!grantSnap.exists()) return;

    const { plan } = grantSnap.data() as { plan: Plan };
    if (!plan) return;

    const userRef = doc(db, "users", uid);
    await setDoc(userRef, { planOverride: plan }, { merge: true });
  } catch {
    // Silently fail — grant check is best-effort and must never block login
  }
}
