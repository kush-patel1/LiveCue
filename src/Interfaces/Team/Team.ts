export type TeamRole = "editor" | "operator" | "viewer";

export interface TeamMemberInfo {
  email: string;
  displayName: string;
  role?: TeamRole; // defaults to "editor" for members joined before roles existed
}

export interface Team {
  id: string;               // Firestore doc ID (auto-generated)
  ownerId: string;          // Firebase UID of the team plan subscriber
  ownerInfo?: TeamMemberInfo;
  memberIds: string[];      // UIDs of accepted members (excludes owner)
  memberInfo?: Record<string, TeamMemberInfo>; // uid -> display info
  pendingInvites: string[]; // lowercase emails awaiting acceptance
  seats: number;            // max seats (from plan limits — currently 5)
  createdAt: string;        // ISO timestamp
}
