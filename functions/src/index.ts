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
          if (plan === "team") await ensureTeamDoc(uid);
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
// inviteTeamMember
// Called by the team owner to invite a member by email.
// Firebase Auth sends the magic-link email — no SMTP needed.
// ---------------------------------------------------------------------------
export const inviteTeamMember = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Must be logged in");
  }

  const inviteeEmail: string = (data.email ?? "").trim().toLowerCase();
  if (!inviteeEmail) {
    throw new functions.https.HttpsError("invalid-argument", "email is required");
  }

  const ownerUid = context.auth.uid;
  const userSnap = await db.collection("users").doc(ownerUid).get();
  const userData = userSnap.data() ?? {};

  if ((userData.planOverride ?? userData.plan) !== "team") {
    throw new functions.https.HttpsError("permission-denied", "Team plan required to invite members");
  }

  const teamId: string = userData.teamId ?? "";
  if (!teamId) {
    throw new functions.https.HttpsError("not-found", "No team found for this account");
  }

  const teamRef = db.collection("teams").doc(teamId);
  const teamSnap = await teamRef.get();
  const teamData = teamSnap.data() ?? {};

  if (teamData.ownerId !== ownerUid) {
    throw new functions.https.HttpsError("permission-denied", "Only the team owner can invite members");
  }

  const memberIds: string[] = teamData.memberIds ?? [];
  const pendingInvites: string[] = teamData.pendingInvites ?? [];
  const seats: number = teamData.seats ?? 5;

  // Owner occupies one seat
  if (memberIds.length >= seats - 1) {
    throw new functions.https.HttpsError("resource-exhausted", "All team seats are full");
  }

  if (pendingInvites.includes(inviteeEmail)) {
    throw new functions.https.HttpsError("already-exists", "An invite is already pending for this email");
  }

  // Check if this email belongs to an existing member
  const existingMemberSnap = await db.collection("users").where("email", "==", inviteeEmail).limit(1).get();
  if (!existingMemberSnap.empty) {
    const existingMember = existingMemberSnap.docs[0].data();
    if (existingMember.teamId === teamId) {
      throw new functions.https.HttpsError("already-exists", "This user is already on your team");
    }
  }

  await teamRef.update({ pendingInvites: [...pendingInvites, inviteeEmail] });

  // Firebase Auth sends the magic-link email; after sign-in the user lands on /accept-invite
  const continueUrl = `https://live-cue.com/#/accept-invite?teamId=${teamId}`;
  await admin.auth().generateSignInWithEmailLink(inviteeEmail, {
    url: continueUrl,
    handleCodeInApp: true,
  });

  return { success: true };
});

// ---------------------------------------------------------------------------
// acceptTeamInvite
// Called by the invitee after they've signed in via the magic link.
// Moves their email from pendingInvites → memberIds and writes teamId to
// their user doc.
// ---------------------------------------------------------------------------
export const acceptTeamInvite = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Must be logged in");
  }

  const teamId: string = (data.teamId ?? "").trim();
  if (!teamId) {
    throw new functions.https.HttpsError("invalid-argument", "teamId is required");
  }

  const inviteeUid = context.auth.uid;
  const inviteeEmail = (context.auth.token.email ?? "").toLowerCase();

  const teamRef = db.collection("teams").doc(teamId);
  const teamSnap = await teamRef.get();

  if (!teamSnap.exists) {
    throw new functions.https.HttpsError("not-found", "Team not found");
  }

  const teamData = teamSnap.data()!;
  const pendingInvites: string[] = teamData.pendingInvites ?? [];

  if (!pendingInvites.includes(inviteeEmail)) {
    throw new functions.https.HttpsError("permission-denied", "No pending invite found for your email");
  }

  const memberIds: string[] = teamData.memberIds ?? [];
  const seats: number = teamData.seats ?? 5;

  if (memberIds.length >= seats - 1) {
    throw new functions.https.HttpsError("resource-exhausted", "Team is full — ask your team owner to free up a seat");
  }

  const batch = db.batch();

  // Move email from pendingInvites to memberIds on the team doc
  batch.update(teamRef, {
    pendingInvites: pendingInvites.filter((e) => e !== inviteeEmail),
    memberIds: [...memberIds, inviteeUid],
  });

  // Write teamId to the invitee's user doc (admin SDK bypasses Firestore rules)
  batch.set(db.collection("users").doc(inviteeUid), { teamId }, { merge: true });

  await batch.commit();

  return { success: true, teamId };
});

// ---------------------------------------------------------------------------
// removeTeamMember
// Called by the team owner to remove a member or revoke a pending invite.
// ---------------------------------------------------------------------------
export const removeTeamMember = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Must be logged in");
  }

  const ownerUid = context.auth.uid;
  const targetUid: string | undefined = data.uid;
  const targetEmail: string | undefined = (data.email ?? "").trim().toLowerCase() || undefined;

  if (!targetUid && !targetEmail) {
    throw new functions.https.HttpsError("invalid-argument", "uid or email is required");
  }

  const userSnap = await db.collection("users").doc(ownerUid).get();
  const teamId: string = userSnap.data()?.teamId ?? "";
  if (!teamId) {
    throw new functions.https.HttpsError("not-found", "No team found for this account");
  }

  const teamRef = db.collection("teams").doc(teamId);
  const teamSnap = await teamRef.get();
  const teamData = teamSnap.data() ?? {};

  if (teamData.ownerId !== ownerUid) {
    throw new functions.https.HttpsError("permission-denied", "Only the team owner can remove members");
  }

  const memberIds: string[] = teamData.memberIds ?? [];
  const pendingInvites: string[] = teamData.pendingInvites ?? [];

  const batch = db.batch();

  if (targetUid && memberIds.includes(targetUid)) {
    batch.update(teamRef, { memberIds: memberIds.filter((id) => id !== targetUid) });
    batch.set(db.collection("users").doc(targetUid), { teamId: admin.firestore.FieldValue.delete() }, { merge: true });
  } else if (targetEmail && pendingInvites.includes(targetEmail)) {
    batch.update(teamRef, { pendingInvites: pendingInvites.filter((e) => e !== targetEmail) });
  } else {
    throw new functions.https.HttpsError("not-found", "Member or invite not found");
  }

  await batch.commit();

  return { success: true };
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

// Creates a teams doc for a new team plan subscriber if one doesn't exist yet.
// Also writes teamId back to the owner's user doc so usePlan can resolve it.
async function ensureTeamDoc(ownerUid: string): Promise<void> {
  const userRef = db.collection("users").doc(ownerUid);
  const userSnap = await userRef.get();
  const existingTeamId: string = userSnap.data()?.teamId ?? "";

  if (existingTeamId) {
    // Team doc already exists — nothing to do
    const teamSnap = await db.collection("teams").doc(existingTeamId).get();
    if (teamSnap.exists) return;
  }

  const teamRef = db.collection("teams").doc();
  const now = new Date().toISOString();

  await teamRef.set({
    ownerId: ownerUid,
    memberIds: [],
    pendingInvites: [],
    seats: 5,
    createdAt: now,
  });

  await userRef.set({ teamId: teamRef.id }, { merge: true });
}
