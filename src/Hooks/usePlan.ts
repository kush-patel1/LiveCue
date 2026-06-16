import { useEffect, useState } from "react";
import { db, doc } from "../Backend/firebase";
import { getDoc } from "firebase/firestore";
import { Plan, PLAN_LIMITS } from "../Config/planLimits";

interface PlanState {
  plan: Plan;
  limits: typeof PLAN_LIMITS[Plan];
  loading: boolean;
  canCreateProject: (currentCount: number) => boolean;
  canAddCue: (currentCount: number) => boolean;
  canUseCustomFields: () => boolean;
  canDragReorder: () => boolean;
  canUseAIImport: (usedThisMonth: number) => boolean;
}

const PLAN_CACHE_KEY = "LIVECUE_PLAN";

export function usePlan(uid: string | null | undefined): PlanState {
  const cached = (sessionStorage.getItem(PLAN_CACHE_KEY) as Plan | null) ?? "free";
  const [plan, setPlan] = useState<Plan>(cached);
  const [loading, setLoading] = useState(!sessionStorage.getItem(PLAN_CACHE_KEY));

  useEffect(() => {
    if (!uid) {
      setPlan("free");
      sessionStorage.removeItem(PLAN_CACHE_KEY);
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
          setPlan(resolved);
          sessionStorage.setItem(PLAN_CACHE_KEY, resolved);
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
    canCreateProject: (count) => limits.maxProjects === -1 || count < limits.maxProjects,
    canAddCue:        (count) => limits.maxCues === -1 || count < limits.maxCues,
    canUseCustomFields: ()    => limits.customFields,
    canDragReorder:   ()      => limits.dragReorder,
    canUseAIImport:   (used)  => limits.aiImportsPerMonth > 0 && used < limits.aiImportsPerMonth,
  };
}
