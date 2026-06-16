import { useNavigate } from "react-router-dom";
import "./UpgradeModal.css";

export type UpgradeFeature = "projects" | "cues" | "customFields" | "dragReorder" | "aiImport";

const FEATURE_COPY: Record<UpgradeFeature, { title: string; body: string; plan: string }> = {
  projects:     { title: "Project limit reached",    body: "The Free plan includes 1 project. Upgrade to Pro for unlimited projects.",          plan: "Pro" },
  cues:         { title: "Cue limit reached",        body: "The Free plan includes up to 5 cues per project. Upgrade to Pro for unlimited cues.", plan: "Pro" },
  customFields: { title: "Custom fields are Pro",    body: "Add your own cue fields — notes, roles, tech cues, and more — with a Pro plan.",     plan: "Pro" },
  dragReorder:  { title: "Drag-to-reorder is Pro",   body: "Reorder cues by dragging and let times cascade automatically with a Pro plan.",      plan: "Pro" },
  aiImport:     { title: "AI import limit reached",  body: "You've used all your AI imports for this month. Upgrade to Pro for 10/month.",       plan: "Pro" },
};

interface UpgradeModalProps {
  feature: UpgradeFeature;
  onClose: () => void;
}

export function UpgradeModal({ feature, onClose }: UpgradeModalProps) {
  const navigate = useNavigate();
  const { title, body, plan } = FEATURE_COPY[feature];

  return (
    <div className="um-overlay" onClick={onClose}>
      <div className="um-card" onClick={(e) => e.stopPropagation()}>
        <div className="um-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </div>

        <h2 className="um-title">{title}</h2>
        <p className="um-body">{body}</p>

        <div className="um-actions">
          <button
            className="um-btn-primary"
            onClick={() => { onClose(); navigate("/pricing"); }}
          >
            Upgrade to {plan}
          </button>
          <button className="um-btn-ghost" onClick={onClose}>
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
