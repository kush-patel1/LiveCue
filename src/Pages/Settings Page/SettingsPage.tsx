import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '../../Hooks/usePageTitle';
import './SettingsPage.css';
import logo from '../../Assets/Logo/LIVECUE-Logo.png';
import { useTheme } from '../../ThemeContext';
import { Project } from '../../Interfaces/Project/Project';
import {
  auth, db, collection, getDocs, query, where, deleteDoc, doc,
  updateEmail, updatePassword, deleteUser,
  reauthenticateWithCredential, EmailAuthProvider, updateProfile,
} from '../../Backend/firebase';
import { getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { usePlan } from '../../Hooks/usePlan';
import { redirectToCustomerPortal } from '../../Services/StripeService/stripeService';
import { inviteTeamMember, removeTeamMember, leaveTeam } from '../../Services/TeamService/teamService';
import { PLAN_LIMITS } from '../../Config/planLimits';
import { Team } from '../../Interfaces/Team/Team';

interface SettingsPageProps {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
}

type ReauthAction = 'email' | 'password' | 'delete-account' | null;

function SettingsPage({ projects, setProjects }: SettingsPageProps) {
  usePageTitle("Settings");
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const currentUser = auth.currentUser;
  const {
    plan, loading: planLoading, hasStripeSubscription, teamId, isTeamOwner,
    planExpiry, billingInterval, subscriptionStatus, cancelAtPeriodEnd,
  } = usePlan(currentUser?.uid);
  const [portalLoading, setPortalLoading] = useState(false);

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    // Clear the cached plan so any change made in the portal is re-read on return
    sessionStorage.removeItem('LIVECUE_PLAN');
    sessionStorage.removeItem('LIVECUE_HAS_SUB');
    try {
      await redirectToCustomerPortal();
    } catch {
      setPortalLoading(false);
      alert('Could not open the billing portal. Please try again.');
    }
  };

  // ── Team state ─────────────────────────────────────────────────────────────
  const [teamData, setTeamData] = useState<Team | null>(null);
  const [teamLoading, setTeamLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const planLimits = PLAN_LIMITS[plan];
  const isPaid = plan === 'pro' || plan === 'team';


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

  useEffect(() => {
    if (!teamId) { setTeamData(null); return; }
    setTeamLoading(true);
    getDoc(doc(db, 'teams', teamId))
      .then(snap => { if (snap.exists()) setTeamData({ id: snap.id, ...snap.data() } as Team); })
      .catch(() => {})
      .finally(() => setTeamLoading(false));
  }, [teamId]);

  const reloadTeam = async () => {
    if (!teamId) return;
    const snap = await getDoc(doc(db, 'teams', teamId));
    if (snap.exists()) setTeamData({ id: snap.id, ...snap.data() } as Team);
  };

  const handleInvite = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;
    setInviteLoading(true);
    try {
      const { inviteLink: link } = await inviteTeamMember(email);
      setInviteEmail('');
      setInviteLink(link);
      setLinkCopied(false);
      await reloadTeam();
      flash(`${email} invited — share the link below, or they'll auto-join when they sign in.`);
    } catch (e: any) {
      flash(e.message || 'Failed to create invite.', false);
    } finally {
      setInviteLoading(false);
    }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  };

  const handleLeaveTeam = async () => {
    setLeaving(true);
    try {
      await leaveTeam();
      sessionStorage.removeItem('LIVECUE_PLAN');
      sessionStorage.removeItem('LIVECUE_TEAM');
      sessionStorage.removeItem('LIVECUE_TEAM_OWNER');
      flash('You left the team.');
      setTimeout(() => window.location.reload(), 800);
    } catch (e: any) {
      flash(e.message || 'Failed to leave team.', false);
      setLeaving(false);
    }
  };

  const handleRemoveMember = async (uid: string) => {
    setRemovingId(uid);
    try {
      await removeTeamMember({ uid });
      await reloadTeam();
      flash('Member removed.');
    } catch (e: any) {
      flash(e.message || 'Failed to remove member.', false);
    } finally {
      setRemovingId(null);
    }
  };

  const handleRevokeInvite = async (email: string) => {
    setRemovingId(email);
    try {
      await removeTeamMember({ email });
      await reloadTeam();
      flash('Invite revoked.');
    } catch (e: any) {
      flash(e.message || 'Failed to revoke invite.', false);
    } finally {
      setRemovingId(null);
    }
  };

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

          {/* ── Plan ── */}
          <div className="sp-section">
            <div className="sp-section-label">Plan</div>
            <div className="sp-card sp-card-plan">

              {/* Badge row */}
              <div className="sp-plan-header">
                <div className="sp-plan-badge-wrap">
                  <span className={`sp-plan-badge sp-plan-badge--${plan}`}>
                    {plan.charAt(0).toUpperCase() + plan.slice(1)}
                  </span>
                  {!planLoading && !isPaid && (
                    <span className="sp-plan-tagline">Free forever · upgrade anytime</span>
                  )}
                </div>
                {isPaid && hasStripeSubscription ? (
                  <button
                    className="sp-btn-save"
                    onClick={handleManageSubscription}
                    disabled={portalLoading}
                  >
                    {portalLoading ? 'Opening…' : 'Manage Subscription'}
                  </button>
                ) : !isPaid ? (
                  <button className="sp-btn-upgrade" onClick={() => navigate('/pricing')}>
                    Upgrade to Pro
                  </button>
                ) : null}
              </div>

              {/* Billing status */}
              {isPaid && hasStripeSubscription && (
                <div className="sp-billing-status">
                  {subscriptionStatus === 'past_due' && (
                    <div className="sp-billing-alert sp-billing-alert--warn">
                      ⚠ Your last payment failed. Update your card in Manage
                      Subscription to keep your {plan === 'team' ? 'Team' : 'Pro'} access.
                    </div>
                  )}
                  {cancelAtPeriodEnd && planExpiry && (
                    <div className="sp-billing-alert sp-billing-alert--info">
                      Your subscription is canceled and will end on{' '}
                      {new Date(planExpiry).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}.
                      You keep full access until then — resubscribe anytime from Manage Subscription.
                    </div>
                  )}
                  {!cancelAtPeriodEnd && subscriptionStatus === 'active' && planExpiry && (
                    <div className="sp-billing-line">
                      Billed {billingInterval === 'yearly' ? 'yearly' : 'monthly'} · renews{' '}
                      {new Date(planExpiry).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                  )}
                </div>
              )}

              {/* Usage bars */}
              <div className="sp-plan-usage">
                {/* Projects */}
                <div className="sp-usage-row">
                  <div className="sp-usage-label">
                    <span>Projects</span>
                    <span className="sp-usage-count">
                      {planLimits.maxProjects === -1
                        ? `${projects.length} / Unlimited`
                        : `${projects.length} / ${planLimits.maxProjects}`}
                    </span>
                  </div>
                  <div className="sp-usage-bar">
                    <div
                      className="sp-usage-fill"
                      style={{
                        width: planLimits.maxProjects === -1
                          ? '0%'
                          : `${Math.min(100, (projects.length / planLimits.maxProjects) * 100)}%`,
                        background: planLimits.maxProjects !== -1 && projects.length >= planLimits.maxProjects
                          ? 'var(--sp-danger, #e05252)'
                          : undefined,
                      }}
                    />
                  </div>
                </div>

                {/* AI imports */}
                <div className="sp-usage-row">
                  <div className="sp-usage-label">
                    <span>AI imports this month</span>
                    <span className="sp-usage-count">
                      {planLimits.aiImportsPerMonth === 0
                        ? 'Not included'
                        : `0 / ${planLimits.aiImportsPerMonth}`}
                    </span>
                  </div>
                  {planLimits.aiImportsPerMonth > 0 && (
                    <div className="sp-usage-bar">
                      <div className="sp-usage-fill" style={{ width: '0%' }} />
                    </div>
                  )}
                </div>

                {/* Feature flags */}
                <div className="sp-plan-features">
                  {[
                    { label: 'Unlimited cues',       on: planLimits.maxCues === -1 },
                    { label: 'Custom fields',         on: planLimits.customFields },
                    { label: 'Drag-to-reorder',       on: planLimits.dragReorder },
                    { label: `${planLimits.teamSeats > 1 ? planLimits.teamSeats + ' team seats' : '1 seat'}`, on: true },
                  ].map(({ label, on }) => (
                    <div key={label} className={`sp-plan-feat ${on ? '' : 'sp-plan-feat--off'}`}>
                      <span className="sp-plan-feat-dot">{on ? '✓' : '✗'}</span>
                      {label}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* ── Team (owner view) ── */}
          {plan === 'team' && teamId && isTeamOwner && (
            <div className="sp-section">
              <div className="sp-section-label">Team</div>
              <div className="sp-card">
                <div className="sp-team-header">
                  <div className="sp-card-title">Team Members</div>
                  {teamData && (
                    <span className="sp-team-seats">
                      {(teamData.memberIds?.length ?? 0) + (teamData.pendingInvites?.length ?? 0) + 1} / {teamData.seats} seats used
                    </span>
                  )}
                </div>
                <div className="sp-card-desc">
                  Invite teammates by email. They join automatically the next time they sign
                  in with that address — or share the invite link directly.
                </div>

                {teamLoading ? (
                  <div className="sp-team-empty">Loading…</div>
                ) : (
                  <>
                    <div className="sp-team-list">
                      {/* Owner row */}
                      <div className="sp-team-member">
                        <div className="sp-team-avatar">
                          {(currentUser?.displayName?.[0] ?? currentUser?.email?.[0] ?? '?').toUpperCase()}
                        </div>
                        <div className="sp-team-member-info">
                          <span className="sp-team-member-name">
                            {currentUser?.displayName || currentUser?.email}
                          </span>
                          <span className="sp-team-member-role">Owner</span>
                        </div>
                      </div>

                      {/* Accepted members */}
                      {(teamData?.memberIds ?? []).map(uid => {
                        const info = teamData?.memberInfo?.[uid];
                        const name = info?.displayName || info?.email || uid;
                        return (
                          <div key={uid} className="sp-team-member">
                            <div className="sp-team-avatar sp-team-avatar--member">
                              {(name[0] ?? 'M').toUpperCase()}
                            </div>
                            <div className="sp-team-member-info">
                              <span className="sp-team-member-name">{name}</span>
                              <span className="sp-team-member-role">
                                {info?.email && info.email !== name ? info.email : 'Member'}
                              </span>
                            </div>
                            <button
                              className="sp-team-remove"
                              onClick={() => handleRemoveMember(uid)}
                              disabled={removingId === uid}
                            >
                              {removingId === uid ? '…' : 'Remove'}
                            </button>
                          </div>
                        );
                      })}

                      {/* Pending invites */}
                      {(teamData?.pendingInvites ?? []).map(email => (
                        <div key={email} className="sp-team-member sp-team-member--pending">
                          <div className="sp-team-avatar sp-team-avatar--pending">?</div>
                          <div className="sp-team-member-info">
                            <span className="sp-team-member-name">{email}</span>
                            <span className="sp-team-member-role sp-team-member-role--pending">Invite pending</span>
                          </div>
                          <button
                            className="sp-team-remove"
                            onClick={() => handleRevokeInvite(email)}
                            disabled={removingId === email}
                          >
                            {removingId === email ? '…' : 'Revoke'}
                          </button>
                        </div>
                      ))}

                      {(teamData?.memberIds?.length ?? 0) === 0 &&
                       (teamData?.pendingInvites?.length ?? 0) === 0 && (
                        <div className="sp-team-empty">No members yet. Send your first invite below.</div>
                      )}
                    </div>

                    {/* Copyable invite link (after creating an invite) */}
                    {inviteLink && (
                      <div className="sp-invite-link-row">
                        <div className="sp-url-display">{inviteLink}</div>
                        <button className="sp-btn-ghost" onClick={copyInviteLink}>
                          {linkCopied ? '✓ Copied' : 'Copy link'}
                        </button>
                      </div>
                    )}

                    {/* Invite input */}
                    {teamData && ((teamData.memberIds?.length ?? 0) + (teamData.pendingInvites?.length ?? 0)) < (teamData.seats - 1) ? (
                      <div className="sp-team-invite">
                        <input
                          className="sp-input"
                          type="email"
                          placeholder="teammate@example.com"
                          value={inviteEmail}
                          onChange={e => setInviteEmail(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleInvite(); }}
                        />
                        <button
                          className="sp-btn-save"
                          onClick={handleInvite}
                          disabled={!inviteEmail.trim() || inviteLoading}
                        >
                          {inviteLoading ? 'Inviting…' : 'Invite'}
                        </button>
                      </div>
                    ) : (
                      <div className="sp-team-full">All seats are allocated. Remove a member or revoke an invite to free one up.</div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── Team (member view) ── */}
          {plan === 'team' && teamId && !isTeamOwner && (
            <div className="sp-section">
              <div className="sp-section-label">Team</div>
              <div className="sp-card">
                <div className="sp-card-title">Your Team</div>
                <div className="sp-card-desc">
                  {teamData?.ownerInfo?.displayName
                    ? <>You're a member of <strong>{teamData.ownerInfo.displayName}</strong>'s team, which gives you full Team access.</>
                    : <>You're a member of a team, which gives you full Team access.</>}
                </div>

                {!teamLoading && teamData && (
                  <div className="sp-team-list">
                    <div className="sp-team-member">
                      <div className="sp-team-avatar">
                        {(teamData.ownerInfo?.displayName?.[0] ?? teamData.ownerInfo?.email?.[0] ?? 'O').toUpperCase()}
                      </div>
                      <div className="sp-team-member-info">
                        <span className="sp-team-member-name">
                          {teamData.ownerInfo?.displayName || teamData.ownerInfo?.email || 'Team owner'}
                        </span>
                        <span className="sp-team-member-role">Owner</span>
                      </div>
                    </div>
                    <div className="sp-team-member">
                      <div className="sp-team-avatar sp-team-avatar--member">
                        {(currentUser?.displayName?.[0] ?? currentUser?.email?.[0] ?? 'Y').toUpperCase()}
                      </div>
                      <div className="sp-team-member-info">
                        <span className="sp-team-member-name">{currentUser?.displayName || currentUser?.email}</span>
                        <span className="sp-team-member-role">You</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="sp-team-invite">
                  <button
                    className="sp-btn-danger"
                    onClick={handleLeaveTeam}
                    disabled={leaving}
                  >
                    {leaving ? 'Leaving…' : 'Leave team'}
                  </button>
                </div>
              </div>
            </div>
          )}

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
