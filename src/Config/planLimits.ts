export type Plan = "free" | "pro" | "team";

export const PLAN_LIMITS: Record<Plan, {
  maxProjects: number;   // -1 = unlimited
  maxCues: number;       // -1 = unlimited
  aiImportsPerMonth: number;
  customFields: boolean;
  dragReorder: boolean;
  teamSeats: number;
}> = {
  free: {
    maxProjects: 1,
    maxCues: 5,
    aiImportsPerMonth: 0,
    customFields: false,
    dragReorder: false,
    teamSeats: 1,
  },
  pro: {
    maxProjects: -1,
    maxCues: -1,
    aiImportsPerMonth: 10,
    customFields: true,
    dragReorder: true,
    teamSeats: 1,
  },
  team: {
    maxProjects: -1,
    maxCues: -1,
    aiImportsPerMonth: 50,
    customFields: true,
    dragReorder: true,
    teamSeats: 5,
  },
};
