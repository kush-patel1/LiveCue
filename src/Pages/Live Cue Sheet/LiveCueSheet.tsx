import { useEffect, useRef, useState } from "react";
import { usePageTitle } from "../../Hooks/usePageTitle";
import { LoadingScreen } from "../../Components/LoadingScreen/LoadingScreen";
import { useNavigate, useParams } from "react-router-dom";
import "./LiveCueSheet.css";
import logo from '../../Assets/Logo/LIVECUE-Logo.png';
import { Project } from "../../Interfaces/Project/Project";
import { Cue } from "../../Interfaces/Cue/Cue";
import { CustomField, DEFAULT_FIELDS } from "../../Interfaces/CustomField/CustomField";
import { db, collection, query, where, onSnapshot, doc, auth } from "../../Backend/firebase";

interface LiveCueSheetProps {
  projects: Project[];
}

// Returns seconds-since-midnight for a given ISO string, ignoring the date portion
function timeOfDaySecs(iso: string): number {
  const d = new Date(iso);
  return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
}

// Difference in seconds between two ISO times using only their time-of-day (a - b)
function todDiffSecs(aIso: string, bIso: string): number {
  return timeOfDaySecs(aIso) - timeOfDaySecs(bIso);
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
}

function fmtDuration(startIso: string, endIso: string) {
  const mins = Math.round(todDiffSecs(endIso, startIso) / 60);
  if (mins <= 0) return '—';
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function fmtCountdown(absSecs: number): string {
  const h = Math.floor(absSecs / 3600);
  const m = Math.floor((absSecs % 3600) / 60);
  const s = absSecs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// Seconds since midnight for the live clock
function nowSecs(now: Date): number {
  return now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
}

const BROADCAST_EXPIRY_MS = 2 * 60 * 1000; // 2 minutes

function LiveCueSheet({ projects }: LiveCueSheetProps) {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [cues, setCues] = useState<Cue[]>([]);
  const [project, setProject] = useState<{ title: string; date: Date; fields: CustomField[] } | null>(null);
  usePageTitle(project ? `${project.title} – Live` : "Live Cue Sheet");
  const [broadcast, setBroadcast] = useState<{ message: string; at: number } | null>(null);
  const [now, setNow] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [showFieldPanel, setShowFieldPanel] = useState(false);
  const liveCardRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const storageKey = `livecue_hidden_fields_${projectId}`;
  const [hiddenFields, setHiddenFields] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

  const toggleField = (id: string) => {
    setHiddenFields(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem(storageKey, JSON.stringify([...next]));
      return next;
    });
  };

  // Real-time project listener — picks up broadcast messages instantly
  useEffect(() => {
    if (!projectId) return;
    return onSnapshot(doc(db, 'projects', projectId), snap => {
      if (!snap.exists()) return;
      const data = snap.data();
      // Project metadata
      const fromProps = projects.find(p => p.firebaseID === projectId);
      setProject({
        title: data.title,
        date: data.date?.toDate ? data.date.toDate() : (fromProps?.date ?? new Date()),
        fields: data.fields?.length ? data.fields : DEFAULT_FIELDS,
      });
      // Broadcast
      if (data.broadcastMessage && data.broadcastAt) {
        setBroadcast({ message: data.broadcastMessage, at: new Date(data.broadcastAt).getTime() });
      } else {
        setBroadcast(null);
      }
    });
  }, [projectId, projects]);

  // Real-time cues
  useEffect(() => {
    if (!projectId) return;
    const q = query(collection(db, 'cues'), where('projectRef', '==', projectId));
    return onSnapshot(q, snap => {
      setLoading(false);
      const updated: Cue[] = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          cueNumber: data.cueNumber,
          title: data.title || '',
          startTime: data.startTime?.toDate ? data.startTime.toDate().toISOString() : (data.startTime || new Date().toISOString()),
          endTime: data.endTime?.toDate ? data.endTime.toDate().toISOString() : (data.endTime || new Date().toISOString()),
          projectRef: data.projectRef,
          isLive: data.isLive ?? false,
          fieldValues: (() => {
            const fv: Record<string, string> = data.fieldValues || {};
            // legacy: some cues stored fields as top-level Firestore keys
            if (!data.fieldValues) {
              ['presenter','location','avMedia','audioSource','sideScreens','centerScreen','lighting','ambientLights','notes']
                .forEach(k => { if (data[k]) fv[k] = data[k]; });
            }
            return fv;
          })(),
          actualStartTime: data.actualStartTime,
        };
      });
      setCues(updated);
    });
  }, [projectId]);

  // Live clock
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Auto-scroll live card into center view
  useEffect(() => {
    if (liveCardRef.current && scrollRef.current) {
      const card = liveCardRef.current;
      const container = scrollRef.current;
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const containerCenter = container.offsetWidth / 2;
      container.scrollTo({ left: cardCenter - containerCenter, behavior: 'smooth' });
    }
  }, [cues]);

  const sorted = [...cues].sort((a, b) => a.cueNumber - b.cueNumber);
  const liveIndex = sorted.findIndex(c => c.isLive);
  const liveCue = liveIndex >= 0 ? sorted[liveIndex] : null;
  const ns = nowSecs(now);
  const nextCue = liveIndex >= 0
    ? sorted[liveIndex + 1]
    : sorted.find(c => timeOfDaySecs(c.startTime) > ns);

  if (loading) return <LoadingScreen />;

  const fields = project?.fields || DEFAULT_FIELDS;
  const visibleFields = fields.filter(f => !hiddenFields.has(f.id));

  function cardVariant(index: number): 'past' | 'live' | 'next' | 'future' {
    if (liveIndex < 0) return index === 0 ? 'next' : 'future';
    const diff = index - liveIndex;
    if (diff < 0) return 'past';
    if (diff === 0) return 'live';
    if (diff === 1) return 'next';
    return 'future';
  }

  return (
    <div className="lcs-shell">

      {/* ── Header ── */}
      <header className="lcs-header">
        <img
          className="lcs-logo"
          src={logo}
          alt="LiveCue"
          onClick={() => navigate(auth.currentUser ? '/HomePage' : '/login')}
        />
        <div className="lcs-header-center">
          <h1 className="lcs-project-title">{project?.title || '—'}</h1>
          {project?.date && (
            <span className="lcs-project-date">
              {project.date.toLocaleDateString([], {
                weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
              })}
            </span>
          )}
        </div>
        <div className="lcs-clock">
          {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
        </div>
      </header>

      {/* ── Status bar ── */}
      {liveCue ? (
        <div className="lcs-status-bar lcs-status--live">
          <span className="lcs-live-dot" />
          <span className="lcs-status-tag">Live</span>
          <span className="lcs-status-title">{liveCue.cueNumber} — {liveCue.title}</span>
          <span className="lcs-status-sep">·</span>
          <span className="lcs-status-meta">
            +{fmtCountdown(Math.max(0, ns - timeOfDaySecs(liveCue.startTime)))} elapsed
          </span>
          {nextCue && (
            <>
              <span className="lcs-status-sep">·</span>
              <span className="lcs-status-meta">
                Up next: <strong>{nextCue.title}</strong>
                {' '}in {fmtCountdown(Math.max(0, timeOfDaySecs(nextCue.startTime) - ns))}
              </span>
            </>
          )}
        </div>
      ) : nextCue ? (
        <div className="lcs-status-bar lcs-status--waiting">
          <span className="lcs-status-tag">Up next</span>
          <span className="lcs-status-title">{nextCue.title}</span>
          <span className="lcs-status-sep">·</span>
          <span className="lcs-status-meta">
            starts in {fmtCountdown(Math.max(0, timeOfDaySecs(nextCue.startTime) - ns))}
          </span>
        </div>
      ) : null}

      {/* ── Broadcast banner ── */}
      {(() => {
        if (!broadcast) return null;
        const elapsed = now.getTime() - broadcast.at;
        if (elapsed >= BROADCAST_EXPIRY_MS) return null;
        const remaining = BROADCAST_EXPIRY_MS - elapsed;
        const pct = (remaining / BROADCAST_EXPIRY_MS) * 100;
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        const countdown = `${mins}:${String(secs).padStart(2, '0')}`;
        return (
          <div className="lcs-broadcast">
            <div className="lcs-broadcast-progress" style={{ width: `${pct}%` }} />
            <span className="lcs-broadcast-icon">📢</span>
            <span className="lcs-broadcast-msg">{broadcast.message}</span>
            <span className="lcs-broadcast-timer">{countdown}</span>
          </div>
        );
      })()}

      {/* ── Horizontal scroll track ── */}
      <div className="lcs-scroll-track" ref={scrollRef}>
        {sorted.map((cue, index) => {
          const variant = cardVariant(index);
          return (
            <div
              key={cue.id}
              ref={cue.isLive ? liveCardRef : undefined}
              className={`lcs-card lcs-card--${variant}`}
            >
              {/* Card header */}
              <div className="lcs-card-head">
                <span className={`lcs-num ${variant === 'live' ? 'lcs-num--live' : 'lcs-num--dim'}`}>
                  {cue.cueNumber}
                </span>
                <span className="lcs-card-title">{cue.title}</span>
              </div>

              {/* Times row */}
              <div className="lcs-card-times">
                <span className="lcs-time-val">{fmtTime(cue.startTime)}</span>
                <span className="lcs-time-arrow">→</span>
                <span className="lcs-time-val">{fmtTime(cue.endTime)}</span>
                <span className="lcs-dur-badge">{fmtDuration(cue.startTime, cue.endTime)}</span>
              </div>

              {/* Fields */}
              <div className="lcs-card-fields">
                {visibleFields.map(f => (
                  <div key={f.id} className="lcs-field-row">
                    <span className="lcs-f-label">{f.label}</span>
                    <span className="lcs-f-val">{cue.fieldValues[f.id] || '—'}</span>
                  </div>
                ))}
                {visibleFields.length === 0 && (
                  <div className="lcs-field-row">
                    <span className="lcs-f-val" style={{ color: 'var(--text-faint)', fontStyle: 'italic' }}>All fields hidden</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {sorted.length === 0 && (
          <div className="lcs-empty">No cues yet</div>
        )}
      </div>

      {/* ── Field visibility FAB ── */}
      <button className="lcs-fab" onClick={() => setShowFieldPanel(p => !p)}>
        {showFieldPanel ? '✕ Close' : '⚙ Fields'}
      </button>

      {/* ── Field panel ── */}
      {showFieldPanel && (
        <div className="lcs-field-panel">
          <p className="lcs-panel-title">Visible Fields</p>
          {fields.map(f => (
            <label key={f.id} className="lcs-toggle-row">
              <span className="lcs-toggle-label">{f.label}</span>
              <div
                className={`lcs-toggle${hiddenFields.has(f.id) ? '' : ' lcs-toggle--on'}`}
                onClick={() => toggleField(f.id)}
              >
                <div className="lcs-toggle-knob" />
              </div>
            </label>
          ))}
          <p className="lcs-panel-hint">Saved to this device</p>
        </div>
      )}
    </div>
  );
}

export default LiveCueSheet;
