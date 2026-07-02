import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePageTitle } from "../Hooks/usePageTitle";
import { DemoBanner } from "./DemoBanner";
import "../Pages/Admin Page/AdminPage.css";
import { Cue } from "../Interfaces/Cue/Cue";
import { DEMO_FIELDS, DEMO_TITLE, DEMO_DATE, makeDemoCues } from "./demoData";

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
}
function todSecs(iso: string) {
  const d = new Date(iso);
  return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
}
function fmtDuration(startIso: string, endIso: string) {
  const mins = Math.round((todSecs(endIso) - todSecs(startIso)) / 60);
  if (mins <= 0) return "—";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60); const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
function fmtElapsed(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
function fmtCountdown(secs: number) {
  const abs = Math.abs(Math.round(secs));
  const s = abs % 60; const m = Math.floor(abs / 60) % 60; const h = Math.floor(abs / 3600);
  if (h > 0) return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
function toTimeInput(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function applyTimeInput(baseIso: string, timeStr: string): string {
  const d = new Date(baseIso);
  const [h, m] = timeStr.split(":").map(Number);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}
function getDriftMinutes(cue: Cue): number | null {
  if (!cue.actualStartTime) return null;
  return Math.round((todSecs(cue.actualStartTime) - todSecs(cue.startTime)) / 60);
}

function DemoAdmin() {
  usePageTitle("Demo · Run of Show");
  const navigate = useNavigate();
  const fields = DEMO_FIELDS;

  const [cues, setCues] = useState<Cue[]>(() => makeDemoCues());
  const [isLive, setIsLive] = useState(true);
  const [isRunning, setIsRunning] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [now, setNow] = useState(new Date());
  const [urlCopied, setUrlCopied] = useState(false);
  const [broadcastInput, setBroadcastInput] = useState("");
  const [broadcastSent, setBroadcastSent] = useState(false);
  const [editingCue, setEditingCue] = useState<Cue | null>(null);
  const [editForm, setEditForm] = useState<{ title: string; startTime: string; endTime: string; fieldValues: Record<string, string> }>({
    title: "", startTime: "", endTime: "", fieldValues: {},
  });
  const liveCardRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const shareUrl = "https://live-cue.com/#/LiveCueSheet/your-project";

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => setElapsedTime((p) => p + 1), 1000);
    return () => clearInterval(id);
  }, [isRunning]);
  useEffect(() => {
    if (liveCardRef.current && scrollRef.current) {
      const card = liveCardRef.current; const container = scrollRef.current;
      container.scrollTo({ left: card.offsetLeft + card.offsetWidth / 2 - container.offsetWidth / 2, behavior: "smooth" });
    }
  }, [cues]);

  const sorted = [...cues].sort((a, b) => a.cueNumber - b.cueNumber);
  const liveIdx = sorted.findIndex((c) => c.isLive);
  const liveCue = liveIdx >= 0 ? sorted[liveIdx] : null;
  const nextCue = liveIdx >= 0 ? sorted[liveIdx + 1] : sorted[0];
  const globalDrift = liveCue ? getDriftMinutes(liveCue) : null;
  const ns = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const nextCueSecs = nextCue ? todSecs(nextCue.startTime) - ns : null;
  const liveElapsedSecs = liveCue ? ns - todSecs(liveCue.startTime) : null;
  const liveDurationSecs = liveCue ? todSecs(liveCue.endTime) - todSecs(liveCue.startTime) : null;
  const liveProgressPct = (liveElapsedSecs != null && liveDurationSecs && liveDurationSecs > 0)
    ? Math.min(100, Math.max(0, (liveElapsedSecs / liveDurationSecs) * 100)) : 0;

  const setLiveAt = (targetIdx: number) => {
    setCues((prev) => {
      const order = [...prev].sort((a, b) => a.cueNumber - b.cueNumber);
      const targetId = order[targetIdx]?.id;
      return prev.map((c) => c.id === targetId
        ? { ...c, isLive: true, actualStartTime: new Date().toISOString() }
        : { ...c, isLive: false });
    });
  };
  const toggleLive = () => { setIsLive(true); setIsRunning(true); setLiveAt(0); };
  const togglePause = () => setIsRunning((p) => !p);
  const adjustTime = (s: number) => setElapsedTime((p) => Math.max(0, p + s));
  const handleNextCue = () => { if (liveIdx >= 0 && liveIdx < sorted.length - 1) setLiveAt(liveIdx + 1); };
  const handlePrevCue = () => { if (liveIdx > 0) setLiveAt(liveIdx - 1); };

  const openEditor = (cue: Cue) => {
    setEditingCue(cue);
    setEditForm({ title: cue.title, startTime: toTimeInput(cue.startTime), endTime: toTimeInput(cue.endTime), fieldValues: { ...cue.fieldValues } });
  };
  const saveEdit = () => {
    if (!editingCue) return;
    setCues((prev) => prev.map((c) => c.id === editingCue.id ? {
      ...c, title: editForm.title,
      startTime: applyTimeInput(c.startTime, editForm.startTime),
      endTime: applyTimeInput(c.endTime, editForm.endTime),
      fieldValues: editForm.fieldValues,
    } : c));
    setEditingCue(null);
  };
  const sendBroadcast = () => {
    if (!broadcastInput.trim()) return;
    setBroadcastSent(true);
    setTimeout(() => setBroadcastSent(false), 2000);
  };
  const clearBroadcast = () => setBroadcastInput("");
  const copyUrl = () => { setUrlCopied(true); setTimeout(() => setUrlCopied(false), 2000); };

  function cardVariant(index: number): "past" | "live" | "next" | "future" {
    if (liveIdx < 0) return index === 0 ? "next" : "future";
    const diff = index - liveIdx;
    if (diff < 0) return "past";
    if (diff === 0) return "live";
    if (diff === 1) return "next";
    return "future";
  }

  return (
    <>
      <DemoBanner section="Run of Show" />
      <div className="adm-shell">
        <header className="adm-topbar">
          <div className="adm-topbar-left">
            <span className="adm-brand" onClick={() => navigate("/demo")}>
              <span className="adm-brand-live">LIVE</span><span className="adm-brand-cue">CUE</span>
            </span>
            <span className="adm-topbar-sep">|</span>
            <span className="adm-topbar-project">{DEMO_TITLE}</span>
            <span className="adm-topbar-date">
              {DEMO_DATE.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>
          <div className="adm-topbar-center">
            {isLive ? (
              <div className="adm-on-air"><span className="adm-on-air-dot" />ON AIR</div>
            ) : (
              <div className="adm-standby">STANDBY</div>
            )}
          </div>
          <div className="adm-topbar-right">
            {globalDrift !== null && (
              <span className={`adm-drift-badge adm-drift--${globalDrift === 0 ? "ok" : globalDrift > 0 ? "late" : "early"}`}>
                {globalDrift === 0 ? "✓ ON TIME" : globalDrift > 0 ? `▲ +${globalDrift}m` : `▼ ${Math.abs(globalDrift)}m`}
              </span>
            )}
            <span className="adm-topbar-clock">
              {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}
            </span>
          </div>
        </header>

        <div className="adm-body">
          <aside className="adm-console">
            <div className="adm-module">
              <div className="adm-module-label">SHOW TIMER</div>
              <div className="adm-module-body">
                <div className={`adm-big-timer ${isRunning ? "adm-big-timer--running" : ""}`}>{fmtElapsed(elapsedTime)}</div>
                <div className="adm-cue-progress-label">
                  {liveCue ? `${liveCue.cueNumber} of ${sorted.length} — ${liveCue.title}` : "No cue live"}
                </div>
                {liveCue && <div className="adm-progress-track"><div className="adm-progress-fill" style={{ width: `${liveProgressPct}%` }} /></div>}
              </div>
            </div>

            <div className="adm-module">
              <div className="adm-module-label">TRANSPORT</div>
              <div className="adm-module-body">
                {!isLive ? (
                  <button className="adm-go-live-btn" onClick={toggleLive}><span className="adm-go-dot" />GO LIVE</button>
                ) : (
                  <div className="adm-transport-row">
                    <button className="adm-transport-btn" onClick={() => adjustTime(-10)}>−10s</button>
                    <button className={`adm-transport-btn adm-transport-btn--play ${isRunning ? "adm-transport-btn--pause" : ""}`} onClick={togglePause}>{isRunning ? "⏸" : "▶"}</button>
                    <button className="adm-transport-btn" onClick={() => adjustTime(10)}>+10s</button>
                  </div>
                )}
              </div>
            </div>

            <div className="adm-module">
              <div className="adm-module-label">CUE CONTROL</div>
              <div className="adm-module-body">
                <div className="adm-cue-nav-row">
                  <button className="adm-cue-nav-btn" onClick={handlePrevCue} disabled={liveIdx <= 0}>← PREV</button>
                  <button className="adm-cue-nav-btn adm-cue-nav-btn--next" onClick={handleNextCue} disabled={liveIdx >= sorted.length - 1}>NEXT →</button>
                </div>
                {liveCue && (
                  <div className="adm-live-readout">
                    <div className="adm-readout-row"><span className="adm-readout-key">NOW</span><span className="adm-readout-val">{liveCue.cueNumber}. {liveCue.title}</span></div>
                    {liveElapsedSecs != null && <div className="adm-readout-row"><span className="adm-readout-key">ELAPSED</span><span className="adm-readout-val adm-mono">{fmtCountdown(Math.max(0, liveElapsedSecs))}</span></div>}
                  </div>
                )}
                {nextCue && nextCueSecs != null && (
                  <div className="adm-next-cue-block">
                    <div className="adm-next-label">NEXT UP</div>
                    <div className="adm-next-title">{nextCue.cueNumber}. {nextCue.title}</div>
                    <div className={`adm-next-countdown ${nextCueSecs < 60 ? "adm-next-countdown--urgent" : ""}`}>
                      {nextCueSecs > 0 ? `in ${fmtCountdown(nextCueSecs)}` : `${fmtCountdown(Math.abs(nextCueSecs))} ago`}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="adm-module">
              <div className="adm-module-label">BROADCAST</div>
              <div className="adm-module-body">
                <textarea className="adm-broadcast-input" placeholder="Type a message to send to all viewers…" value={broadcastInput}
                  onChange={(e) => setBroadcastInput(e.target.value)} rows={3}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendBroadcast(); } }} />
                <div className="adm-broadcast-actions">
                  <button className="adm-broadcast-send" onClick={sendBroadcast} disabled={!broadcastInput.trim()}>{broadcastSent ? "✓ Sent" : "📢 Send"}</button>
                  <button className="adm-broadcast-clear" onClick={clearBroadcast}>Clear</button>
                </div>
                <p className="adm-broadcast-hint">Demo — messages aren't actually sent</p>
              </div>
            </div>

            <div className="adm-module adm-module--share">
              <div className="adm-module-label">SHARE</div>
              <div className="adm-module-body">
                <div className="adm-url-display">{shareUrl}</div>
                <button className="adm-copy-btn" onClick={copyUrl}>{urlCopied ? "✓ COPIED" : "COPY LINK"}</button>
              </div>
            </div>
          </aside>

          <div className="adm-runway-wrap">
            <div className="adm-runway-header">
              <span className="adm-runway-label">CUE RUNWAY</span>
              <span className="adm-runway-count">{sorted.length} CUES</span>
            </div>
            <div className="adm-runway" ref={scrollRef}>
              {sorted.map((cue, index) => {
                const variant = cardVariant(index);
                const drift = getDriftMinutes(cue);
                return (
                  <div key={cue.id} ref={cue.isLive ? liveCardRef : undefined} className={`adm-card adm-card--${variant}`}>
                    <div className={`adm-card-strip adm-card-strip--${variant}`} />
                    <div className="adm-card-head">
                      <span className={`adm-num adm-num--${variant}`}>{cue.cueNumber}</span>
                      <div className="adm-card-title-wrap">
                        <span className="adm-card-title">{cue.title}</span>
                        {variant === "live" && <span className="adm-live-badge">● LIVE</span>}
                        {variant === "next" && <span className="adm-next-badge">NEXT</span>}
                      </div>
                      {drift !== null && (
                        <span className={`adm-drift-pill adm-drift--${drift === 0 ? "ok" : drift > 0 ? "late" : "early"}`}>
                          {drift === 0 ? "✓" : drift > 0 ? `+${drift}m` : `${drift}m`}
                        </span>
                      )}
                      <button className="adm-card-edit-btn" onClick={() => openEditor(cue)} title="Edit cue">✏</button>
                    </div>
                    <div className="adm-card-times">
                      <span className="adm-mono adm-time-val">{fmtTime(cue.startTime)}</span>
                      <span className="adm-time-sep">→</span>
                      <span className="adm-mono adm-time-val">{fmtTime(cue.endTime)}</span>
                      <span className="adm-dur">{fmtDuration(cue.startTime, cue.endTime)}</span>
                    </div>
                    {variant === "live" && <div className="adm-card-progress"><div className="adm-card-progress-fill" style={{ width: `${liveProgressPct}%` }} /></div>}
                    {cue.actualStartTime && <div className="adm-actual-start">actual {fmtTime(cue.actualStartTime)}</div>}
                    <div className="adm-card-fields">
                      {fields.map((f) => (
                        <div key={f.id} className="adm-field-row">
                          <span className="adm-f-key">{f.label}</span>
                          <span className="adm-f-val">{cue.fieldValues[f.id] || <span className="adm-f-empty">—</span>}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {editingCue && (
          <>
            <div className="adm-drawer-overlay" onClick={() => setEditingCue(null)} />
            <div className="adm-drawer">
              <div className="adm-drawer-header">
                <div>
                  <span className="adm-drawer-label">EDITING CUE {editingCue.cueNumber}</span>
                  <h2 className="adm-drawer-title">{editingCue.title}</h2>
                </div>
                <button className="adm-drawer-close" onClick={() => setEditingCue(null)}>✕</button>
              </div>
              <div className="adm-drawer-body">
                <div className="adm-editor-field">
                  <label className="adm-editor-label">Title</label>
                  <input className="adm-editor-input" value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} />
                </div>
                <div className="adm-editor-row">
                  <div className="adm-editor-field">
                    <label className="adm-editor-label">Start time</label>
                    <input className="adm-editor-input" type="time" value={editForm.startTime} onChange={(e) => setEditForm((f) => ({ ...f, startTime: e.target.value }))} />
                  </div>
                  <div className="adm-editor-field">
                    <label className="adm-editor-label">End time</label>
                    <input className="adm-editor-input" type="time" value={editForm.endTime} onChange={(e) => setEditForm((f) => ({ ...f, endTime: e.target.value }))} />
                  </div>
                </div>
                <div className="adm-editor-section-label">Fields</div>
                {fields.map((f) => (
                  <div key={f.id} className="adm-editor-field">
                    <label className="adm-editor-label">{f.label}</label>
                    <input className="adm-editor-input" value={editForm.fieldValues[f.id] || ""} placeholder="—"
                      onChange={(e) => setEditForm((prev) => ({ ...prev, fieldValues: { ...prev.fieldValues, [f.id]: e.target.value } }))} />
                  </div>
                ))}
              </div>
              <div className="adm-drawer-footer">
                <button className="adm-drawer-cancel" onClick={() => setEditingCue(null)}>Cancel</button>
                <button className="adm-drawer-save" onClick={saveEdit}>Save changes</button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default DemoAdmin;
