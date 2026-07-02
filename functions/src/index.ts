import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Stripe = require("stripe");
type StripeClient = ReturnType<typeof Stripe>;

admin.initializeApp();
const db = admin.firestore();

// ---------------------------------------------------------------------------
// Stripe client — lazy, reads secret at call time (never baked into bundle).
// Set secrets with:
//   firebase functions:secrets:set STRIPE_SECRET_KEY
//   firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
// ---------------------------------------------------------------------------
function getStripe(): StripeClient {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) throw new Error("STRIPE_SECRET_KEY not set");
  return new Stripe(key, { apiVersion: "2026-05-27.dahlia" });
}

// ---------------------------------------------------------------------------
// Price → plan mapping.
// Fill these in after creating products in the Stripe dashboard (test mode
// first — swap for live IDs at launch).
//   Pro monthly  $14/mo   |  Pro yearly  $120/yr
//   Team monthly $39/mo   |  Team yearly $349/yr
// ---------------------------------------------------------------------------
const PRO_PRICE_IDS:  string[] = ["price_1TiraGRtA2YJiCC5UrJeJQQn", "price_1ToWgRRtA2YJiCC5JKm2hmJK"]; // ["price_..." (monthly), "price_..." (yearly)]
const TEAM_PRICE_IDS: string[] = ["price_1TiralRtA2YJiCC5DHkyCLKr", "price_1ToWhLRtA2YJiCC5jS10xOgA"]; // ["price_..." (monthly), "price_..." (yearly)]

function resolvePlanFromPriceId(priceId: string): "pro" | "team" | null {
  if (TEAM_PRICE_IDS.includes(priceId)) return "team";
  if (PRO_PRICE_IDS.includes(priceId))  return "pro";
  // Unknown price ID — do NOT grant a paid tier off an unrecognized price.
  // Returning null makes the caller skip the plan write and log it instead.
  console.error(`resolvePlanFromPriceId: unrecognized price ${priceId} — no plan granted`);
  return null;
}

// ---------------------------------------------------------------------------
// applyGrant
// Called on login. Checks the private _grants collection (admin SDK only —
// clients can never read or write it) and writes planOverride to the user doc.
// ---------------------------------------------------------------------------
export const applyGrant = functions.https.onCall(async (_, context) => {
  if (!context.auth) return { applied: false };
  const uid   = context.auth.uid;
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
// createPortalSession
// Returns a Stripe Customer Portal URL so the user can manage / cancel their
// subscription. The return URL is hardcoded server-side to prevent open-redirect
// phishing — never pass it from the client.
// ---------------------------------------------------------------------------
export const createPortalSession = functions
  .runWith({ secrets: ["STRIPE_SECRET_KEY"] })
  .https.onCall(async (_data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Must be logged in");
    }

    const uid      = context.auth.uid;
    const userSnap = await db.collection("users").doc(uid).get();
    const customerId: string = userSnap.data()?.stripeCustomerId ?? "";

    if (!customerId) {
      throw new functions.https.HttpsError(
        "not-found",
        "No Stripe customer found — have you completed a purchase?"
      );
    }

    const stripe  = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer:   customerId,
      return_url: "https://live-cue.com/#/settings",
    });

    return { url: session.url as string };
  });

// ---------------------------------------------------------------------------
// stripeWebhook
// Stripe calls this HTTPS endpoint after payment events.
// Register the URL in Stripe Dashboard → Webhooks. Enable:
//   checkout.session.completed
//   customer.subscription.updated
//   customer.subscription.deleted
//
// Architecture note: we use Stripe Payment Links (not Checkout Sessions API)
// so createCheckoutSession is gone. Payment Links pass ?client_reference_id=UID
// in the URL — append it on the frontend when building the link.
// ---------------------------------------------------------------------------
export const stripeWebhook = functions
  .runWith({ secrets: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"] })
  .https.onRequest(async (req, res) => {
    // trim() — a trailing newline sneaks in easily when pasting the secret
    // into `firebase functions:secrets:set` and breaks signature verification
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
    if (!webhookSecret) {
      res.status(500).send("STRIPE_WEBHOOK_SECRET not set");
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

      // Fires when a Payment Link checkout completes.
      // We save Stripe IDs here so the portal and subscription events can
      // find this user. Plan tier is set by customer.subscription.updated
      // which Stripe always fires immediately after.
      case "checkout.session.completed": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const session = event.data.object as any;

        // Payment Link must include ?client_reference_id=<firebaseUID> — this
        // is the only UID source. No email fallback: it's unreliable and
        // requires an extra Firestore index.
        const uid: string | null = session.client_reference_id ?? null;
        console.log(`checkout.session.completed: uid=${uid} customer=${session.customer} sub=${session.subscription}`);
        if (!uid) break;

        const update: Record<string, string> = {};
        if (session.customer)    update.stripeCustomerId     = session.customer;
        if (session.subscription) update.stripeSubscriptionId = session.subscription;

        if (Object.keys(update).length) {
          await db.collection("users").doc(uid).set(update, { merge: true });
        }
        break;
      }

      // Fires when a subscription is created, renewed, upgraded, downgraded,
      // set to cancel, or moves to past_due/unpaid. The full subscription
      // object is in the payload — no outbound API call needed.
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sub  = event.data.object as any;
        const uid  = await resolveUidFromSub(sub);
        console.log(`${event.type}: sub=${sub.id} status=${sub.status} uid=${uid ?? "NOT FOUND"}`);
        if (!uid) break;
        await syncSubscriptionToUser(uid, sub);
        break;
      }

      case "customer.subscription.deleted": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sub = event.data.object as any;
        const uid = await resolveUidFromSub(sub);
        if (uid) await downgradeToFree(uid);
        break;
      }
    }

    res.json({ received: true });
  });

