export interface Folder {
  id: string;         // Firestore doc ID
  name: string;
  owner: string;      // Firebase UID
  teamId?: string;    // set when the folder belongs to a team
  createdAt: string;  // ISO
}
