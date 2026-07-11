import { useEffect, useState } from "react";
import { IconMegaphone } from "../Icons/Icons";
import { Cue } from "../../Interfaces/Cue/Cue";
import "./TimerDisplay.css";

interface TimerDisplayProps {
  projectTitle: string;
  cues: Cue[];
  broadcast: { message: string; at: number } | null;
}

const BROADCAST_EXPIRY_MS = 2 * 60 * 1000;
const AMBER_THRESHOLD_SECS = 120; // last 2 minutes turn amber

function todSecs(iso: string): number {
  const d = new Date(iso);
  return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
}
function nowSecs(d: Date): number {
  return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
}
function fmtClock(secs: number): string {
  const abs = Math.abs(Math.floor(secs));
  const h = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  const s = abs % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/**
 * Big, high-contrast countdown for the speaker/stage. Shows time remaining in
 * the current live cue (green → amber → red/overtime), the current and next
 * cue names, and any broadcast message. Reads nothing itself — the wrapper
 * supplies real-time data.
 */
export function TimerDisplay({ projectTitle, cues, broadcast }: TimerDisplayProps) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 250);
    return () => clearInterval(id);
  }, []);

  const sorted = [...cues].sort((a, b) => a.cueNumber - b.cueNumber);
  const liveIndex = sorted.findIndex((c) => c.isLive);
  const liveCue = liveIndex >= 0 ? sorted[liveIndex] : null;
  const nextCue = liveIndex >= 0 ? sorted[liveIndex + 1] : sorted[0];

  const ns = nowSecs(now);
  const remaining = liveCue ? todSecs(liveCue.endTime) - ns : null;

  let state: "green" | "amber" | "red" | "idle" = "idle";
  if (remaining !== null) {
    if (remaining <= 0) state = "red";
    else if (remaining <= AMBER_THRESHOLD_SECS) state = "amber";
    else state = "green";
  }

  const broadcastActive =
    broadcast && now.getTime() - broadcast.at < BROADCAST_EXPIRY_MS ? broadcast : null;

  return (
    <div className={`td-root td-state--${state}`}>
      <div className="td-top">
        <span className="td-project">{projectTitle}</span>
        <span className="td-clock">
          {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}
        </span>
      </div>

      {liveCue ? (
        <div className="td-main">
          <div className="td-cue-label">{liveCue.cueNumber} · {liveCue.title || "Untitled"}</div>
          <div className="td-time">{fmtClock(remaining ?? 0)}</div>
          <div className="td-status">
            {state === "red" ? "OVER TIME" : "REMAINING"}
          </div>
        </div>
      ) : (
        <div className="td-main">
          <div className="td-time td-time--idle">—:—</div>
          <div className="td-status">{nextCue ? "Standing by" : "No cues"}</div>
        </div>
      )}

      {nextCue && (
        <div className="td-next">
          <span className="td-next-label">NEXT</span>
          <span className="td-next-title">{nextCue.title || "Untitled"}</span>
        </div>
      )}

      {broadcastActive && (
        <div className="td-broadcast">
          <span className="td-broadcast-icon"><IconMegaphone size={18} /></span>
          {broadcastActive.message}
        </div>
      )}
    </div>
  );
}
