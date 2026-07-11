import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '../../Hooks/usePageTitle';
import { LoadingScreen } from '../../Components/LoadingScreen/LoadingScreen';
import './HomePage.css';
import logo from '../../Assets/Logo/LIVECUE-Logo.png';
import { Project } from '../../Interfaces/Project/Project';
import { db, collection, addDoc, getDocs, query, where, auth, doc, deleteDoc, onSnapshot, updateDoc } from '../../Backend/firebase';
import { getDoc } from 'firebase/firestore';
import { User } from '../../Interfaces/User/User';
import { User as FirebaseUser, signOut } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { Cue } from '../../Interfaces/Cue/Cue';
import { DEFAULT_FIELDS, getUserDefaultFields } from '../../Interfaces/CustomField/CustomField';
import { usePlan } from '../../Hooks/usePlan';
import { UpgradeModal, UpgradeFeature } from '../../Components/UpgradeModal/UpgradeModal';
import { WelcomeModal } from '../../Components/WelcomeModal/WelcomeModal';
import { Folder } from '../../Interfaces/Folder/Folder';
import { IconFolder, IconMove, IconClock, IconEdit, IconBroadcast, IconCopy, IconTrash, IconGrid, IconSettings, IconCheck, IconTimer, IconSliders } from '../../Components/Icons/Icons';

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

  // First-run welcome — shown exactly once per account, ever. The flag lives on
  // the user's Firestore doc (not localStorage, which is per-browser), and is
  // written the moment the modal is shown so it never reappears — even across
  // devices or if the user navigates away without closing it.
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    let active = true;
    getDoc(doc(db, 'users', uid))
      .then((snap) => {
        if (!active || !snap.exists() || snap.data()?.welcomedAt) return;
        setShowWelcome(true);
        updateDoc(doc(db, 'users', uid), { welcomedAt: new Date().toISOString() }).catch(() => {});
      })
      .catch(() => {});
    return () => { active = false; };
  }, [user?.id]);

  const dismissWelcome = () => setShowWelcome(false);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<UpgradeFeature | null>(null);
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [moveProjectId, setMoveProjectId] = useState<string | null>(null);
  const [deleteFolderId, setDeleteFolderId] = useState<string | null>(null);
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
      fields: getUserDefaultFields(), // user's configured default cue fields
      shareEnabled: true, // live cue sheet link is viewable by anyone with it
      folderId: currentFolderId, // create inside the folder currently being viewed
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

  const handleDuplicateProject = async (project: Project) => {
    if (!user) return;
    if (!canCreateProject(projects.length)) { setUpgradeFeature('projects'); return; }
    setDuplicatingId(project.firebaseID);
    try {
      const sourceCues = await fetchCues(project.firebaseID);
      const docRef = await addDoc(collection(db, 'projects'), {
        projectID: getNextProjectID(),
        title: `${project.title} (Copy)`,
        date: project.date,
        startTime: project.startTime,
        endTime: project.endTime,
        duration: project.duration,
        cueAmount: sourceCues.length,
        owner: user.id,
        ...(teamId ? { teamId } : {}),
        fields: project.fields || DEFAULT_FIELDS,
        shareEnabled: true,
        folderId: project.folderId ?? null,
      });
      // Copy every cue to the new project — fresh IDs, never live.
      await Promise.all(sourceCues.map((c) =>
        addDoc(collection(db, 'cues'), {
          cueNumber: c.cueNumber,
          title: c.title,
          startTime: c.startTime,
          endTime: c.endTime,
          projectRef: docRef.id,
          isLive: false,
          fieldValues: c.fieldValues || {},
        })
      ));
    } catch (err) {
      console.error('Error duplicating project:', err);
      alert('Could not duplicate the project. Please try again.');
    } finally {
      setDuplicatingId(null);
    }
  };

  // ── Folders ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    const q = (isTeamMember && teamId)
      ? query(collection(db, 'folders'), where('teamId', '==', teamId))
      : query(collection(db, 'folders'), where('owner', '==', user.id));
    return onSnapshot(q, (snap) => {
      setFolders(snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Folder))
        .sort((a, b) => a.name.localeCompare(b.name)));
    }, () => {});
  }, [user?.id, teamId, isTeamMember]);

  const createFolder = async () => {
    const name = newFolderName.trim();
    if (!name || !user) return;
    try {
      await addDoc(collection(db, 'folders'), {
        name, owner: user.id, ...(teamId ? { teamId } : {}), createdAt: new Date().toISOString(),
      });
      setNewFolderName('');
      setShowFolderModal(false);
    } catch (err) { console.error('Error creating folder:', err); }
  };

  const moveProjectToFolder = async (projectId: string, folderId: string | null) => {
    try {
      await updateDoc(doc(db, 'projects', projectId), { folderId });
      setMoveProjectId(null);
    } catch (err) { console.error('Error moving project:', err); }
  };

  const handleDeleteFolder = async () => {
    if (!deleteFolderId) return;
    try {
      // Move any projects in this folder back to unfiled, then delete the folder.
      await Promise.all(
        projects.filter((p) => p.folderId === deleteFolderId)
          .map((p) => updateDoc(doc(db, 'projects', p.firebaseID), { folderId: null }))
      );
      await deleteDoc(doc(db, 'folders', deleteFolderId));
      if (currentFolderId === deleteFolderId) setCurrentFolderId(null);
    } catch (err) { console.error('Error deleting folder:', err); }
    finally { setDeleteFolderId(null); }
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
            autoTiming: data.autoTiming ?? false,
            folderId: data.folderId ?? null,
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
  const currentFolder = folders.find(f => f.id === currentFolderId) || null;
  const projectCountIn = (fid: string | null) => projects.filter(p => (p.folderId ?? null) === fid).length;
  const visibleProjects = sorted.filter(p => (p.folderId ?? null) === currentFolderId);
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
            <span className="hp-sb-icon"><IconGrid size={17} /></span>Projects
          </div>
          <div className="hp-sb-item" onClick={() => navigate('/settings')}>
            <span className="hp-sb-icon"><IconSettings size={17} /></span>Settings
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

        {/* Folders — only at the top level */}
        {!currentFolderId && (
          <>
            <div className="hp-section-header">
              <span className="hp-section-title">Folders</span>
              <button className="hp-newfolder-btn" onClick={() => setShowFolderModal(true)}>+ New folder</button>
            </div>
            {folders.length === 0 ? (
              <div className="hp-folders-empty">No folders yet. Create one to group events — for example, a folder per client or couple.</div>
            ) : (
              <div className="hp-folders">
                {folders.map(f => (
                  <div key={f.id} className="hp-folder" onClick={() => setCurrentFolderId(f.id)}>
                    <div className="hp-folder-icon"><IconFolder size={20} /></div>
                    <div className="hp-folder-info">
                      <div className="hp-folder-name">{f.name}</div>
                      <div className="hp-folder-count">{projectCountIn(f.id)} event{projectCountIn(f.id) !== 1 ? 's' : ''}</div>
                    </div>
                    <button
                      className="hp-folder-del"
                      title="Delete folder"
                      aria-label={`Delete folder ${f.name}`}
                      onClick={(e) => { e.stopPropagation(); setDeleteFolderId(f.id); }}
                    ><IconTrash size={15} /></button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Project list */}
        <div className="hp-section-header">
          {currentFolderId ? (
            <span className="hp-breadcrumb">
              <button className="hp-crumb" onClick={() => setCurrentFolderId(null)}>All projects</button>
              <span className="hp-crumb-sep">/</span>
              <span className="hp-crumb-current">{currentFolder?.name ?? 'Folder'}</span>
            </span>
          ) : (
            <span className="hp-section-title">{isTeamMember ? 'Team projects' : 'Your projects'}</span>
          )}
          <span className="hp-section-count">{visibleProjects.length} {currentFolderId ? 'in folder' : 'unfiled'}</span>
        </div>

        <div className="hp-list">
          {visibleProjects.length === 0 && (
            <div className="hp-empty">
              {currentFolderId
                ? <>This folder is empty. Click <strong>+ New Project</strong> to add an event here.</>
                : <>No projects here. Click <strong>+ New Project</strong> to get started.</>}
            </div>
          )}
          {visibleProjects.map(project => {
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
                    <button className="hp-act hp-act-edit" title="Edit" aria-label="Edit" onClick={() => navigate(`/CueInput/${project.firebaseID}`)}><IconEdit size={16} /></button>
                    <button className="hp-act hp-act-live" title="Go Live" aria-label="Go live" onClick={() => navigate(`/AdminPage/${project.firebaseID}`)}><IconBroadcast size={16} /></button>
                    {project.owner === user?.id && (
                      <>
                        <div className="hp-act-divider" />
                        <button
                          className="hp-act hp-act-move"
                          title="Move to folder"
                          aria-label="Move to folder"
                          onClick={() => setMoveProjectId(project.firebaseID)}
                        ><IconMove size={16} /></button>
                        <button
                          className="hp-act hp-act-dup"
                          title="Duplicate"
                          aria-label="Duplicate"
                          disabled={duplicatingId === project.firebaseID}
                          onClick={() => handleDuplicateProject(project)}
                        >{duplicatingId === project.firebaseID ? '…' : <IconCopy size={16} />}</button>
                        <button className="hp-act hp-act-del" title="Delete" aria-label="Delete" onClick={() => setDeleteProjectId(project.firebaseID)}><IconTrash size={16} /></button>
                      </>
                    )}
                  </div>
                </div>

                {/* Meta row */}
                <div className="hp-card-meta">
                  <span className="hp-meta-item">
                    <IconClock size={14} /> {project.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })} – {project.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </span>
                  <span className="hp-meta-item"><IconTimer size={14} /> {durationStr}</span>
                  <span className="hp-meta-item"><IconGrid size={14} /> {project.cueAmount ?? project.cues.length} cue{(project.cueAmount ?? project.cues.length) !== 1 ? 's' : ''}</span>
                  <span className="hp-meta-item"><IconSliders size={14} /> {(project.fields || DEFAULT_FIELDS).length} fields</span>
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

      {/* ── New folder modal ── */}
      {showFolderModal && (
        <div className="confirm-overlay" onClick={() => setShowFolderModal(false)}>
          <div className="confirm-modal hp-form-modal" onClick={e => e.stopPropagation()}>
            <h3 className="inter-bold" style={{ color: '#fff6ee', marginBottom: 16 }}>New Folder</h3>
            <input
              className="hp-form-input"
              placeholder="e.g. Sharma–Patel Wedding"
              value={newFolderName}
              autoFocus
              onChange={e => setNewFolderName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') createFolder(); }}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="confirm-btn-cancel" onClick={() => setShowFolderModal(false)}>Cancel</button>
              <button className="hp-btn-create" onClick={createFolder} disabled={!newFolderName.trim()}>Create Folder</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Move to folder modal ── */}
      {moveProjectId && (
        <div className="confirm-overlay" onClick={() => setMoveProjectId(null)}>
          <div className="confirm-modal" onClick={e => e.stopPropagation()}>
            <h3 className="inter-bold" style={{ color: '#fff6ee', marginBottom: 6 }}>Move to folder</h3>
            <p className="inter-regular" style={{ color: 'rgba(255,246,238,0.6)', fontSize: 14, marginBottom: 16 }}>
              Choose where this event should live.
            </p>
            <div className="hp-move-list">
              <button
                className={`hp-move-opt${(projects.find(p => p.firebaseID === moveProjectId)?.folderId ?? null) === null ? ' active' : ''}`}
                onClick={() => moveProjectToFolder(moveProjectId, null)}
              >
                <span className="hp-move-label"><IconMove size={16} /> No folder</span>
                {(projects.find(p => p.firebaseID === moveProjectId)?.folderId ?? null) === null && <IconCheck size={16} />}
              </button>
              {folders.map(f => {
                const inThis = projects.find(p => p.firebaseID === moveProjectId)?.folderId === f.id;
                return (
                  <button key={f.id} className={`hp-move-opt${inThis ? ' active' : ''}`} onClick={() => moveProjectToFolder(moveProjectId, f.id)}>
                    <span className="hp-move-label"><IconFolder size={16} /> {f.name}</span>
                    {inThis && <IconCheck size={16} />}
                  </button>
                );
              })}
              {folders.length === 0 && (
                <div className="hp-move-empty">No folders yet — create one from the dashboard first.</div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>
              <button className="confirm-btn-cancel" onClick={() => setMoveProjectId(null)}>Done</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete folder confirm ── */}
      {deleteFolderId && (
        <div className="confirm-overlay" onClick={() => setDeleteFolderId(null)}>
          <div className="confirm-modal" onClick={e => e.stopPropagation()}>
            <h3 className="inter-bold" style={{ color: '#fff6ee', marginBottom: 10 }}>Delete Folder?</h3>
            <p className="inter-regular" style={{ color: 'rgba(255,246,238,0.6)', fontSize: 14, marginBottom: 24 }}>
              Deleting <strong style={{ color: '#fff6ee' }}>"{folders.find(f => f.id === deleteFolderId)?.name}"</strong> keeps its events —
              they'll move back to unfiled. Only the folder is removed.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="confirm-btn-cancel" onClick={() => setDeleteFolderId(null)}>Cancel</button>
              <button className="confirm-btn-delete" onClick={handleDeleteFolder}>Delete Folder</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Upgrade modal ── */}
      {upgradeFeature && (
        <UpgradeModal feature={upgradeFeature} currentPlan={plan} onClose={() => setUpgradeFeature(null)} />
      )}

      {showWelcome && (
        <WelcomeModal
          plan={plan}
          firstName={firstName}
          onCreateProject={() => { dismissWelcome(); setShowModal(true); }}
          onClose={dismissWelcome}
        />
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
