import { Plan } from "../../Config/planLimits";
import "./WelcomeModal.css";

interface WelcomeModalProps {
  plan: Plan;
  firstName?: string;
  onCreateProject: () => void;
  onClose: () => void;
}

const STEPS = [
  {
    n: "1",
    title: "Create a project",
    desc: "Each show, service, or event is a project. Give it a name and date to get started.",
  },
  {
    n: "2",
    title: "Build your cue sheet",
    desc: "Add cues with times, presenters, AV, and lighting. Reorder by dragging; import from Excel in seconds.",
  },
  {
    n: "3",
    title: "Go live & share",
    desc: "Open the run-of-show to control the event in real time, and share the live link so your whole crew stays in sync.",
  },
];

/** First-run welcome shown once to a new user on their dashboard. */
export function WelcomeModal({ plan, firstName, onCreateProject, onClose }: WelcomeModalProps) {
  const planLabel = plan === "team" ? "Team" : plan === "pro" ? "Pro" : null;
  return (
    <div className="wm-overlay" role="dialog" aria-modal="true" aria-labelledby="wm-title" onClick={onClose}>
      <div className="wm-modal" onClick={(e) => e.stopPropagation()}>
        <button className="wm-close" aria-label="Close" onClick={onClose}>✕</button>

        {planLabel && <div className="wm-plan-badge">{planLabel} plan active</div>}
        <h2 className="wm-title" id="wm-title">
          Welcome to LiveCue{firstName ? `, ${firstName}` : ""}!
        </h2>
        <p className="wm-sub">
          {planLabel
            ? `You've unlocked ${planLabel}. Here's how to run your first flawless show in three steps.`
            : "Here's how to run your first flawless show in three steps."}
        </p>

        <div className="wm-steps">
          {STEPS.map((s) => (
            <div className="wm-step" key={s.n}>
              <div className="wm-step-num">{s.n}</div>
              <div>
                <div className="wm-step-title">{s.title}</div>
                <div className="wm-step-desc">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="wm-actions">
          <button className="wm-btn-primary" onClick={onCreateProject}>Create my first project</button>
          <button className="wm-btn-ghost" onClick={onClose}>I'll explore on my own</button>
        </div>
      </div>
    </div>
  );
}
