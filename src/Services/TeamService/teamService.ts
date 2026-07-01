import { getFunctions, httpsCallable } from "firebase/functions";

const functions = getFunctions();

interface InviteResult  { success: boolean }
interface AcceptResult  { success: boolean; teamId: string }
interface RemoveResult  { success: boolean }

export async function inviteTeamMember(email: string): Promise<void> {
  const fn = httpsCallable<{ email: string }, InviteResult>(functions, "inviteTeamMember");
  await fn({ email });
}

export async function acceptTeamInvite(teamId: string): Promise<AcceptResult> {
  const fn = httpsCallable<{ teamId: string }, AcceptResult>(functions, "acceptTeamInvite");
  const { data } = await fn({ teamId });
  return data;
}

export async function removeTeamMember(params: { uid?: string; email?: string }): Promise<void> {
  const fn = httpsCallable<{ uid?: string; email?: string }, RemoveResult>(functions, "removeTeamMember");
  await fn(params);
}
