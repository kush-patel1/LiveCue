import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePageTitle } from "../Hooks/usePageTitle";
import { DemoBanner } from "./DemoBanner";
import "../Pages/Live Cue Sheet/LiveCueSheet.css";
import logo from "../Assets/Logo/LIVECUE-Logo.png";
import { Cue } from "../Interfaces/Cue/Cue";
import { DEMO_FIELDS, DEMO_TITLE, DEMO_DATE, makeDemoCues } from "./demoData";

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
}
function fmtDuration(startIso: string, endIso: string) {
  const mins = Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000);
  if (mins <= 0) return "—";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60); const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
function fmtCountdown(ms: number): string {
  const abs = Math.abs(ms);
  const totalSecs = Math.floor(abs / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}
function todSecs(iso: string) {
  const d = new Date(iso);
  return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
}

function DemoLive() {
  usePageTitle("Demo · Live Cue Sheet");
  const navigate = useNavigate();
  const [cues] = useState<Cue[]>(() => makeDemoCues());
  const [now, setNow] = useState(new Date());
  const liveCardRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (liveCardRef.current && scrollRef.current) {
      const card = liveCardRef.current;
      const container = scrollRef.current;
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      container.scrollTo({ left: cardCenter - container.offsetWidth / 2, behavior: "smooth" });
    }
  }, [cues]);

  const sorted = [...cues].sort((a, b) => a.cueNumber - b.cueNumber);
  const liveIndex = sorted.findIndex((c) => c.isLive);
  const liveCue = liveIndex >= 0 ? sorted[liveIndex] : null;
  const nextCue = liveIndex >= 0 ? sorted[liveIndex + 1] : sorted[0];
  const ns = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const fields = DEMO_FIELDS;

  function cardVariant(index: number): "past" | "live" | "next" | "future" {
    if (liveIndex < 0) return index === 0 ? "next" : "future";
    const diff = index - liveIndex;
    if (diff < 0) return "past";
    if (diff === 0) return "live";
    if (diff === 1) return "next";
    return "future";
  }

  return (
    <>
      <DemoBanner section="Live Cue Sheet" />
      <div className="lcs-shell">
        <header className="lcs-header">
          <img className="lcs-logo" src={logo} alt="LiveCue" onClick={() => navigate("/demo")} />
          <div className="lcs-header-center">
            <h1 className="lcs-project-title">{DEMO_TITLE}</h1>
            <span className="lcs-project-date">
              {DEMO_DATE.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </span>
          </div>
          <div className="lcs-clock">
            {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}
          </div>
        </header>

        {liveCue && (
          <div className="lcs-status-bar lcs-status--live">
            <span className="lcs-live-dot" />
            <span className="lcs-status-tag">Live</span>
            <span className="lcs-status-title">{liveCue.cueNumber} — {liveCue.title}</span>
            <span className="lcs-status-sep">·</span>
            <span className="lcs-status-meta">
              +{fmtCountdown(Math.max(0, (ns - todSecs(liveCue.startTime)) * 1000))} elapsed
            </span>
            {nextCue && (
              <>
                <span className="lcs-status-sep">·</span>
                <span className="lcs-status-meta">
                  Up next: <strong>{nextCue.title}</strong>{" "}
                  in {fmtCountdown(Math.max(0, (todSecs(nextCue.startTime) - ns) * 1000))}
                </span>
              </>
            )}
          </div>
        )}

        <div className="lcs-scroll-track" ref={scrollRef}>
          {sorted.map((cue, index) => {
            const variant = cardVariant(index);
            return (
              <div key={cue.id} ref={cue.isLive ? liveCardRef : undefined} className={`lcs-card lcs-card--${variant}`}>
                <div className="lcs-card-head">
                  <span className={`lcs-num ${variant === "live" ? "lcs-num--live" : "lcs-num--dim"}`}>{cue.cueNumber}</span>
                  <span className="lcs-card-title">{cue.title}</span>
                </div>
                <div className="lcs-card-times">
                  <span className="lcs-time-val">{fmtTime(cue.startTime)}</span>
                  <span className="lcs-time-arrow">→</span>
                  <span className="lcs-time-val">{fmtTime(cue.endTime)}</span>
                  <span className="lcs-dur-badge">{fmtDuration(cue.startTime, cue.endTime)}</span>
                </div>
                <div className="lcs-card-fields">
                  {fields.map((f) => (
                    <div key={f.id} className="lcs-field-row">
                      <span className="lcs-f-label">{f.label}</span>
                      <span className="lcs-f-val">{cue.fieldValues[f.id] || "—"}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

export default DemoLive;
