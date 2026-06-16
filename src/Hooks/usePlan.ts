import { useEffect, useState } from "react";
import { db, doc } from "../Backend/firebase";
import { getDoc } from "firebase/firestore";
import { Plan, PLAN_LIMITS } from "../Config/planLimits";

interface PlanState {
  plan: Plan;
  limits: typeof PLAN_LIMITS[Plan];
  loading: boolean;
  hasStripeSubscription: boolean;
  canCreateProject: (currentCount: number) => boolean;
  canAddCue: (currentCount: number) => boolean;
  canUseCustomFields: () => boolean;
  canDragReorder: () => boolean;
  canUseAIImport: (usedThisMonth: number) => boolean;
}

const PLAN_CACHE_KEY = "LIVECUE_PLAN";
const SUB_CACHE_KEY  = "LIVECUE_HAS_SUB";

export function usePlan(uid: string | null | undefined): PlanState {
  const cached = (sessionStorage.getItem(PLAN_CACHE_KEY) as Plan | null) ?? "free";
  const [plan, setPlan] = useState<Plan>(cached);
  const [hasStripeSubscription, setHasSub] = useState(
    sessionStorage.getItem(SUB_CACHE_KEY) === "1"
  );
  const [loading, setLoading] = useState(!sessionStorage.getItem(PLAN_CACHE_KEY));

  useEffect(() => {
    if (!uid) {
      setPlan("free");
      setHasSub(false);
      sessionStorage.removeItem(PLAN_CACHE_KEY);
      sessionStorage.removeItem(SUB_CACHE_KEY);
      setLoading(false);
      return;
    }

    let active = true;
    getDoc(doc(db, "users", uid))
      .then((snap) => {
        if (!active) return;
        if (snap.exists()) {
          const data = snap.data();
          const resolved: Plan = data.planOverride ?? data.plan ?? "free";
          const hasSub = !!data.stripeSubscriptionId;
          setPlan(resolved);
          setHasSub(hasSub);
          sessionStorage.setItem(PLAN_CACHE_KEY, resolved);
          sessionStorage.setItem(SUB_CACHE_KEY, hasSub ? "1" : "0");
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
    canCreateProject: (count) => limits.maxProjects === -1 || count < limits.maxProjects,
    canAddCue:        (count) => limits.maxCues === -1 || count < limits.maxCues,
    canUseCustomFields: ()    => limits.customFields,
    canDragReorder:   ()      => limits.dragReorder,
    canUseAIImport:   (used)  => limits.aiImportsPerMonth > 0 && used < limits.aiImportsPerMonth,
  };
}
