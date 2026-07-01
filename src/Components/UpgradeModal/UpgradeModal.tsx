import { useNavigate } from "react-router-dom";
import "./UpgradeModal.css";
import { Plan } from "../../Config/planLimits";

export type UpgradeFeature =
  | "projects"
  | "cues"
  | "customFields"
  | "dragReorder"
  | "aiImport"
  | "seats";

type UpgradeTier = "pro" | "team";

interface FeatureCopy {
  title: string;
  body: string;
  upgradeTo: UpgradeTier;
}

function getCopy(feature: UpgradeFeature, currentPlan: Plan): FeatureCopy {
  switch (feature) {
    case "projects":
      return {
        title: "Project limit reached",
        body: "The Free plan includes 1 project. Upgrade to Pro for unlimited projects.",
        upgradeTo: "pro",
      };
    case "cues":
      return {
        title: "Cue limit reached",
        body: "The Free plan includes up to 5 cues per project. Upgrade to Pro for unlimited cues.",
        upgradeTo: "pro",
      };
    case "customFields":
      return {
        title: "Custom fields are Pro",
        body: "Add your own cue fields — notes, roles, tech cues, and more — with a Pro plan.",
        upgradeTo: "pro",
      };
    case "dragReorder":
      return {
        title: "Drag-to-reorder is Pro",
        body: "Reorder cues by dragging and let times cascade automatically with a Pro plan.",
        upgradeTo: "pro",
      };
    case "aiImport":
      if (currentPlan === "pro") {
        return {
          title: "AI import limit reached",
          body: "You've used all 10 AI imports for this month. Upgrade to Team for 50 imports per month.",
          upgradeTo: "team",
        };
      }
      return {
        title: "AI import limit reached",
        body: "You've used all your AI imports for this month. Upgrade to Pro for 10 per month.",
        upgradeTo: "pro",
      };
    case "seats":
      return {
        title: "Need more seats?",
        body: "Your Pro plan is single-user. Upgrade to Team to collaborate with up to 5 teammates on shared projects.",
        upgradeTo: "team",
      };
  }
}

interface UpgradeModalProps {
  feature: UpgradeFeature;
  onClose: () => void;
  currentPlan?: Plan;
}

export function UpgradeModal({ feature, onClose, currentPlan = "free" }: UpgradeModalProps) {
  const navigate = useNavigate();
  const { title, body, upgradeTo } = getCopy(feature, currentPlan);
  const isTeamUpgrade = upgradeTo === "team";

  return (
    <div className="um-overlay" onClick={onClose}>
      <div className={`um-card ${isTeamUpgrade ? "um-card--team" : ""}`} onClick={(e) => e.stopPropagation()}>
        <div className={`um-icon ${isTeamUpgrade ? "um-icon--team" : ""}`}>
          {isTeamUpgrade ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          )}
        </div>

        <h2 className="um-title">{title}</h2>
        <p className="um-body">{body}</p>

        <div className="um-actions">
          <button
            className={`um-btn-primary ${isTeamUpgrade ? "um-btn-primary--team" : ""}`}
            onClick={() => { onClose(); navigate("/pricing"); }}
          >
            Upgrade to {upgradeTo === "team" ? "Team" : "Pro"}
          </button>
          <button className="um-btn-ghost" onClick={onClose}>
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
