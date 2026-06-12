import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./AdminPage.css";
import { Project } from "../../Interfaces/Project/Project";
import { Cue } from "../../Interfaces/Cue/Cue";
import { CustomField, DEFAULT_FIELDS } from "../../Interfaces/CustomField/CustomField";
import { db, collection, getDocs, query, where, updateDoc, doc, onSnapshot } from "../../Backend/firebase";
import { LoadingScreen } from "../../Components/LoadingScreen/LoadingScreen";

interface AdminPageProps {
  projects: Project[];
}

function getDriftMinutes(cue: Cue): number | null {
  if (!cue.actualStartTime) return null;
  return Math.round(
    (new Date(cue.actualStartTime).getTime() - new Date(cue.startTime).getTime()) / 60000
  );
}

function mapCue(data: any, id: string): Cue {
  const fieldValues: Record<string, string> = data.fieldValues || {};
  if (!data.fieldValues) {
    ['presenter','location','avMedia','audioSource','sideScreens','centerScreen','lighting','ambientLights','notes']
      .forEach(k => { if (data[k]) fieldValues[k] = data[k]; });
  }
  return {
    id,
    cueNumber: data.cueNumber,
    title: data.title || '',
    startTime: data.startTime?.toDate ? data.startTime.toDate().toISOString() : (data.startTime || new Date().toISOString()),
    endTime: data.endTime?.toDate ? data.endTime.toDate().toISOString() : (data.endTime || new Date().toISOString()),
    projectRef: data.projectRef,
    isLive: data.isLive ?? false,
    fieldValues,
    actualStartTime: data.actualStartTime,
  };
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
}

