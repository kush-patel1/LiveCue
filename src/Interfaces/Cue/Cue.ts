export interface Cue {
  id: string;
  cueNumber: number;
  title: string;
  startTime: Date;
  endTime: Date;
  presenter: string;
  location: string;
  avMedia: string;
  audioSource: string;
  sideScreens: string;
  centerScreen: string;
  lighting: string;
  ambientLights: string;
  notes: string;
  projectRef: string | undefined;
  isLive: boolean;
}
