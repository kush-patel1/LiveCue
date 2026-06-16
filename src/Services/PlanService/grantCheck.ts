import { db, doc } from "../../Backend/firebase";
import { getDoc, setDoc, collection } from "firebase/firestore";
import { Plan } from "../../Config/planLimits";

/**
 * Called once on login/signup. Checks the private _grants collection for
 * the user's email. Firestore rules allow authenticated users to read their
 * own grant doc (matched by email). Writes planOverride to the user doc.
 */
export async function applyGrantIfExists(uid: string, email: string): Promise<void> {
  try {
    const grantRef = doc(collection(db, "_grants"), email.toLowerCase());
    const grantSnap = await getDoc(grantRef);
    if (!grantSnap.exists()) return;

    const { plan } = grantSnap.data() as { plan: Plan };
    if (!plan) return;

    await setDoc(doc(db, "users", uid), { planOverride: plan }, { merge: true });
  } catch (err) {
    console.error("[grantCheck] failed:", err);
  }
}
