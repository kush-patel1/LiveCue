export interface Cue {
  id: string;
  cueNumber: number;
  title: string;
  startTime: string; // ISO string for consistent serialization
  endTime: string;   // ISO string for consistent serialization
  projectRef: string | undefined;
  isLive: boolean;
  fieldValues: Record<string, string>;
  actualStartTime?: string; // set when cue goes live — used for drift calculation
}
