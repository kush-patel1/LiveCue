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

  // If this user owned a team, tearing down their subscription must revoke
  // every member's access too — otherwise members keep team access for free.
  await dismantleTeamOwnedBy(uid);
}

// When an owner loses the team plan, remove the team and strip teamId from the
// owner and all members so usePlan resolves everyone back to free.
async function dismantleTeamOwnedBy(ownerUid: string): Promise<void> {
  const teamsSnap = await db.collection("teams").where("ownerId", "==", ownerUid).get();
  if (teamsSnap.empty) return;

  for (const teamDoc of teamsSnap.docs) {
    const data = teamDoc.data();
    const memberIds: string[] = data.memberIds ?? [];
    const batch = db.batch();
    for (const memberUid of memberIds) {
      batch.set(
        db.collection("users").doc(memberUid),
        { teamId: admin.firestore.FieldValue.delete() },
        { merge: true }
      );
    }
    batch.set(
      db.collection("users").doc(ownerUid),
      { teamId: admin.firestore.FieldValue.delete() },
      { merge: true }
    );
    batch.delete(teamDoc.ref);
    await batch.commit();
  }
}

// ---------------------------------------------------------------------------
// Team management — invite / accept / remove
// ---------------------------------------------------------------------------

export const inviteTeamMember = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Must be logged in");
  }

  const inviteeEmail = (data.email ?? "").trim().toLowerCase();
  if (!inviteeEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(inviteeEmail)) {
    throw new functions.https.HttpsError("invalid-argument", "A valid email is required");
  }

  const ownerUid = context.auth.uid;
  const userSnap = await db.collection("users").doc(ownerUid).get();
  const userData = userSnap.data() ?? {};

  if ((userData.planOverride ?? userData.plan) !== "team") {
    throw new functions.https.HttpsError("permission-denied", "Team plan required to invite members");
  }
  if (inviteeEmail === (context.auth.token.email ?? "").toLowerCase()) {
    throw new functions.https.HttpsError("already-exists", "You're already the team owner");
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

  const memberIds:      string[] = teamData.memberIds     ?? [];
  const pendingInvites: string[] = teamData.pendingInvites ?? [];
  const seats:          number   = teamData.seats         ?? 5;

  // Seat math: owner + members + already-pending invites all consume a seat.
  if (memberIds.length + pendingInvites.length + 1 >= seats) {
    throw new functions.https.HttpsError("resource-exhausted", "All team seats are allocated");
  }
  if (pendingInvites.includes(inviteeEmail)) {
    throw new functions.https.HttpsError("already-exists", "An invite is already pending for this email");
  }

  // Already a member of THIS team?
  const existingSnap = await db.collection("users").where("email", "==", inviteeEmail).limit(1).get();
  if (!existingSnap.empty && existingSnap.docs[0].data().teamId === teamId) {
    throw new functions.https.HttpsError("already-exists", "This person is already on your team");
  }

  await teamRef.update({ pendingInvites: [...pendingInvites, inviteeEmail] });

  // We don't send email ourselves (no provider configured). The client shows a
  // copyable invite link, AND the invitee auto-joins when they sign in/up with
  // this email (claimMyInvite). Return the link for the owner to share.
  return {
    success: true,
    inviteLink: `https://live-cue.com/#/accept-invite?teamId=${teamId}`,
  };
});

// Shared join logic — adds the authed user to a team by their token email.
async function joinTeam(teamId: string, uid: string, email: string, displayName: string): Promise<void> {
  const teamRef  = db.collection("teams").doc(teamId);
  const teamSnap = await teamRef.get();
  if (!teamSnap.exists) {
    throw new functions.https.HttpsError("not-found", "Team not found");
  }

  const teamData        = teamSnap.data()!;
  const pendingInvites: string[] = teamData.pendingInvites ?? [];
  const memberIds:      string[] = teamData.memberIds ?? [];

  if (memberIds.includes(uid)) return; // already a member — idempotent

  if (!pendingInvites.includes(email)) {
    throw new functions.https.HttpsError("permission-denied", "No pending invite found for your email");
  }
  const seats: number = teamData.seats ?? 5;
  if (memberIds.length + 1 >= seats) {
    throw new functions.https.HttpsError("resource-exhausted", "Team is full — ask your team owner to free up a seat");
  }

  // Leave any previous team first so we don't orphan a seat there.
  const userSnap = await db.collection("users").doc(uid).get();
  const priorTeamId: string = userSnap.data()?.teamId ?? "";
  const batch = db.batch();
  if (priorTeamId && priorTeamId !== teamId) {
    batch.set(db.collection("teams").doc(priorTeamId), {
      memberIds: admin.firestore.FieldValue.arrayRemove(uid),
      [`memberInfo.${uid}`]: admin.firestore.FieldValue.delete(),
    }, { merge: true });
  }

  batch.set(teamRef, {
    pendingInvites: pendingInvites.filter((e) => e !== email),
    memberIds:      admin.firestore.FieldValue.arrayUnion(uid),
    // Parallel display map so the owner sees who joined (memberIds stays a
    // plain string[] so the Firestore rules' hasAny() check keeps working).
    [`memberInfo.${uid}`]: { email, displayName: displayName || email },
  }, { merge: true });
  batch.set(db.collection("users").doc(uid), { teamId }, { merge: true });
  await batch.commit();
}

