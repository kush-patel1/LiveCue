import { useEffect, useState } from "react";
import { db, doc } from "../Backend/firebase";
import { onSnapshot } from "firebase/firestore";
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

export function usePlan(uid: string | null | undefined): PlanState {
  const [plan, setPlan] = useState<Plan>("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setPlan("free");
      setLoading(false);
      return;
    }

    let active = true;

    const userRef = doc(db, "users", uid);
    const unsubscribe = onSnapshot(
      userRef,
      (snap) => {
        if (!active) return;
        if (snap.exists()) {
          const data = snap.data();
          const resolved: Plan = data.planOverride ?? data.plan ?? "free";
          setPlan(resolved);
        }
        setLoading(false);
      },
      () => {
        if (active) setLoading(false);
      }
    );

    return () => {
      active = false;
      unsubscribe();
    };
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
