import { useEffect, useRef } from 'react';
import { useAuth } from '../lib/auth';
import { useMediaQuery } from '../lib/resource';
import { Brand } from './ui';
import { LayoutDashboard, Plus, Trophy, ShieldCheck, Sprout, History, Calculator, FileBadge, HeartHandshake, Settings2, School, BookOpen, LogOut, X, ListChecks } from 'lucide-react';
const links = [
  ['dashboard', 'Overview', LayoutDashboard, ['student', 'teacher', 'admin']],
  ['upload', 'Log an action', Plus, ['student', 'teacher', 'admin']],
  ['history', 'My action journal', History, ['student']],
  ['review', 'Review desk', ShieldCheck, ['teacher', 'admin']],
  ['registry', 'Campus registry', ListChecks, ['teacher', 'admin']],
  ['missions', 'Missions & badges', Sprout, ['student', 'teacher', 'admin']],
  ['leaderboard', 'Campus standings', Trophy, ['student', 'teacher', 'admin']],
  ['benefits', 'Community investment', HeartHandshake, ['teacher', 'admin']],
  ['calculator', 'Impact explorer', Calculator, ['student', 'teacher', 'admin']],
  ['certificate', 'My impact statement', FileBadge, ['student']],
  ['school', 'School management', School, ['teacher', 'admin']],
  ['guide', 'How it works', BookOpen, ['student', 'teacher', 'admin']],
  ['account', 'Account & privacy', Settings2, ['student', 'teacher', 'admin']],
];
export default function Sidebar({ activeTab, onNavigate, open, onClose, schoolName }) {
  const { user, profile, signOut } = useAuth();
  const mobile = useMediaQuery('(max-width: 760px)');
  const navigation = useRef(null);
  useEffect(() => {
    if (!mobile || !open) return;
    const node = navigation.current;
    const previous = document.activeElement;
    const controls = () => [...node.querySelectorAll('button:not(:disabled), a[href]')];
    controls()[0]?.focus();
    const trap = event => {
      if (event.key !== 'Tab') return;
      const items = controls();
      const first = items[0], last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    node.addEventListener('keydown', trap);
    return () => { node.removeEventListener('keydown', trap); previous?.focus(); };
  }, [mobile, open]);
  return <><button className={`nav-scrim ${open ? 'visible' : ''}`} aria-label="Close navigation" onClick={onClose} tabIndex={open ? 0 : -1} /><aside ref={navigation} inert={mobile && !open} role={mobile && open ? 'dialog' : undefined} aria-modal={mobile && open ? true : undefined} aria-label="Workspace navigation" className={`sidebar ${open ? 'is-open' : ''}`}>
    <div className="sidebar-brand"><Brand /><button className="icon-button mobile-only" aria-label="Close navigation" onClick={onClose}><X size={21} /></button></div>
    <div className="workspace-label"><span className="workspace-symbol"><School size={18} /></span><div><strong>{schoolName || user.school_id || 'All campuses'}</strong><small>{user.role} workspace</small></div></div>
    <p className="nav-label">YOUR WORKSPACE</p>
    <nav aria-label="Main navigation">{links.filter(item => item[3].includes(user.role)).map(([id, label, Icon]) => <a href={`#/${id}`} key={id} className={`nav-link ${activeTab === id ? 'active' : ''}`} aria-current={activeTab === id ? 'page' : undefined} onClick={event => { event.preventDefault(); onNavigate(id); onClose(); }}><Icon size={18} strokeWidth={1.6} /><span>{label}</span>{activeTab === id && <i />}</a>)}</nav>
    <div className="sidebar-bottom"><div className="sidebar-note"><Sprout size={22} strokeWidth={1.2} /><p>Small actions.<br /><em>Lasting change.</em></p></div><div className="user-chip"><span className="avatar">{(profile?.name || user.username).slice(0, 1).toUpperCase()}</span><div><strong>{profile?.name || user.username}</strong><small>{profile?.level || user.role}</small></div><button className="icon-button" onClick={signOut} aria-label="Sign out"><LogOut size={17} /></button></div></div>
  </aside></>;
}