// ---------------------------------------------------------------------------
// Subscription → user doc sync.
//
// Status handling:
//   active / trialing → full access; plan + expiry + interval written
//   past_due          → GRACE PERIOD: keep the plan (Stripe retries the card
//                       for ~2 weeks); subscriptionStatus lets the UI warn
//   unpaid / canceled / incomplete_expired → downgrade to free
//
// Plan changes (upgrade Pro→Team, downgrade Team→Pro, monthly↔yearly) all
// arrive as customer.subscription.updated with the new price ID, so this one
// function covers them: the plan is always derived from the current price.
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function syncSubscriptionToUser(uid: string, sub: any): Promise<void> {
  if (["unpaid", "canceled", "incomplete_expired"].includes(sub.status)) {
    await downgradeToFree(uid);
    return;
  }
  if (!["active", "trialing", "past_due"].includes(sub.status)) return; // ignore incomplete

  const item       = sub.items?.data?.[0];
  const priceId    = item?.price?.id ?? "";
  const plan       = resolvePlanFromPriceId(priceId);
  // Unrecognized price → don't touch the user's plan (already logged in the
  // resolver). Bail before writing anything.
  if (!plan) return;
  // "month" | "year" from the price itself — tells us which billing cycle
  const interval   = item?.price?.recurring?.interval === "year" ? "yearly" : "monthly";
  // current_period_end moved from the sub to the item in newer API versions
  const periodEnd  = item?.current_period_end ?? sub.current_period_end;
  const planExpiry = periodEnd ? new Date(periodEnd * 1000).toISOString() : null;

  const update = {
    plan,
    planExpiry,
    billingInterval:      interval,
    subscriptionStatus:   sub.status,                    // "active" | "trialing" | "past_due"
    cancelAtPeriodEnd:    sub.cancel_at_period_end ?? false, // user canceled; access until expiry
    stripeSubscriptionId: sub.id,
  };

  // Idempotency: skip the write if nothing changed
  const userRef  = db.collection("users").doc(uid);
  const existing = (await userRef.get()).data() ?? {};
  const dirty = Object.entries(update).some(
    ([k, v]) => (existing as Record<string, unknown>)[k] !== v
  );
  console.log(`syncSubscriptionToUser: uid=${uid} plan=${plan} interval=${interval} status=${sub.status} dirty=${dirty}`);
  if (dirty) await userRef.set(update, { merge: true });

  if (plan === "team") await ensureTeamDoc(uid);
}

async function downgradeToFree(uid: string): Promise<void> {
  await db.collection("users").doc(uid).set({
    plan: "free",
    planExpiry: null,
    billingInterval: null,
    subscriptionStatus: null,
    cancelAtPeriodEnd: false,
    stripeSubscriptionId: null,
  }, { merge: true });
}

// ---------------------------------------------------------------------------
// Team management — invite / accept / remove
// ---------------------------------------------------------------------------

