import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Stripe = require("stripe");
type StripeClient = ReturnType<typeof Stripe>;

admin.initializeApp();
const db = admin.firestore();

// ---------------------------------------------------------------------------
// Stripe is initialized lazily so the secret key is read from runtime config,
// not baked into the bundle. Set it with:
//   firebase functions:secrets:set STRIPE_SECRET_KEY
//   firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
// ---------------------------------------------------------------------------
function getStripe(): StripeClient {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not set");
  return new Stripe(key, { apiVersion: "2026-05-27.dahlia" });
}

// Stripe Price IDs — replace with your real IDs from the Stripe dashboard
const PRICE_IDS: Record<string, string> = {
  pro_monthly:  process.env.STRIPE_PRICE_PRO_MONTHLY  ?? "price_placeholder_pro_monthly",
  pro_annual:   process.env.STRIPE_PRICE_PRO_ANNUAL   ?? "price_placeholder_pro_annual",
  team_monthly: process.env.STRIPE_PRICE_TEAM_MONTHLY ?? "price_placeholder_team_monthly",
  team_annual:  process.env.STRIPE_PRICE_TEAM_ANNUAL  ?? "price_placeholder_team_annual",
};

// ---------------------------------------------------------------------------
// applyGrant
// Called on login. Uses admin SDK (bypasses Firestore rules) to check the
// private _grants collection and write planOverride to the user doc.
// Client code cannot write plan fields directly — this is the only path.
// ---------------------------------------------------------------------------
export const applyGrant = functions.https.onCall(async (_, context) => {
  if (!context.auth) return { applied: false };
  const uid = context.auth.uid;
  const email = (context.auth.token.email ?? "").toLowerCase();
  if (!email) return { applied: false };

  const grantSnap = await db.collection("_grants").doc(email).get();
  if (!grantSnap.exists) return { applied: false };

  const { plan } = grantSnap.data() as { plan: string };
  if (!plan) return { applied: false };

  await db.collection("users").doc(uid).set({ planOverride: plan }, { merge: true });
  return { applied: true, plan };
});

// ---------------------------------------------------------------------------
// createCheckoutSession
// Client calls this with { priceKey, successUrl, cancelUrl }
// Returns { url } — frontend redirects the user there
// ---------------------------------------------------------------------------
export const createCheckoutSession = functions
  .runWith({ secrets: ["STRIPE_SECRET_KEY"] })
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Must be logged in");
    }

    const { priceKey, successUrl, cancelUrl } = data as {
      priceKey: string;
      successUrl: string;
      cancelUrl: string;
    };

    const priceId = PRICE_IDS[priceKey];
    if (!priceId || priceId.startsWith("price_placeholder")) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        `Stripe Price ID for "${priceKey}" is not configured. Set STRIPE_PRICE_${priceKey.toUpperCase()} in Firebase secrets.`
      );
    }

    const stripe = getStripe();
    const uid = context.auth.uid;

    // Reuse existing Stripe customer if one exists
    const userSnap = await db.collection("users").doc(uid).get();
    const userData = userSnap.data() ?? {};
    let customerId: string = userData.stripeCustomerId ?? "";

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: context.auth.token.email,
        metadata: { firebaseUID: uid },
      });
      customerId = customer.id;
      await db.collection("users").doc(uid).update({ stripeCustomerId: customerId });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: { metadata: { firebaseUID: uid } },
    });

    return { url: session.url };
  });

// ---------------------------------------------------------------------------
// createPortalSession
// Returns a Stripe Customer Portal URL so users can manage / cancel their sub
// ---------------------------------------------------------------------------
export const createPortalSession = functions
  .runWith({ secrets: ["STRIPE_SECRET_KEY"] })
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Must be logged in");
    }

    const stripe = getStripe();
    const uid = context.auth.uid;
    const userSnap = await db.collection("users").doc(uid).get();
    const customerId: string = userSnap.data()?.stripeCustomerId ?? "";

    if (!customerId) {
      throw new functions.https.HttpsError("not-found", "No Stripe customer found for this account");
    }

    // Return URL is hardcoded server-side — never trust client-supplied URLs
    // to prevent open-redirect phishing after portal cancellation.
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: "https://live-cue.com/#/settings",
    });

    return { url: session.url };
  });

