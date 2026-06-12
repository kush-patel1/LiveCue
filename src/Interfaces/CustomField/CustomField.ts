export interface CustomField {
  id: string;
  label: string;
  type: "text" | "time";
}

export const DEFAULT_FIELDS: CustomField[] = [
  { id: "presenter", label: "Presenter", type: "text" },
  { id: "location", label: "Location", type: "text" },
  { id: "avMedia", label: "AV Media", type: "text" },
  { id: "audioSource", label: "Audio Source", type: "text" },
  { id: "sideScreens", label: "Side Screens", type: "text" },
  { id: "centerScreen", label: "Center Screen", type: "text" },
  { id: "lighting", label: "Lighting", type: "text" },
  { id: "ambientLights", label: "Ambient Lights", type: "text" },
  { id: "notes", label: "Notes", type: "text" },
];
