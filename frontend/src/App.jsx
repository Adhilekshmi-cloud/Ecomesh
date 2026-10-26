import { Component, Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { Menu, ArrowUpRight, RefreshCw } from 'lucide-react';
import { AuthProvider, useAuth } from './lib/auth';
import { useResource } from './lib/resource';
import { useOfflineQueue } from './lib/offline';
import Sidebar from './components/Sidebar';
import { allowedTabs } from './lib/roles';
import AuthPage from './components/AuthPage';
import GuardianAttestation from './components/GuardianAttestation';
import { Brand, Button, Loading, Notice } from './components/ui';
const Dashboard = lazy(() => import('./components/Dashboard'));
const UploadAction = lazy(() => import('./components/UploadAction'));
const MyHistory = lazy(() => import('./components/MyHistory'));
const CampusRegistry = lazy(() => import('./components/CampusRegistry'));
const AdminReview = lazy(() => import('./components/AdminReview'));
const MissionsHub = lazy(() => import('./components/MissionsHub'));
const Leaderboard = lazy(() => import('./components/Leaderboard'));
const CommunityBenefits = lazy(() => import('./components/CommunityBenefits'));
const SchoolManagement = lazy(() => import('./components/SchoolManagement'));
const AccountSettings = lazy(() => import('./components/AccountSettings'));
const ImpactCalculator = lazy(() => import('./components/ImpactCalculator'));
const StudentCertificate = lazy(() => import('./components/StudentCertificate'));
const HowItWorks = lazy(() => import('./components/HowItWorks'));
class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <div className="boot-screen"><Brand /><h1>Something interrupted this view.</h1><p>Reload the workspace to try again. Saved offline submissions stay on this device.</p><Button onClick={() => window.location.reload()}>Reload workspace</Button></div> : this.props.children; }
}
function Workspace({ route }) {
  const { user, token, error: authError, refreshProfile } = useAuth();
  const [revision, setRevision] = useState(0); const [chosenSchool, setChosenSchool] = useState(''); const [navOpen, setNavOpen] = useState(false);
  const main = useRef(null);
  const [today] = useState(() => new Date());
  const schools = useResource('/schools?limit=500', token, revision);
  const health = useResource('/', undefined, 0, 30000);
  const schoolId = user.role === 'admin' ? chosenSchool || user.school_id || schools.data?.[0]?.school_id || '' : user.school_id;
  const schoolName = schools.data?.find(school => school.school_id === schoolId)?.name;
  const tab = allowedTabs(user.role).includes(route) ? route : 'dashboard';
  const onChanged = useCallback(() => { setRevision(value => value + 1); refreshProfile(); }, [refreshProfile]);
  const queue = useOfflineQueue(user, token, onChanged);
  const onNavigate = useCallback(target => { window.location.hash = `/${target}`; }, []);
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); main.current?.focus({ preventScroll: true }); }, [tab]);
  useEffect(() => { if (!navOpen) return; const close = event => { if (event.key === 'Escape') setNavOpen(false); }; window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close); }, [navOpen]);
  const shared = { schoolId, schoolName, revision, onChanged, onNavigate };
  const views = {
    dashboard: <Dashboard {...shared} />, upload: <UploadAction {...shared} offlineQueue={queue} />,
    history: <MyHistory {...shared} queue={queue} />, registry: <CampusRegistry {...shared} />,
    review: <AdminReview {...shared} />, missions: <MissionsHub {...shared} />,
    leaderboard: <Leaderboard {...shared} />, benefits: <CommunityBenefits {...shared} />,
    school: <SchoolManagement {...shared} schools={schools} />, account: <AccountSettings {...shared} />,
    calculator: <ImpactCalculator {...shared} />, certificate: <StudentCertificate {...shared} />, guide: <HowItWorks />,
  };
  return <div className="app-shell"><a className="skip-link" href="#workspace-content" onClick={event => { event.preventDefault(); main.current?.focus(); }}>Skip to content</a><Sidebar activeTab={tab} onNavigate={onNavigate} open={navOpen} onClose={() => setNavOpen(false)} schoolName={schoolName} /><div className="workspace"><header className="topbar"><div className="topbar-left"><button className="icon-button mobile-only" aria-label="Open navigation" aria-expanded={navOpen} onClick={() => setNavOpen(true)}><Menu size={21} /></button><span className="breadcrumb">Workspace <span>/</span> {tab === 'dashboard' ? 'Overview' : tab.replaceAll('-', ' ')}</span></div><div className="topbar-right">{user.role === 'admin' && <select aria-label="Select campus" value={schoolId} onChange={event => setChosenSchool(event.target.value)}><option value="" disabled>Select campus</option>{schools.data?.map(school => <option value={school.school_id} key={school.school_id}>{school.name}</option>)}</select>}<span className={`connection-status ${health.error ? 'offline' : ''}`}><i />{health.loading ? 'Connecting' : health.error ? 'API unreachable' : 'API connected'}</span><span className="topbar-date">{new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }).format(today)}</span></div></header><main id="workspace-content" tabIndex={-1} ref={main} className="page-container"><Notice>{authError}</Notice>{schools.error && <Notice>{schools.error}</Notice>}{queue.actions.length > 0 && tab !== 'history' && <div className="outbox-banner"><span>{queue.actions.length} action{queue.actions.length === 1 ? '' : 's'} saved on this device, awaiting receipt.</span><button className="text-button" onClick={() => onNavigate('history')}>Open outbox<ArrowUpRight size={14} /></button></div>}<Suspense fallback={<Loading label="Opening your workspace" />}><div className="page-enter" key={`${user.username}:${schoolId}:${tab}`}>{views[tab]}</div></Suspense><footer className="workspace-footer"><Brand /><span>SMALL ACTIONS. A SHARED FUTURE.</span><span>Made for the everyday changemaker.</span></footer></main></div></div>;
}
function Router() {
  const auth = useAuth(); const [hash, setHash] = useState(() => window.location.hash.slice(2));
  useEffect(() => { const change = () => setHash(window.location.hash.slice(2)); window.addEventListener('hashchange', change); return () => window.removeEventListener('hashchange', change); }, []);
  if (hash.startsWith('attest/')) { const attestToken = hash.slice(7); return <GuardianAttestation key={attestToken} attestToken={attestToken} />; }
  if (auth.loading && !auth.user) return <div className="boot-screen"><Brand /><Loading label="Opening EcoMesh" /></div>;
  if (!auth.user && auth.token && auth.error) return <div className="boot-screen"><Brand /><h1>Let’s reconnect.</h1><Notice>{auth.error}</Notice><Button onClick={auth.refreshProfile}><RefreshCw size={16} />Retry connection</Button><Button variant="text" onClick={auth.signOut}>Return to sign in</Button></div>;
  if (!auth.isAuthenticated) return <AuthPage />;
  if (!['student', 'teacher', 'admin'].includes(auth.user.role)) return <div className="boot-screen"><Notice>This account has a role that the backend does not support in this workspace.</Notice><Button onClick={auth.signOut}>Sign out</Button></div>;
  return <Workspace key={auth.user.username} route={hash} />;
}
export default function App() { return <ErrorBoundary><AuthProvider><Router /></AuthProvider></ErrorBoundary>; }