export const acceptTeamInvite = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Must be logged in");
  }
  const teamId = (data.teamId ?? "").trim();
  if (!teamId) {
    throw new functions.https.HttpsError("invalid-argument", "teamId is required");
  }
  const email = (context.auth.token.email ?? "").toLowerCase();
  const name  = (context.auth.token.name as string) ?? "";
  await joinTeam(teamId, context.auth.uid, email, name);
  return { success: true, teamId };
});

// Called on login/signup — auto-joins the user to any team that has a pending
// invite for their email, so they don't need the invite link at all.
export const claimMyInvite = functions.https.onCall(async (_data, context) => {
  if (!context.auth) return { claimed: false };
  const email = (context.auth.token.email ?? "").toLowerCase();
  if (!email) return { claimed: false };

  const snap = await db.collection("teams").where("pendingInvites", "array-contains", email).limit(1).get();
  if (snap.empty) return { claimed: false };

  const name = (context.auth.token.name as string) ?? "";
  try {
    await joinTeam(snap.docs[0].id, context.auth.uid, email, name);
    return { claimed: true, teamId: snap.docs[0].id };
  } catch {
    return { claimed: false };
  }
});

// A member removes themselves from their team.
export const leaveTeam = functions.https.onCall(async (_data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Must be logged in");
  }
  const uid      = context.auth.uid;
  const userSnap = await db.collection("users").doc(uid).get();
  const teamId: string = userSnap.data()?.teamId ?? "";
  if (!teamId) {
    throw new functions.https.HttpsError("not-found", "You're not on a team");
  }

  const teamRef  = db.collection("teams").doc(teamId);
  const teamSnap = await teamRef.get();
  if (teamSnap.exists && teamSnap.data()!.ownerId === uid) {
    throw new functions.https.HttpsError("failed-precondition",
      "The team owner can't leave. Cancel the Team subscription instead.");
  }

  const batch = db.batch();
  batch.set(teamRef, {
    memberIds: admin.firestore.FieldValue.arrayRemove(uid),
    [`memberInfo.${uid}`]: admin.firestore.FieldValue.delete(),
  }, { merge: true });
  batch.set(db.collection("users").doc(uid), { teamId: admin.firestore.FieldValue.delete() }, { merge: true });
  await batch.commit();
  return { success: true };
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
    batch.set(teamRef, {
      memberIds: memberIds.filter((id) => id !== targetUid),
      [`memberInfo.${targetUid}`]: admin.firestore.FieldValue.delete(),
    }, { merge: true });
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

const TEAM_SEATS = 5;

async function ensureTeamDoc(ownerUid: string): Promise<void> {
  const userRef  = db.collection("users").doc(ownerUid);
  const userSnap = await userRef.get();
  const userData = userSnap.data() ?? {};
  const existingTeamId: string = userData.teamId ?? "";

  const ownerInfo = {
    email: (userData.email ?? "").toLowerCase(),
    displayName: [userData.firstName, userData.lastName].filter(Boolean).join(" ") || (userData.email ?? ""),
  };

  if (existingTeamId) {
    const teamSnap = await db.collection("teams").doc(existingTeamId).get();
    if (teamSnap.exists) {
      // Keep owner display info fresh
      await teamSnap.ref.set({ ownerInfo }, { merge: true });
      return;
    }
  }

  const teamRef = db.collection("teams").doc();
  await teamRef.set({
    ownerId:        ownerUid,
    ownerInfo,
    memberIds:      [],
    memberInfo:     {},
    pendingInvites: [],
    seats:          TEAM_SEATS,
    createdAt:      new Date().toISOString(),
  });

  await userRef.set({ teamId: teamRef.id }, { merge: true });
}
