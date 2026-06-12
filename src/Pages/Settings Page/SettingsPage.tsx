import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SettingsPage.css';
import logo from '../../Assets/Logo/LIVECUE-Logo.png';
import { useTheme } from '../../ThemeContext';
import { Project } from '../../Interfaces/Project/Project';
import {
  auth, db, collection, getDocs, query, where, deleteDoc, doc,
  updateEmail, updatePassword, deleteUser,
  reauthenticateWithCredential, EmailAuthProvider, updateProfile,
} from '../../Backend/firebase';
import { signOut } from 'firebase/auth';

interface SettingsPageProps {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
}

type ReauthAction = 'email' | 'password' | 'delete-account' | null;

function SettingsPage({ projects, setProjects }: SettingsPageProps) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const currentUser = auth.currentUser;

  // ── Account state ─────────────────────────────────────────────────────────
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [newEmail, setNewEmail]   = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // ── Project defaults ───────────────────────────────────────────────────────
  const [defaultStart, setDefaultStart] = useState(() => localStorage.getItem('lc_default_start') || '09:00');
  const [defaultEnd,   setDefaultEnd]   = useState(() => localStorage.getItem('lc_default_end')   || '17:00');

  // ── Reauthentication modal ─────────────────────────────────────────────────
  const [reauthAction, setReauthAction] = useState<ReauthAction>(null);
  const [reauthPassword, setReauthPassword] = useState('');

  // ── Feedback ──────────────────────────────────────────────────────────────
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    const parts = (currentUser.displayName || '').split(' ');
    setFirstName(parts[0] || '');
    setLastName(parts.slice(1).join(' ') || '');
    setNewEmail(currentUser.email || '');
  }, [currentUser]);

  const flash = (msg: string, ok = true) => {
    setFeedback({ msg, ok });
    setTimeout(() => setFeedback(null), 3500);
  };

  // ── Reauth helper ──────────────────────────────────────────────────────────
  const reauth = async (): Promise<boolean> => {
    if (!currentUser?.email) return false;
    try {
      const cred = EmailAuthProvider.credential(currentUser.email, reauthPassword);
      await reauthenticateWithCredential(currentUser, cred);
      return true;
    } catch {
      flash('Incorrect password. Please try again.', false);
      return false;
    }
  };

  // ── Save display name ──────────────────────────────────────────────────────
  const handleSaveName = async () => {
    if (!currentUser) return;
    try {
      await updateProfile(currentUser, { displayName: `${firstName} ${lastName}`.trim() });
      flash('Display name updated.');
    } catch { flash('Failed to update name.', false); }
  };

  // ── Change email (requires reauth) ────────────────────────────────────────
  const handleSaveEmail = async () => {
    if (!newEmail || newEmail === currentUser?.email) return;
    setReauthAction('email');
  };

  const handleSavePassword = async () => {
    if (!newPassword) return;
    if (newPassword !== confirmPassword) { flash('Passwords do not match.', false); return; }
    if (newPassword.length < 6) { flash('Password must be at least 6 characters.', false); return; }
    setReauthAction('password');
  };

  // ── Confirm reauth and execute pending action ──────────────────────────────
  const handleReauthConfirm = async () => {
    const ok = await reauth();
    if (!ok) return;
    setReauthPassword('');

    if (reauthAction === 'email') {
      try {
        await updateEmail(currentUser!, newEmail);
        flash('Email updated.');
      } catch (e: any) { flash(e.message || 'Failed to update email.', false); }
    } else if (reauthAction === 'password') {
      try {
        await updatePassword(currentUser!, newPassword);
        setNewPassword('');
        setConfirmPassword('');
        flash('Password updated.');
      } catch (e: any) { flash(e.message || 'Failed to update password.', false); }
    } else if (reauthAction === 'delete-account') {
      try {
        // Delete all projects and their cues
        const uid = currentUser!.uid;
        const pSnap = await getDocs(query(collection(db, 'projects'), where('owner', '==', uid)));
        for (const p of pSnap.docs) {
          const cSnap = await getDocs(query(collection(db, 'cues'), where('projectRef', '==', p.id)));
          await Promise.all(cSnap.docs.map(c => deleteDoc(doc(db, 'cues', c.id))));
          await deleteDoc(doc(db, 'projects', p.id));
        }
        await deleteUser(currentUser!);
        setProjects([]);
        navigate('/');
      } catch (e: any) { flash(e.message || 'Failed to delete account.', false); }
    }

    setReauthAction(null);
  };

  // ── Save project defaults ──────────────────────────────────────────────────
  const handleSaveDefaults = () => {
    localStorage.setItem('lc_default_start', defaultStart);
    localStorage.setItem('lc_default_end', defaultEnd);
    flash('Default times saved.');
  };

  // ── Delete all projects ────────────────────────────────────────────────────
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const handleDeleteAllProjects = async () => {
    if (!currentUser) return;
    try {
      const uid = currentUser.uid;
      const pSnap = await getDocs(query(collection(db, 'projects'), where('owner', '==', uid)));
      for (const p of pSnap.docs) {
        const cSnap = await getDocs(query(collection(db, 'cues'), where('projectRef', '==', p.id)));
        await Promise.all(cSnap.docs.map(c => deleteDoc(doc(db, 'cues', c.id))));
        await deleteDoc(doc(db, 'projects', p.id));
      }
      setProjects([]);
      setConfirmDeleteAll(false);
      flash('All projects deleted.');
    } catch { flash('Failed to delete projects.', false); }
  };

  return (
    <div className="sp-shell">

      {/* ── Sidebar ── */}
      <aside className="hp-sidebar">
        <div className="hp-sb-logo">
          <img src={logo} alt="LiveCue" className="hp-sb-logo-img" onClick={() => navigate('/HomePage')} />
        </div>
        <nav className="hp-sb-nav">
          <div className="hp-sb-item" onClick={() => navigate('/HomePage')}>
            <span className="hp-sb-icon">⊞</span>Projects
          </div>
          <div className="hp-sb-item active">
            <span className="hp-sb-icon">⚙</span>Settings
          </div>
        </nav>
        <div className="hp-sb-footer">
          {(() => {
            const dn = currentUser?.displayName || '';
            const initials = dn.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('') || (currentUser?.email?.[0].toUpperCase() ?? '?');
            return (
              <div className="hp-sb-user">
                <div className="hp-sb-avatar">{initials}</div>
                <div className="hp-sb-user-info">
                  {dn && <div className="hp-sb-name">{dn}</div>}
                  <div className="hp-sb-email">{currentUser?.email}</div>
                </div>
              </div>
            );
          })()}
          <button className="hp-sb-logout" onClick={async () => { await signOut(auth); navigate('/login'); }}>
            Log out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="sp-main">
        <div className="sp-topbar">
          <div className="sp-topbar-title">Settings</div>
          <div className="sp-topbar-sub">Manage your account and preferences</div>
        </div>

        {feedback && (
          <div className={`sp-feedback ${feedback.ok ? 'sp-feedback-ok' : 'sp-feedback-err'}`}>
            {feedback.msg}
          </div>
        )}

        <div className="sp-content">

          {/* ── Account ── */}
          <div className="sp-section">
            <div className="sp-section-label">Account</div>

            {/* Display name */}
            <div className="sp-card">
              <div className="sp-card-title">Display Name</div>
              <div className="sp-card-desc">This name is visible only to you.</div>
              <div className="sp-inline-fields">
                <input className="sp-input" placeholder="First name" value={firstName}
                  onChange={e => setFirstName(e.target.value)} />
                <input className="sp-input" placeholder="Last name" value={lastName}
                  onChange={e => setLastName(e.target.value)} />
              </div>
              <button className="sp-btn-save" onClick={handleSaveName}>Save Name</button>
            </div>

            {/* Change email */}
            <div className="sp-card">
              <div className="sp-card-title">Email Address</div>
              <div className="sp-card-desc">You'll be asked to confirm your current password.</div>
              <input className="sp-input" type="email" placeholder="New email address"
                value={newEmail} onChange={e => setNewEmail(e.target.value)} />
              <button className="sp-btn-save" onClick={handleSaveEmail}
                disabled={!newEmail || newEmail === currentUser?.email}>
                Update Email
              </button>
            </div>

            {/* Change password */}
            <div className="sp-card">
              <div className="sp-card-title">Password</div>
              <div className="sp-card-desc">Choose a strong password with at least 6 characters.</div>
              <input className="sp-input" type="password" placeholder="New password"
                value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              <input className="sp-input" type="password" placeholder="Confirm new password"
                value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                style={{ marginTop: 8 }} />
              <button className="sp-btn-save" onClick={handleSavePassword} disabled={!newPassword}>
                Update Password
              </button>
            </div>
          </div>

          {/* ── Appearance ── */}
          <div className="sp-section">
            <div className="sp-section-label">Appearance</div>
            <div className="sp-row">
              <div className="sp-row-info">
                <div className="sp-row-title">Theme</div>
                <div className="sp-row-desc">Switch between dark and light mode</div>
              </div>
              <div className="sp-theme-toggle">
                <button className={`sp-theme-btn ${theme === 'dark' ? 'active' : ''}`}
                  onClick={() => theme !== 'dark' && toggleTheme()}>
                  🌙 Dark
                </button>
                <button className={`sp-theme-btn ${theme === 'light' ? 'active' : ''}`}
                  onClick={() => theme !== 'light' && toggleTheme()}>
                  ☀️ Light
                </button>
              </div>
            </div>
          </div>

          {/* ── Project Defaults ── */}
          <div className="sp-section">
            <div className="sp-section-label">Project Defaults</div>
            <div className="sp-card">
              <div className="sp-card-title">Default Event Times</div>
              <div className="sp-card-desc">Pre-filled start and end times when creating a new project.</div>
              <div className="sp-inline-fields">
                <div className="sp-field-group">
                  <label className="sp-field-label">Start Time</label>
                  <input className="sp-input" type="time" value={defaultStart}
                    onChange={e => setDefaultStart(e.target.value)} />
                </div>
                <div className="sp-field-group">
                  <label className="sp-field-label">End Time</label>
                  <input className="sp-input" type="time" value={defaultEnd}
                    onChange={e => setDefaultEnd(e.target.value)} />
                </div>
              </div>
              <button className="sp-btn-save" onClick={handleSaveDefaults}>Save Defaults</button>
            </div>
          </div>

          {/* ── Danger Zone ── */}
          <div className="sp-section">
            <div className="sp-section-label sp-section-label-danger">Danger Zone</div>

            <div className="sp-card sp-card-danger">
              <div className="sp-danger-row">
                <div>
                  <div className="sp-card-title">Delete All Projects</div>
                  <div className="sp-card-desc">Permanently removes all {projects.length} project{projects.length !== 1 ? 's' : ''} and their cues.</div>
                </div>
                <button className="sp-btn-danger" onClick={() => setConfirmDeleteAll(true)}
                  disabled={projects.length === 0}>
                  Delete All
                </button>
              </div>
            </div>

            <div className="sp-card sp-card-danger">
              <div className="sp-danger-row">
                <div>
                  <div className="sp-card-title">Delete Account</div>
                  <div className="sp-card-desc">Permanently deletes your account and all associated data. This cannot be undone.</div>
                </div>
                <button className="sp-btn-danger" onClick={() => setReauthAction('delete-account')}>
                  Delete Account
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* ── Reauthentication modal ── */}
      {reauthAction && (
        <div className="confirm-overlay" onClick={() => { setReauthAction(null); setReauthPassword(''); }}>
          <div className="confirm-modal" onClick={e => e.stopPropagation()}>
            <h3 className="inter-bold" style={{ color: 'var(--text-primary)', marginBottom: 8 }}>
              Confirm your password
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
              {reauthAction === 'delete-account'
                ? 'Enter your current password to permanently delete your account.'
                : 'Enter your current password to continue.'}
            </p>
            <input
              className="sp-input"
              type="password"
              placeholder="Current password"
              value={reauthPassword}
              onChange={e => setReauthPassword(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleReauthConfirm(); }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="confirm-btn-cancel" onClick={() => { setReauthAction(null); setReauthPassword(''); }}>
                Cancel
              </button>
              <button
                className={reauthAction === 'delete-account' ? 'confirm-btn-delete' : 'sp-btn-save'}
                onClick={handleReauthConfirm}
                disabled={!reauthPassword}
              >
                {reauthAction === 'delete-account' ? 'Delete Account' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete all projects confirmation ── */}
      {confirmDeleteAll && (
        <div className="confirm-overlay" onClick={() => setConfirmDeleteAll(false)}>
          <div className="confirm-modal" onClick={e => e.stopPropagation()}>
            <h3 className="inter-bold" style={{ color: 'var(--text-primary)', marginBottom: 8 }}>
              Delete all projects?
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>
              This will permanently delete all <strong style={{ color: 'var(--text-primary)' }}>{projects.length} project{projects.length !== 1 ? 's' : ''}</strong> and every cue inside them. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="confirm-btn-cancel" onClick={() => setConfirmDeleteAll(false)}>Cancel</button>
              <button className="confirm-btn-delete" onClick={handleDeleteAllProjects}>Delete All</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default SettingsPage;
