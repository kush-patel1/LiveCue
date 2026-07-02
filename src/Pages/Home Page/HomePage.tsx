import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '../../Hooks/usePageTitle';
import { LoadingScreen } from '../../Components/LoadingScreen/LoadingScreen';
import './HomePage.css';
import logo from '../../Assets/Logo/LIVECUE-Logo.png';
import { Project } from '../../Interfaces/Project/Project';
import { db, collection, addDoc, getDocs, query, where, auth, doc, deleteDoc, onSnapshot } from '../../Backend/firebase';
import { User } from '../../Interfaces/User/User';
import { User as FirebaseUser, signOut } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { Cue } from '../../Interfaces/Cue/Cue';
import { DEFAULT_FIELDS } from '../../Interfaces/CustomField/CustomField';
import { usePlan } from '../../Hooks/usePlan';
import { UpgradeModal, UpgradeFeature } from '../../Components/UpgradeModal/UpgradeModal';

interface HomePageProps {
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  projects: Project[];
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function daysUntil(date: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

function getStatusLabel(date: Date): 'upcoming' | 'today' | 'past' {
  const days = daysUntil(date);
  if (days > 0) return 'upcoming';
  if (days === 0) return 'today';
  return 'past';
}

function upcomingThisMonth(projects: Project[]): number {
  const now = new Date();
  return projects.filter(p => {
    const d = daysUntil(p.date);
    return d >= 0 && p.date.getMonth() === now.getMonth() && p.date.getFullYear() === now.getFullYear();
  }).length;
}

function nextUpcomingProject(projects: Project[]): Project | null {
  const future = projects.filter(p => daysUntil(p.date) >= 0);
  if (!future.length) return null;
  return future.sort((a, b) => a.date.getTime() - b.date.getTime())[0];
}

const HomePage: React.FC<HomePageProps> = ({ user, projects, setProjects, setUser }) => {
  usePageTitle("Projects");
  const navigate = useNavigate();
  const { plan, canCreateProject, teamId, isTeamOwner } = usePlan(user?.id);
  const isTeamMember = !!teamId && !isTeamOwner;
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<UpgradeFeature | null>(null);
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  const projectToDelete = projects.find(p => p.firebaseID === deleteProjectId);

  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectDate, setNewProjectDate] = useState('');
  const [newProjectStartTime, setNewProjectStartTime] = useState(() => localStorage.getItem('lc_default_start') || '');
  const [newProjectEndTime, setNewProjectEndTime] = useState(() => localStorage.getItem('lc_default_end') || '');

  const getNextProjectID = () =>
    projects.length > 0 ? Math.max(...projects.map(p => p.projectID)) + 1 : 1;

  const handleAddProject = async () => {
    if (!canCreateProject(projects.length)) {
      setUpgradeFeature('projects');
      return;
    }
    if (!newProjectTitle || !newProjectDate || !newProjectStartTime || !newProjectEndTime) {
      alert('Please fill in all fields.');
      return;
    }
    if (!user) return;

    const startTime = new Date(`${newProjectDate}T${newProjectStartTime}:00`);
    const endTime = new Date(`${newProjectDate}T${newProjectEndTime}:00`);
    if (startTime >= endTime) { alert('End time must be after start time.'); return; }

    const durationMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / 60000);

    const newProject: Project = {
      firebaseID: '',
      projectID: getNextProjectID(),
      title: newProjectTitle,
      date: new Date(newProjectDate),
      startTime,
      endTime,
      duration: new Date(0, 0, 0, Math.floor(durationMinutes / 60), durationMinutes % 60),
      cues: [],
      cueAmount: 0,
      owner: user.id,
      ...(teamId ? { teamId } : {}),
      fields: DEFAULT_FIELDS,
    };

    try {
      const docRef = await addDoc(collection(db, 'projects'), newProject);
      newProject.firebaseID = docRef.id;
      setProjects(prev => [...prev, newProject]);
    } catch (err) {
      console.error('Error adding project:', err);
    }

    setShowModal(false);
    setNewProjectTitle('');
    setNewProjectDate('');
    setNewProjectStartTime('');
    setNewProjectEndTime('');
  };

