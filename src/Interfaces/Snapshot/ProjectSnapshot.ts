export interface SnapshotCue {
  cueNumber: number;
  title: string;
  startTime: string;
  endTime: string;
  isLive: boolean;
  fieldValues: Record<string, string>;
}

export interface ProjectSnapshot {
  id: string;
  projectRef: string;
  authorName: string;
  label: string;
  createdAt: string; // ISO
  cues: SnapshotCue[];
}
