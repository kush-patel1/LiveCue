import { getFunctions, httpsCallable } from "firebase/functions";

const functions = getFunctions();

interface InviteResult  { success: boolean; inviteLink: string }
interface AcceptResult  { success: boolean; teamId: string }
interface RemoveResult  { success: boolean }
interface ClaimResult   { claimed: boolean; teamId?: string }

export async function inviteTeamMember(email: string): Promise<InviteResult> {
  const fn = httpsCallable<{ email: string }, InviteResult>(functions, "inviteTeamMember");
  const { data } = await fn({ email });
  return data;
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

export async function leaveTeam(): Promise<void> {
  const fn = httpsCallable<Record<string, never>, RemoveResult>(functions, "leaveTeam");
  await fn({});
}

/** Auto-join any team that has a pending invite for the signed-in user's email. */
export async function claimMyInvite(): Promise<ClaimResult> {
  try {
    const fn = httpsCallable<Record<string, never>, ClaimResult>(functions, "claimMyInvite");
    const { data } = await fn({});
    return data;
  } catch {
    return { claimed: false };
  }
}
