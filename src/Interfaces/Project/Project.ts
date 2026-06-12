import { Cue } from "../Cue/Cue";
import { CustomField } from "../CustomField/CustomField";

export interface Project {
  firebaseID: string;
  projectID: number;
  title: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  duration: Date;
  cues: Cue[];
  cueAmount: number;
  owner: string;
  fields: CustomField[];
}
