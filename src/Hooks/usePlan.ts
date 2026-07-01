import { useEffect, useState } from "react";
import { db, doc } from "../Backend/firebase";
import { getDoc } from "firebase/firestore";
import { Plan, PLAN_LIMITS } from "../Config/planLimits";

interface PlanState {
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
  const [loading, setLoading] = useState(!sessionStorage.getItem(PLAN_CACHE_KEY));

  useEffect(() => {
    if (!uid) {
      setPlan("free");
      setHasSub(false);
      setTeamId(null);
      setIsTeamOwner(false);
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
          // Members inherit "team" plan via teamId even if their own plan is "free"
          const resolved: Plan = data.planOverride ?? (resolvedTeamId ? "team" : (data.plan ?? "free"));
          // Owner is the one whose own plan field is "team" (not just inherited via teamId)
          const owner = resolvedTeamId ? (data.plan === "team" || data.planOverride === "team") : false;
          const hasSub = !!data.stripeSubscriptionId;
          setPlan(resolved);
          setHasSub(hasSub);
          setTeamId(resolvedTeamId);
          setIsTeamOwner(owner);
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
    canCreateProject: (count) => limits.maxProjects === -1 || count < limits.maxProjects,
    canAddCue:        (count) => limits.maxCues === -1 || count < limits.maxCues,
    canUseCustomFields: ()    => limits.customFields,
    canDragReorder:   ()      => limits.dragReorder,
    canUseAIImport:   (used)  => limits.aiImportsPerMonth > 0 && used < limits.aiImportsPerMonth,
  };
}
