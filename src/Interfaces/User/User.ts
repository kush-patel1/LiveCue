import { Plan } from "../../Config/planLimits";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  plan?: Plan;
  planOverride?: Plan;
  planExpiry?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}
