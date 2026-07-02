import { useEffect, useState } from "react";
import { db, doc } from "../Backend/firebase";
import { getDoc } from "firebase/firestore";
import { Plan, PLAN_LIMITS } from "../Config/planLimits";

export interface BillingInfo {
  /** ISO date the current billing period ends (renewal or expiry date) */
  planExpiry: string | null;
  /** "monthly" | "yearly" */
  billingInterval: string | null;
  /** "active" | "trialing" | "past_due" — past_due = card failed, Stripe retrying */
  subscriptionStatus: string | null;
  /** true = user canceled; plan stays active until planExpiry then drops to free */
  cancelAtPeriodEnd: boolean;
}

interface PlanState extends BillingInfo {
  plan: Plan;
  limits: typeof PLAN_LIMITS[Plan];
  loading: boolean;
  hasStripeSubscription: boolean;
  teamId: string | null;
  isTeamOwner: boolean;
  canCreateProject: (currentCount: number) => boolean;
  canAddCue: (currentCount: number) => boolean;
  canUseCustomFields: () => boolean;
  canDragReorder: () => boolean;
  canUseAIImport: (usedThisMonth: number) => boolean;
}

const PLAN_CACHE_KEY        = "LIVECUE_PLAN";
const SUB_CACHE_KEY         = "LIVECUE_HAS_SUB";
const TEAM_CACHE_KEY        = "LIVECUE_TEAM";
const TEAM_OWNER_CACHE_KEY  = "LIVECUE_TEAM_OWNER";

const EMPTY_BILLING: BillingInfo = {
  planExpiry: null,
  billingInterval: null,
  subscriptionStatus: null,
  cancelAtPeriodEnd: false,
};

// Safety net: if the webhook missed a cancellation, a stale paid plan with a
// long-lapsed expiry should not keep granting access. 3-day cushion covers
// renewal-webhook delays and clock skew so we never cut off a paying user
// whose renewal is mid-flight.
const EXPIRY_GRACE_MS = 3 * 24 * 60 * 60 * 1000;

function isExpired(planExpiry: string | null | undefined): boolean {
  if (!planExpiry) return false; // no expiry recorded → trust the plan field
  return Date.now() > new Date(planExpiry).getTime() + EXPIRY_GRACE_MS;
}

export function usePlan(uid: string | null | undefined): PlanState {
  const cached = (sessionStorage.getItem(PLAN_CACHE_KEY) as Plan | null) ?? "free";
  const [plan, setPlan] = useState<Plan>(cached);
  const [hasStripeSubscription, setHasSub] = useState(
    sessionStorage.getItem(SUB_CACHE_KEY) === "1"
  );
  const [teamId, setTeamId] = useState<string | null>(sessionStorage.getItem(TEAM_CACHE_KEY));
  // isTeamOwner = true when this user is the one who purchased the team plan
  // false = they're a member who was invited
  const [isTeamOwner, setIsTeamOwner] = useState(
    sessionStorage.getItem(TEAM_OWNER_CACHE_KEY) === "1"
  );
  const [billing, setBilling] = useState<BillingInfo>(EMPTY_BILLING);
  const [loading, setLoading] = useState(!sessionStorage.getItem(PLAN_CACHE_KEY));

  useEffect(() => {
    if (!uid) {
      setPlan("free");
      setHasSub(false);
      setTeamId(null);
      setIsTeamOwner(false);
      setBilling(EMPTY_BILLING);
      sessionStorage.removeItem(PLAN_CACHE_KEY);
      sessionStorage.removeItem(SUB_CACHE_KEY);
      sessionStorage.removeItem(TEAM_CACHE_KEY);
      sessionStorage.removeItem(TEAM_OWNER_CACHE_KEY);
      setLoading(false);
      return;
    }

    let active = true;
    getDoc(doc(db, "users", uid))
      .then((snap) => {
        if (!active) return;
        if (snap.exists()) {
          const data = snap.data();
          const resolvedTeamId: string | null = data.teamId ?? null;

          // A paid Stripe plan whose expiry lapsed well past the grace window
          // is treated as free (webhook safety net). planOverride (manual
          // grants) is never expired this way.
          const stripePlan: Plan =
            data.plan && data.plan !== "free" && isExpired(data.planExpiry)
              ? "free"
              : (data.plan ?? "free");

          // Members inherit "team" plan via teamId even if their own plan is "free"
          const resolved: Plan = data.planOverride ?? (resolvedTeamId ? "team" : stripePlan);
          // Owner is the one whose own plan field is "team" (not just inherited via teamId)
          const owner = resolvedTeamId ? (stripePlan === "team" || data.planOverride === "team") : false;
          const hasSub = !!data.stripeSubscriptionId;

          setPlan(resolved);
          setHasSub(hasSub);
          setTeamId(resolvedTeamId);
          setIsTeamOwner(owner);
          setBilling({
            planExpiry:         data.planExpiry ?? null,
            billingInterval:    data.billingInterval ?? null,
            subscriptionStatus: data.subscriptionStatus ?? null,
            cancelAtPeriodEnd:  data.cancelAtPeriodEnd ?? false,
          });

          sessionStorage.setItem(PLAN_CACHE_KEY, resolved);
          sessionStorage.setItem(SUB_CACHE_KEY, hasSub ? "1" : "0");
          if (resolvedTeamId) {
            sessionStorage.setItem(TEAM_CACHE_KEY, resolvedTeamId);
            sessionStorage.setItem(TEAM_OWNER_CACHE_KEY, owner ? "1" : "0");
          } else {
            sessionStorage.removeItem(TEAM_CACHE_KEY);
            sessionStorage.removeItem(TEAM_OWNER_CACHE_KEY);
          }
        }
      })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [uid]);

  const limits = PLAN_LIMITS[plan];

  return {
    plan,
    limits,
    loading,
    hasStripeSubscription,
    teamId,
    isTeamOwner,
    ...billing,
    canCreateProject: (count) => limits.maxProjects === -1 || count < limits.maxProjects,
    canAddCue:        (count) => limits.maxCues === -1 || count < limits.maxCues,
    canUseCustomFields: ()    => limits.customFields,
    canDragReorder:   ()      => limits.dragReorder,
    canUseAIImport:   (used)  => limits.aiImportsPerMonth > 0 && used < limits.aiImportsPerMonth,
  };
}