  function mapFirebaseUserToAppUser(firebaseUser: FirebaseUser | null): User | null {
    if (!firebaseUser) return null;
    return { id: firebaseUser.uid, email: firebaseUser.email || '', firstName: '', lastName: '', password: '' };
  }

  useEffect(() => {
    let projectUnsub: (() => void) | null = null;
    const authUnsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (projectUnsub) { projectUnsub(); projectUnsub = null; }
      const appUser = mapFirebaseUserToAppUser(firebaseUser);
      setUser(appUser);
      if (appUser) {
        projectUnsub = fetchProjects(appUser.id);
      } else {
        setProjects([]);
        setLoading(false);
      }
    });
    return () => { authUnsub(); if (projectUnsub) projectUnsub(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When team membership resolves, re-fetch so members see the owner's projects.
  useEffect(() => {
    if (!user?.id) return;
    const unsub = fetchProjects(user.id);
    return unsub;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, isTeamOwner]);

  const fetchCues = async (projectId: string): Promise<Cue[]> => {
    try {
      const snap = await getDocs(query(collection(db, 'cues'), where('projectRef', '==', projectId)));
      return snap.docs
        .map(d => ({ id: d.id, ...d.data() } as Cue))
        .sort((a, b) => a.cueNumber - b.cueNumber);
    } catch { return []; }
  };

  const fetchProjects = (userId: string): (() => void) => {
    // Members see all projects belonging to the team (queried by teamId).
    // Owners and solo users see their own projects (queried by owner uid).
    const q = isTeamMember && teamId
      ? query(collection(db, 'projects'), where('teamId', '==', teamId))
      : query(collection(db, 'projects'), where('owner', '==', userId));
    const unsub = onSnapshot(q, async (snap) => {
      try {
        const list: Project[] = [];
        for (const d of snap.docs) {
          const data = d.data();
          const cues = await fetchCues(d.id);
          list.push({
            firebaseID: d.id,
            projectID: data.projectID,
            title: data.title,
            date: data.date.toDate(),
            startTime: data.startTime.toDate(),
            endTime: data.endTime.toDate(),
            duration: data.duration.toDate(),
            cues,
            cueAmount: data.cueAmount ?? cues.length,
            owner: data.owner,
            fields: data.fields || DEFAULT_FIELDS,
          });
        }
        setProjects(list);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    });
    return unsub;
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const handleDeleteProject = async () => {
    if (!deleteProjectId) return;
    try {
      const cueSnap = await getDocs(query(collection(db, 'cues'), where('projectRef', '==', deleteProjectId)));
      await Promise.all(cueSnap.docs.map(d => deleteDoc(doc(db, 'cues', d.id))));
      await deleteDoc(doc(db, 'projects', deleteProjectId));
      setProjects(prev => prev.filter(p => p.firebaseID !== deleteProjectId));
    } catch (err) { console.error(err); }
    finally { setDeleteProjectId(null); }
  };

  if (loading) return <LoadingScreen />;

  const displayName = auth.currentUser?.displayName || '';
  const firstName = displayName.split(' ')[0] || '';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('') || (user?.email?.[0].toUpperCase() ?? '?');
  const sorted = [...projects].sort((a, b) => b.date.getTime() - a.date.getTime());
  const nextProject = nextUpcomingProject(projects);
  const nextDays = nextProject ? daysUntil(nextProject.date) : null;
  const thisMonth = upcomingThisMonth(projects);

  return (
    <div className="hp-shell">
      {/* ── Sidebar ── */}
      <aside className="hp-sidebar">
        <div className="hp-sb-logo">
          <img src={logo} alt="LiveCue" className="hp-sb-logo-img" onClick={() => navigate('/HomePage')} />
        </div>
        <nav className="hp-sb-nav">
          <div className="hp-sb-item active">
            <span className="hp-sb-icon">⊞</span>Projects
          </div>
          <div className="hp-sb-item" onClick={() => navigate('/settings')}>
            <span className="hp-sb-icon">⚙</span>Settings
          </div>
        </nav>
        <div className="hp-sb-footer">
          <div className="hp-sb-user">
            <div className="hp-sb-avatar">{initials}</div>
            <div className="hp-sb-user-info">
              {displayName && <div className="hp-sb-name">{displayName}</div>}
              <div className="hp-sb-email">{user?.email}</div>
            </div>
          </div>
          <button className="hp-sb-logout" onClick={handleLogout}>Log out</button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="hp-main">
        {/* Top bar */}
        <div className="hp-topbar">
          <div>
            <div className="hp-topbar-greeting">{getGreeting()}{firstName ? `, ${firstName}` : ''}</div>
            <div className="hp-topbar-sub">
              {projects.length} project{projects.length !== 1 ? 's' : ''}
              {nextProject && nextDays !== null && ` · next event in ${nextDays === 0 ? 'today' : `${nextDays} day${nextDays !== 1 ? 's' : ''}`}`}
            </div>
          </div>
          <button className="hp-btn-new" onClick={() => canCreateProject(projects.length) ? setShowModal(true) : setUpgradeFeature('projects')}>
            + New Project
          </button>
        </div>

        {/* Stats */}
        <div className="hp-stats-row">
          <div className="hp-stat">
            <div className="hp-stat-label">Projects</div>
            <div className="hp-stat-value">{projects.length}</div>
            <div className="hp-stat-sub">total</div>
          </div>
          <div className="hp-stat">
            <div className="hp-stat-label">Upcoming</div>
            <div className="hp-stat-value">{thisMonth}</div>
            <div className="hp-stat-sub">this month</div>
          </div>
          <div className="hp-stat">
            <div className="hp-stat-label">Next event</div>
            <div className="hp-stat-value hp-stat-value--md">
              {nextProject ? nextProject.date.toLocaleDateString([], { month: 'short', day: 'numeric' }) : '—'}
            </div>
            <div className="hp-stat-sub">
              {nextProject && nextDays !== null
                ? nextDays === 0 ? 'today!' : `${nextDays} day${nextDays !== 1 ? 's' : ''} away`
                : 'no upcoming events'}
            </div>
          </div>
        </div>

        {/* Project list */}
        <div className="hp-section-header">
          <span className="hp-section-title">{isTeamMember ? 'Team projects' : 'Your projects'}</span>
          <span className="hp-section-count">{projects.length} total</span>
        </div>

        {/* Seats nudge for Pro users */}
        {plan === 'pro' && (
          <div className="hp-team-nudge" onClick={() => setUpgradeFeature('seats')}>
            <span className="hp-team-nudge-icon">👥</span>
            <span className="hp-team-nudge-text">Want to collaborate? <strong>Upgrade to Team</strong> for 5 shared seats.</span>
            <span className="hp-team-nudge-arrow">→</span>
          </div>
        )}

        <div className="hp-list">
          {sorted.length === 0 && (
            <div className="hp-empty">
              No projects yet. Click <strong>+ New Project</strong> to get started.
            </div>
          )}
          {sorted.map(project => {
            const status = getStatusLabel(project.date);
            const days = daysUntil(project.date);
            const durationH = project.duration.getHours();
            const durationM = project.duration.getMinutes();
            const durationStr = durationM > 0 ? `${durationH}hr ${durationM}min` : `${durationH}hr`;

            return (
              <div key={project.firebaseID} className="hp-card">
                {/* Card header */}
                <div className="hp-card-header">
                  <div className="hp-card-header-left">
                    <div className="hp-card-title">{project.title}</div>
                    <div className="hp-card-chips">
                      <span className="hp-chip hp-chip-date">
                        {project.date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className={`hp-chip hp-chip-status hp-chip-${status}`}>
                        {status === 'today' ? 'Today' : status === 'upcoming' ? 'Upcoming' : 'Past'}
                      </span>
                    </div>
                  </div>
                  <div className="hp-card-actions">
                    <button className="hp-act hp-act-edit" title="Edit" onClick={() => navigate(`/CueInput/${project.firebaseID}`)}>✎</button>
                    <button className="hp-act hp-act-live" title="Go Live" onClick={() => navigate(`/AdminPage/${project.firebaseID}`)}>⊙</button>
                    {project.owner === user?.id && (
                      <>
                        <div className="hp-act-divider" />
                        <button className="hp-act hp-act-del" title="Delete" onClick={() => setDeleteProjectId(project.firebaseID)}>⌫</button>
                      </>
                    )}
                  </div>
                </div>

                {/* Meta row */}
                <div className="hp-card-meta">
                  <span className="hp-meta-item">
                    🕐 {project.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })} – {project.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </span>
                  <span className="hp-meta-item">⏱ {durationStr}</span>
                  <span className="hp-meta-item">☰ {project.cueAmount ?? project.cues.length} cue{(project.cueAmount ?? project.cues.length) !== 1 ? 's' : ''}</span>
                  <span className="hp-meta-item">⊟ {(project.fields || DEFAULT_FIELDS).length} fields</span>
                </div>

                <div className="hp-card-divider" />

                {/* Cue grid */}
                {project.cues.length > 0 ? (
                  <>
                    <div className="hp-cues-grid">
                      {project.cues.slice(0, 6).map((cue, i) => (
                        <div key={cue.id} className="hp-cue-row">
                          <span className="hp-cue-n">{String(i + 1).padStart(2, '0')}</span>
                          <span className="hp-cue-title">{cue.title || '—'}</span>
                        </div>
                      ))}
                    </div>
                    {project.cues.length > 6 && (
                      <div className="hp-cue-more">+{project.cues.length - 6} more cues</div>
                    )}
                  </>
                ) : (
                  <div className="hp-cue-empty">No cues yet — click Edit to add some.</div>
                )}

                {/* Countdown bar */}
                {status !== 'past' && (
                  <div className="hp-progress-wrap">
                    <span className="hp-progress-label">
                      {days === 0 ? 'Today' : `${days} day${days !== 1 ? 's' : ''} away`}
                    </span>
                    <div className="hp-progress-track">
                      <div className="hp-progress-fill" style={{ width: `${Math.max(5, 100 - Math.min(days, 60) / 60 * 100)}%` }} />
                    </div>
                    <span className="hp-progress-label">
                      {project.date.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* ── Delete confirmation ── */}
      {deleteProjectId && (
        <div className="confirm-overlay" onClick={() => setDeleteProjectId(null)}>
          <div className="confirm-modal" onClick={e => e.stopPropagation()}>
            <h3 className="inter-bold" style={{ color: '#fff6ee', marginBottom: 10 }}>Delete Project?</h3>
            <p className="inter-regular" style={{ color: 'rgba(255,246,238,0.6)', fontSize: 14, marginBottom: 24 }}>
              Are you sure you want to delete <strong style={{ color: '#fff6ee' }}>"{projectToDelete?.title}"</strong>?
              This will permanently remove the project and all its cues.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="confirm-btn-cancel" onClick={() => setDeleteProjectId(null)}>Cancel</button>
              <button className="confirm-btn-delete" onClick={handleDeleteProject}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Upgrade modal ── */}
      {upgradeFeature && (
        <UpgradeModal feature={upgradeFeature} currentPlan={plan} onClose={() => setUpgradeFeature(null)} />
      )}

      {/* ── New project modal ── */}
      {showModal && (
        <div className="confirm-overlay" onClick={() => setShowModal(false)}>
          <div className="confirm-modal hp-form-modal" onClick={e => e.stopPropagation()}>
            <h3 className="inter-bold" style={{ color: '#fff6ee', marginBottom: 20 }}>New Project</h3>

            <label className="hp-form-label">Project Title</label>
            <input className="hp-form-input" placeholder="e.g. Sunday Service" value={newProjectTitle}
              onChange={e => setNewProjectTitle(e.target.value)} autoFocus />

            <label className="hp-form-label">Date</label>
            <input className="hp-form-input" type="date" value={newProjectDate}
              onChange={e => setNewProjectDate(e.target.value)} />

            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label className="hp-form-label">Start Time</label>
                <input className="hp-form-input" type="time" value={newProjectStartTime}
                  onChange={e => setNewProjectStartTime(e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label className="hp-form-label">End Time</label>
                <input className="hp-form-input" type="time" value={newProjectEndTime}
                  onChange={e => setNewProjectEndTime(e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
              <button className="confirm-btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="hp-btn-create" onClick={handleAddProject}>Create Project</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
