import { Cue } from "../Interfaces/Cue/Cue";
import { CustomField } from "../Interfaces/CustomField/CustomField";

// ---------------------------------------------------------------------------
// Sample data for the sandboxed demo. Everything here is in-memory only —
// the demo pages seed their local React state from these and never touch
// Firestore, so any edits a visitor makes are discarded on refresh.
// ---------------------------------------------------------------------------

export const DEMO_PROJECT_ID = "demo-project";

export const DEMO_TITLE = "Spring Gala 2026 — Main Stage";

// A fixed show date so the demo is deterministic (no Date.now() surprises).
export const DEMO_DATE = new Date("2026-05-16T00:00:00");

export const DEMO_FIELDS: CustomField[] = [
  { id: "presenter", label: "Presenter", type: "text" },
  { id: "location", label: "Location", type: "text" },
  { id: "avMedia", label: "AV / Media", type: "text" },
  { id: "lighting", label: "Lighting", type: "text" },
  { id: "notes", label: "Notes", type: "text" },
];

// Build an ISO timestamp on the demo date at the given local time.
function at(hh: number, mm: number): string {
  const d = new Date(DEMO_DATE);
  d.setHours(hh, mm, 0, 0);
  return d.toISOString();
}

export function makeDemoCues(): Cue[] {
  return [
    {
      id: "d1", cueNumber: 1, title: "Doors Open & Pre-Show Music",
      startTime: at(18, 0), endTime: at(18, 30), projectRef: DEMO_PROJECT_ID, isLive: true,
      actualStartTime: at(18, 0),
      fieldValues: {
        presenter: "—", location: "Lobby + House", avMedia: "Ambient playlist (FOH)",
        lighting: "House @ 70%", notes: "Ushers seat VIPs first",
      },
    },
    {
      id: "d2", cueNumber: 2, title: "Welcome & Land Acknowledgement",
      startTime: at(18, 30), endTime: at(18, 38), projectRef: DEMO_PROJECT_ID, isLive: false,
      fieldValues: {
        presenter: "Maya Chen (Host)", location: "Center Stage", avMedia: "Logo loop — center screen",
        lighting: "Warm spot, center", notes: "Mic 1 — check batteries",
      },
    },
    {
      id: "d3", cueNumber: 3, title: "Opening Keynote",
      startTime: at(18, 38), endTime: at(19, 5), projectRef: DEMO_PROJECT_ID, isLive: false,
      fieldValues: {
        presenter: "Dr. Andre Willis", location: "Center Stage", avMedia: "Keynote deck (HDMI 2)",
        lighting: "Full stage wash", notes: "Confidence monitor DSL",
      },
    },
    {
      id: "d4", cueNumber: 4, title: "Live Performance — String Quartet",
      startTime: at(19, 5), endTime: at(19, 25), projectRef: DEMO_PROJECT_ID, isLive: false,
      fieldValues: {
        presenter: "The Rowan Ensemble", location: "Stage Left riser", avMedia: "4x condenser mics",
        lighting: "Blue wash + pin spots", notes: "Silence house music before entrance",
      },
    },
    {
      id: "d5", cueNumber: 5, title: "Awards Presentation",
      startTime: at(19, 25), endTime: at(19, 55), projectRef: DEMO_PROJECT_ID, isLive: false,
      fieldValues: {
        presenter: "Maya Chen + Board", location: "Center Stage", avMedia: "Recipient reel (SDI 1)",
        lighting: "Full wash, chase on winners", notes: "Trophies staged SR",
      },
    },
    {
      id: "d6", cueNumber: 6, title: "Closing Remarks & Invitation to Reception",
      startTime: at(19, 55), endTime: at(20, 5), projectRef: DEMO_PROJECT_ID, isLive: false,
      fieldValues: {
        presenter: "Maya Chen (Host)", location: "Center Stage", avMedia: "Sponsor thank-you slide",
        lighting: "Warm spot, center", notes: "Cue reception doors open",
      },
    },
  ];
}
