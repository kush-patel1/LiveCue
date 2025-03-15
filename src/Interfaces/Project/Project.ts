import { Cue } from "../Cue/Cue";

export interface Project {
  id: string;
  projectID: number;
  title: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  duration: Date;
  cues: Cue[];
  cueAmount: number;
}