export const inviteTeamMember = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Must be logged in");
  }

  const inviteeEmail = (data.email ?? "").trim().toLowerCase();
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

  const teamRef  = db.collection("teams").doc(teamId);
  const teamSnap = await teamRef.get();
  const teamData = teamSnap.data() ?? {};

  if (teamData.ownerId !== ownerUid) {
    throw new functions.https.HttpsError("permission-denied", "Only the team owner can invite members");
  }

  const memberIds:     string[] = teamData.memberIds     ?? [];
  const pendingInvites: string[] = teamData.pendingInvites ?? [];
  const seats:          number   = teamData.seats         ?? 5;

  if (memberIds.length >= seats - 1) {
    throw new functions.https.HttpsError("resource-exhausted", "All team seats are full");
  }
  if (pendingInvites.includes(inviteeEmail)) {
    throw new functions.https.HttpsError("already-exists", "An invite is already pending for this email");
  }

  // Check if already a member
  const existingSnap = await db.collection("users").where("email", "==", inviteeEmail).limit(1).get();
  if (!existingSnap.empty && existingSnap.docs[0].data().teamId === teamId) {
    throw new functions.https.HttpsError("already-exists", "This user is already on your team");
  }

  await teamRef.update({ pendingInvites: [...pendingInvites, inviteeEmail] });

  await admin.auth().generateSignInWithEmailLink(inviteeEmail, {
    url: `https://live-cue.com/#/accept-invite?teamId=${teamId}`,
    handleCodeInApp: true,
  });

  return { success: true };
});

export const acceptTeamInvite = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Must be logged in");
  }

  const teamId = (data.teamId ?? "").trim();
  if (!teamId) {
    throw new functions.https.HttpsError("invalid-argument", "teamId is required");
  }

  const inviteeUid   = context.auth.uid;
  const inviteeEmail = (context.auth.token.email ?? "").toLowerCase();

  const teamRef  = db.collection("teams").doc(teamId);
  const teamSnap = await teamRef.get();

  if (!teamSnap.exists) {
    throw new functions.https.HttpsError("not-found", "Team not found");
  }

  const teamData       = teamSnap.data()!;
  const pendingInvites: string[] = teamData.pendingInvites ?? [];

  if (!pendingInvites.includes(inviteeEmail)) {
    throw new functions.https.HttpsError("permission-denied", "No pending invite found for your email");
  }

  const memberIds: string[] = teamData.memberIds ?? [];
  const seats:     number   = teamData.seats     ?? 5;

  if (memberIds.length >= seats - 1) {
    throw new functions.https.HttpsError("resource-exhausted", "Team is full — ask your team owner to free up a seat");
  }

  const batch = db.batch();
  batch.update(teamRef, {
    pendingInvites: pendingInvites.filter((e) => e !== inviteeEmail),
    memberIds:      [...memberIds, inviteeUid],
  });
  batch.set(db.collection("users").doc(inviteeUid), { teamId }, { merge: true });
  await batch.commit();

  return { success: true, teamId };
});

export const removeTeamMember = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Must be logged in");
  }

  const ownerUid    = context.auth.uid;
  const targetUid:   string | undefined = data.uid;
  const targetEmail: string | undefined = (data.email ?? "").trim().toLowerCase() || undefined;

  if (!targetUid && !targetEmail) {
    throw new functions.https.HttpsError("invalid-argument", "uid or email is required");
  }

  const userSnap = await db.collection("users").doc(ownerUid).get();
  const teamId:  string = userSnap.data()?.teamId ?? "";
  if (!teamId) {
    throw new functions.https.HttpsError("not-found", "No team found for this account");
  }

  const teamRef  = db.collection("teams").doc(teamId);
  const teamSnap = await teamRef.get();
  const teamData = teamSnap.data() ?? {};

  if (teamData.ownerId !== ownerUid) {
    throw new functions.https.HttpsError("permission-denied", "Only the team owner can remove members");
  }

  const memberIds:     string[] = teamData.memberIds     ?? [];
  const pendingInvites: string[] = teamData.pendingInvites ?? [];
  const batch = db.batch();

  if (targetUid && memberIds.includes(targetUid)) {
    batch.update(teamRef, { memberIds: memberIds.filter((id) => id !== targetUid) });
    batch.set(
      db.collection("users").doc(targetUid),
      { teamId: admin.firestore.FieldValue.delete() },
      { merge: true }
    );
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

async function resolveUidFromSub(sub: any): Promise<string | null> { // eslint-disable-line @typescript-eslint/no-explicit-any
  if (sub.metadata?.firebaseUID) return sub.metadata.firebaseUID as string;
  const snap = await db.collection("users").where("stripeSubscriptionId", "==", sub.id).limit(1).get();
  return snap.empty ? null : snap.docs[0].id;
}

async function ensureTeamDoc(ownerUid: string): Promise<void> {
  const userRef  = db.collection("users").doc(ownerUid);
  const userSnap = await userRef.get();
  const existingTeamId: string = userSnap.data()?.teamId ?? "";

  if (existingTeamId) {
    const teamSnap = await db.collection("teams").doc(existingTeamId).get();
    if (teamSnap.exists) return;
  }

  const teamRef = db.collection("teams").doc();
  await teamRef.set({
    ownerId:        ownerUid,
    memberIds:      [],
    pendingInvites: [],
    seats:          5,
    createdAt:      new Date().toISOString(),
  });

  await userRef.set({ teamId: teamRef.id }, { merge: true });
}
