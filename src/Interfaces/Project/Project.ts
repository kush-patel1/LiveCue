import { Cue } from "../Cue/Cue";

export interface Project {
  id: number;
  title: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  duration: Date;
  cues: Cue[];
  cueAmount: number;
}