// ---------------------------------------------------------------------------
// stripeWebhook
// Stripe calls this HTTPS endpoint after payment events.
// Register it in your Stripe Dashboard → Webhooks.
// ---------------------------------------------------------------------------
export const stripeWebhook = functions
  .runWith({ secrets: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"] })
  .https.onRequest(async (req, res) => {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      res.status(500).send("Webhook secret not configured");
      return;
    }

    const stripe = getStripe();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let event: any;

    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        req.headers["stripe-signature"] as string,
        webhookSecret
      );
    } catch (err) {
      res.status(400).send(`Webhook signature verification failed: ${err}`);
      return;
    }

    switch (event.type) {
      case "checkout.session.completed": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const session = event.data.object as any;
        const subscriptionId: string | null = session.subscription ?? null;

        // Resolve Firebase UID — prefer client_reference_id on the payment link URL
        let uid: string | null = session.client_reference_id ?? null;
        if (!uid) {
          const email: string | undefined = session.customer_details?.email;
          if (email) {
            const snap = await db.collection("users").where("email", "==", email).limit(1).get();
            if (!snap.empty) uid = snap.docs[0].id;
          }
        }
        if (!uid) break;

        // Save Stripe IDs so the portal works and subscription events can find
        // this user. Plan tier is resolved when Stripe fires
        // customer.subscription.updated (which always follows a checkout).
        const update: Record<string, unknown> = {};
        if (session.customer)  update.stripeCustomerId    = session.customer as string;
        if (subscriptionId)    update.stripeSubscriptionId = subscriptionId;
        if (Object.keys(update).length) {
          await db.collection("users").doc(uid).set(update, { merge: true });
        }
        break;
      }
      case "customer.subscription.updated": {
        // Webhook payload includes the full subscription object — no API call needed.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sub = event.data.object as any;
        const uid = await resolveUidFromSub(sub);
        if (!uid) break;

        if (["past_due", "unpaid", "canceled"].includes(sub.status)) {
          await db.collection("users").doc(uid).update({
            plan: "free", planExpiry: null, stripeSubscriptionId: null,
          });
        } else if (sub.status === "active" || sub.status === "trialing") {
          const priceId: string = sub.items?.data?.[0]?.price?.id ?? "";
          const plan = resolvePlanFromPriceId(priceId);
          const planExpiry = new Date(sub.current_period_end * 1000).toISOString();

          const userSnap = await db.collection("users").doc(uid).get();
          const existing = userSnap.data() ?? {};
          if (
            existing.plan !== plan ||
            existing.stripeSubscriptionId !== sub.id ||
            existing.planExpiry !== planExpiry
          ) {
            await db.collection("users").doc(uid).update({ plan, planExpiry, stripeSubscriptionId: sub.id });
          }
        }
        break;
      }
      case "customer.subscription.deleted": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sub = event.data.object as any;
        const uid = await resolveUidFromSub(sub);
        if (uid) {
          await db.collection("users").doc(uid).update({
            plan: "free", planExpiry: null, stripeSubscriptionId: null,
          });
        }
        break;
      }
    }

    res.json({ received: true });
  });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Look up the Firebase UID for a subscription webhook object.
// Checks subscription metadata first, then falls back to looking up the user
// by stripeSubscriptionId saved during checkout.session.completed.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveUidFromSub(sub: any): Promise<string | null> {
  if (sub.metadata?.firebaseUID) return sub.metadata.firebaseUID as string;
  // Fall back: find user whose stripeSubscriptionId matches
  const snap = await db.collection("users").where("stripeSubscriptionId", "==", sub.id).limit(1).get();
  return snap.empty ? null : snap.docs[0].id;
}

function resolvePlanFromPriceId(priceId: string): "pro" | "team" {
  const proIds  = [PRICE_IDS.pro_monthly,  PRICE_IDS.pro_annual];
  const teamIds = [PRICE_IDS.team_monthly, PRICE_IDS.team_annual];
  if (teamIds.includes(priceId)) return "team";
  if (proIds.includes(priceId))  return "pro";
  // Default to pro for unknown price IDs to avoid downgrading paying users
  return "pro";
}
