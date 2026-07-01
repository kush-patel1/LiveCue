export interface Team {
  id: string;               // Firestore doc ID (auto-generated)
  ownerId: string;          // Firebase UID of the team plan subscriber
  memberIds: string[];      // UIDs of accepted members (excludes owner)
  pendingInvites: string[]; // lowercase emails awaiting acceptance
  seats: number;            // max seats (from plan limits — currently 5)
  createdAt: string;        // ISO timestamp
}
