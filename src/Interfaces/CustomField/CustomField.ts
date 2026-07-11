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

// A user can customize which cue fields new projects start with, saved per
// browser under this key. Falls back to DEFAULT_FIELDS when unset/invalid.
export const DEFAULT_FIELDS_KEY = "lc_default_fields";

export function getUserDefaultFields(): CustomField[] {
  try {
    const raw = localStorage.getItem(DEFAULT_FIELDS_KEY);
    if (!raw) return DEFAULT_FIELDS;
    const parsed = JSON.parse(raw);
    if (
      Array.isArray(parsed) &&
      parsed.length > 0 &&
      parsed.every((f) => f && typeof f.id === "string" && typeof f.label === "string")
    ) {
      return parsed.map((f) => ({
        id: f.id,
        label: f.label,
        type: f.type === "time" ? "time" : "text",
      }));
    }
  } catch {
    /* fall through to defaults */
  }
  return DEFAULT_FIELDS;
}

export function saveUserDefaultFields(fields: CustomField[]): void {
  localStorage.setItem(DEFAULT_FIELDS_KEY, JSON.stringify(fields));
}