function fmtDuration(startIso: string, endIso: string) {
  const mins = Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000);
  if (mins <= 0) return '—';
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function fmtElapsed(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function fmtCountdown(ms: number) {
  const abs = Math.abs(ms);
  const s = Math.floor(abs / 1000) % 60;
  const m = Math.floor(abs / 60000) % 60;
  const h = Math.floor(abs / 3600000);
  if (h > 0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function toTimeInput(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function applyTimeInput(baseIso: string, timeStr: string): string {
  const d = new Date(baseIso);
  const [h, m] = timeStr.split(':').map(Number);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

function AdminPage({ projects }: AdminPageProps) {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [cues, setCues] = useState<Cue[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [fields, setFields] = useState<CustomField[]>(DEFAULT_FIELDS);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [now, setNow] = useState(new Date());
  const [urlCopied, setUrlCopied] = useState(false);
  const [broadcastInput, setBroadcastInput] = useState('');
  const [broadcastSent, setBroadcastSent] = useState(false);
  const [editingCue, setEditingCue] = useState<Cue | null>(null);
  const [editForm, setEditForm] = useState<{ title: string; startTime: string; endTime: string; fieldValues: Record<string,string> }>({
    title: '', startTime: '', endTime: '', fieldValues: {},
  });
  const liveCardRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const shareUrl = `https://kush-patel1.github.io/LiveCue/#/LiveCueSheet/${projectId}`;

  // Initial load + project metadata
  useEffect(() => {
    if (!projectId) return;
    getDocs(query(collection(db, 'cues'), where('projectRef', '==', projectId)))
      .then(snap => {
        setCues(snap.docs.map(d => mapCue(d.data(), d.id)));
        setLoading(false);
      })
      .catch(console.error);
    const found = projects.find(p => p.firebaseID === projectId);
    if (found) {
      setProject(found);
      setFields(found.fields?.length ? found.fields : DEFAULT_FIELDS);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, projects]);

  // Real-time listener
  useEffect(() => {
    if (!projectId) return;
    const q = query(collection(db, 'cues'), where('projectRef', '==', projectId));
    return onSnapshot(q, snap => {
      setCues(snap.docs.map(d => mapCue(d.data(), d.id)));
      setLoading(false);
    });
  }, [projectId]);

  // Live clock (every second)
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Elapsed timer
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => setElapsedTime(p => p + 1), 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  // Auto-scroll live card to center
  useEffect(() => {
    if (liveCardRef.current && scrollRef.current) {
      const card = liveCardRef.current;
      const container = scrollRef.current;
      container.scrollTo({
        left: card.offsetLeft + card.offsetWidth / 2 - container.offsetWidth / 2,
        behavior: 'smooth',
      });
    }
  }, [cues]);

  const sorted = [...cues].sort((a, b) => a.cueNumber - b.cueNumber);
  const liveIdx = sorted.findIndex(c => c.isLive);
  const liveCue = liveIdx >= 0 ? sorted[liveIdx] : null;
  const nextCue = liveIdx >= 0 ? sorted[liveIdx + 1] : sorted[0];
  const globalDrift = liveCue ? getDriftMinutes(liveCue) : null;

  const nextCueMs = nextCue
    ? new Date(nextCue.startTime).getTime() - now.getTime()
    : null;

  const liveElapsedMs = liveCue
    ? now.getTime() - new Date(liveCue.startTime).getTime()
    : null;
  const liveDurationMs = liveCue
    ? new Date(liveCue.endTime).getTime() - new Date(liveCue.startTime).getTime()
    : null;
  const liveProgressPct = (liveElapsedMs != null && liveDurationMs && liveDurationMs > 0)
    ? Math.min(100, Math.max(0, (liveElapsedMs / liveDurationMs) * 100))
    : 0;

  const toggleLive = async () => {
    setIsLive(true);
    setIsRunning(true);
    if (sorted[0]) {
      await updateDoc(doc(db, 'cues', sorted[0].id), { actualStartTime: new Date().toISOString() });
    }
  };

  const togglePause = () => setIsRunning(p => !p);
  const adjustTime = (s: number) => setElapsedTime(p => Math.max(0, p + s));

  const handleNextCue = async () => {
    if (liveIdx === -1 || liveIdx >= sorted.length - 1) return;
    const ts = new Date().toISOString();
    const next = sorted[liveIdx + 1];
    await updateDoc(doc(db, 'cues', sorted[liveIdx].id), { isLive: false });
    await updateDoc(doc(db, 'cues', next.id), { isLive: true, actualStartTime: ts });
    const drift = Math.round((new Date(ts).getTime() - new Date(next.startTime).getTime()) / 60000);
    if (Math.abs(drift) >= 2 && liveIdx + 1 < sorted.length - 1) {
      const driftMs = drift * 60000;
      await Promise.all(sorted.slice(liveIdx + 2).map(cue =>
        updateDoc(doc(db, 'cues', cue.id), {
          startTime: new Date(new Date(cue.startTime).getTime() + driftMs).toISOString(),
          endTime:   new Date(new Date(cue.endTime).getTime()   + driftMs).toISOString(),
        })
      ));
    }
  };

  const handlePrevCue = async () => {
    if (liveIdx <= 0) return;
    await updateDoc(doc(db, 'cues', sorted[liveIdx].id), { isLive: false });
    await updateDoc(doc(db, 'cues', sorted[liveIdx - 1].id), { isLive: true });
  };

  const openEditor = (cue: Cue) => {
    setEditingCue(cue);
    setEditForm({
      title: cue.title,
      startTime: toTimeInput(cue.startTime),
      endTime: toTimeInput(cue.endTime),
      fieldValues: { ...cue.fieldValues },
    });
  };

  const saveEdit = async () => {
    if (!editingCue) return;
    await updateDoc(doc(db, 'cues', editingCue.id), {
      title: editForm.title,
      startTime: applyTimeInput(editingCue.startTime, editForm.startTime),
      endTime: applyTimeInput(editingCue.endTime, editForm.endTime),
      fieldValues: editForm.fieldValues,
    });
    setEditingCue(null);
  };

  const sendBroadcast = async () => {
    if (!broadcastInput.trim() || !projectId) return;
    await updateDoc(doc(db, 'projects', projectId), {
      broadcastMessage: broadcastInput.trim(),
      broadcastAt: new Date().toISOString(),
    });
    setBroadcastSent(true);
    setTimeout(() => setBroadcastSent(false), 2000);
  };

  const clearBroadcast = async () => {
    if (!projectId) return;
    await updateDoc(doc(db, 'projects', projectId), {
      broadcastMessage: '',
      broadcastAt: null,
    });
    setBroadcastInput('');
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 2000);
    });
  };

  function cardVariant(index: number): 'past' | 'live' | 'next' | 'future' {
    if (liveIdx < 0) return index === 0 ? 'next' : 'future';
    const diff = index - liveIdx;
    if (diff < 0) return 'past';
    if (diff === 0) return 'live';
    if (diff === 1) return 'next';
    return 'future';
  }

  if (loading) return <LoadingScreen />;

  return (
    <div className="adm-shell">

      {/* ── Top bar ── */}
      <header className="adm-topbar">
        <div className="adm-topbar-left">
          <span className="adm-brand" onClick={() => navigate('/HomePage')}>
            <span className="adm-brand-live">LIVE</span><span className="adm-brand-cue">CUE</span>
          </span>
          <span className="adm-topbar-sep">|</span>
          <span className="adm-topbar-project">{project?.title || '—'}</span>
          {project?.date && (
            <span className="adm-topbar-date">
              {project.date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          )}
        </div>

        <div className="adm-topbar-center">
          {isLive ? (
            <div className="adm-on-air">
              <span className="adm-on-air-dot" />
              ON AIR
            </div>
          ) : (
            <div className="adm-standby">STANDBY</div>
          )}
        </div>

        <div className="adm-topbar-right">
          {globalDrift !== null && (
            <span className={`adm-drift-badge adm-drift--${globalDrift === 0 ? 'ok' : globalDrift > 0 ? 'late' : 'early'}`}>
              {globalDrift === 0 ? '✓ ON TIME' : globalDrift > 0 ? `▲ +${globalDrift}m` : `▼ ${Math.abs(globalDrift)}m`}
            </span>
          )}
          <span className="adm-topbar-clock">
            {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
          </span>
        </div>
      </header>

      <div className="adm-body">

        {/* ── Control console ── */}
        <aside className="adm-console">

          {/* SHOW TIMER */}
          <div className="adm-module">
            <div className="adm-module-label">SHOW TIMER</div>
            <div className="adm-module-body">
              <div className={`adm-big-timer ${isRunning ? 'adm-big-timer--running' : ''}`}>
                {fmtElapsed(elapsedTime)}
              </div>
              <div className="adm-cue-progress-label">
                {liveCue ? `${liveCue.cueNumber} of ${sorted.length} — ${liveCue.title}` : 'No cue live'}
              </div>
              {liveCue && (
                <div className="adm-progress-track">
                  <div className="adm-progress-fill" style={{ width: `${liveProgressPct}%` }} />
                </div>
              )}
            </div>
          </div>

          {/* TRANSPORT */}
          <div className="adm-module">
            <div className="adm-module-label">TRANSPORT</div>
            <div className="adm-module-body">
              {!isLive ? (
                <button className="adm-go-live-btn" onClick={toggleLive}>
                  <span className="adm-go-dot" />
                  GO LIVE
                </button>
              ) : (
                <div className="adm-transport-row">
                  <button className="adm-transport-btn" onClick={() => adjustTime(-10)}>−10s</button>
                  <button className={`adm-transport-btn adm-transport-btn--play ${isRunning ? 'adm-transport-btn--pause' : ''}`} onClick={togglePause}>
                    {isRunning ? '⏸' : '▶'}
                  </button>
                  <button className="adm-transport-btn" onClick={() => adjustTime(10)}>+10s</button>
                </div>
              )}
            </div>
          </div>

          {/* CUE CONTROL */}
          <div className="adm-module">
            <div className="adm-module-label">CUE CONTROL</div>
            <div className="adm-module-body">
              <div className="adm-cue-nav-row">
                <button className="adm-cue-nav-btn" onClick={handlePrevCue} disabled={liveIdx <= 0}>
                  ← PREV
                </button>
                <button className="adm-cue-nav-btn adm-cue-nav-btn--next" onClick={handleNextCue} disabled={liveIdx >= sorted.length - 1}>
                  NEXT →
                </button>
              </div>

              {liveCue && (
                <div className="adm-live-readout">
                  <div className="adm-readout-row">
                    <span className="adm-readout-key">NOW</span>
                    <span className="adm-readout-val">{liveCue.cueNumber}. {liveCue.title}</span>
                  </div>
                  {liveElapsedMs != null && (
                    <div className="adm-readout-row">
                      <span className="adm-readout-key">ELAPSED</span>
                      <span className="adm-readout-val adm-mono">{fmtCountdown(liveElapsedMs)}</span>
                    </div>
                  )}
                </div>
              )}

              {nextCue && nextCueMs != null && (
                <div className="adm-next-cue-block">
                  <div className="adm-next-label">NEXT UP</div>
                  <div className="adm-next-title">{nextCue.cueNumber}. {nextCue.title}</div>
                  <div className={`adm-next-countdown ${nextCueMs < 60000 ? 'adm-next-countdown--urgent' : ''}`}>
                    {nextCueMs > 0 ? `in ${fmtCountdown(nextCueMs)}` : `${fmtCountdown(Math.abs(nextCueMs))} ago`}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* BROADCAST */}
          <div className="adm-module">
            <div className="adm-module-label">BROADCAST</div>
            <div className="adm-module-body">
              <textarea
                className="adm-broadcast-input"
                placeholder="Type a message to send to all viewers…"
                value={broadcastInput}
                onChange={e => setBroadcastInput(e.target.value)}
                rows={3}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendBroadcast(); } }}
              />
              <div className="adm-broadcast-actions">
                <button className="adm-broadcast-send" onClick={sendBroadcast} disabled={!broadcastInput.trim()}>
                  {broadcastSent ? '✓ Sent' : '📢 Send'}
                </button>
                <button className="adm-broadcast-clear" onClick={clearBroadcast}>
                  Clear
                </button>
              </div>
              <p className="adm-broadcast-hint">Expires 2 min after sending</p>
            </div>
          </div>

          {/* SHARE */}
          <div className="adm-module adm-module--share">
            <div className="adm-module-label">SHARE</div>
            <div className="adm-module-body">
              <div className="adm-url-display">{shareUrl}</div>
              <button className="adm-copy-btn" onClick={copyUrl}>
                {urlCopied ? '✓ COPIED' : 'COPY LINK'}
              </button>
            </div>
          </div>

        </aside>

        {/* ── Cue runway ── */}
        <div className="adm-runway-wrap">

          {/* Runway label */}
          <div className="adm-runway-header">
            <span className="adm-runway-label">CUE RUNWAY</span>
            <span className="adm-runway-count">{sorted.length} CUES</span>
          </div>

          <div className="adm-runway" ref={scrollRef}>
            {sorted.map((cue, index) => {
              const variant = cardVariant(index);
              const drift = getDriftMinutes(cue);
              return (
                <div
                  key={cue.id}
                  ref={cue.isLive ? liveCardRef : undefined}
                  className={`adm-card adm-card--${variant}`}
                >
                  {/* Status strip */}
                  <div className={`adm-card-strip adm-card-strip--${variant}`} />

                  {/* Card header */}
                  <div className="adm-card-head">
                    <span className={`adm-num adm-num--${variant}`}>{cue.cueNumber}</span>
                    <div className="adm-card-title-wrap">
                      <span className="adm-card-title">{cue.title}</span>
                      {variant === 'live' && <span className="adm-live-badge">● LIVE</span>}
                      {variant === 'next' && <span className="adm-next-badge">NEXT</span>}
                    </div>
                    {drift !== null && (
                      <span className={`adm-drift-pill adm-drift--${drift === 0 ? 'ok' : drift > 0 ? 'late' : 'early'}`}>
                        {drift === 0 ? '✓' : drift > 0 ? `+${drift}m` : `${drift}m`}
                      </span>
                    )}
                    <button className="adm-card-edit-btn" onClick={() => openEditor(cue)} title="Edit cue">✏</button>
                  </div>

                  {/* Times */}
                  <div className="adm-card-times">
                    <span className="adm-mono adm-time-val">{fmtTime(cue.startTime)}</span>
                    <span className="adm-time-sep">→</span>
                    <span className="adm-mono adm-time-val">{fmtTime(cue.endTime)}</span>
                    <span className="adm-dur">{fmtDuration(cue.startTime, cue.endTime)}</span>
                  </div>

                  {/* Live progress bar */}
                  {variant === 'live' && (
                    <div className="adm-card-progress">
                      <div className="adm-card-progress-fill" style={{ width: `${liveProgressPct}%` }} />
                    </div>
                  )}

                  {cue.actualStartTime && (
                    <div className="adm-actual-start">
                      actual {fmtTime(cue.actualStartTime)}
                    </div>
                  )}

                  {/* Fields */}
                  <div className="adm-card-fields">
                    {fields.map(f => (
                      <div key={f.id} className="adm-field-row">
                        <span className="adm-f-key">{f.label}</span>
                        <span className="adm-f-val">{cue.fieldValues[f.id] || <span className="adm-f-empty">—</span>}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {sorted.length === 0 && (
              <div className="adm-empty">NO CUES LOADED</div>
            )}
          </div>
        </div>
      </div>
      {/* ── Cue editor drawer ── */}
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

              {/* Title */}
              <div className="adm-editor-field">
                <label className="adm-editor-label">Title</label>
                <input
                  className="adm-editor-input"
                  value={editForm.title}
                  onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                />
              </div>

              {/* Times */}
              <div className="adm-editor-row">
                <div className="adm-editor-field">
                  <label className="adm-editor-label">Start time</label>
                  <input
                    className="adm-editor-input"
                    type="time"
                    value={editForm.startTime}
                    onChange={e => setEditForm(f => ({ ...f, startTime: e.target.value }))}
                  />
                </div>
                <div className="adm-editor-field">
                  <label className="adm-editor-label">End time</label>
                  <input
                    className="adm-editor-input"
                    type="time"
                    value={editForm.endTime}
                    onChange={e => setEditForm(f => ({ ...f, endTime: e.target.value }))}
                  />
                </div>
              </div>

              {/* Custom fields */}
              <div className="adm-editor-section-label">Fields</div>
              {fields.map(f => (
                <div key={f.id} className="adm-editor-field">
                  <label className="adm-editor-label">{f.label}</label>
                  <input
                    className="adm-editor-input"
                    value={editForm.fieldValues[f.id] || ''}
                    onChange={e => setEditForm(prev => ({
                      ...prev,
                      fieldValues: { ...prev.fieldValues, [f.id]: e.target.value },
                    }))}
                    placeholder="—"
                  />
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
  );
}

export default AdminPage;
