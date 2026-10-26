import { useState } from 'react';
import { ArrowRight, AlertCircle, RefreshCw, Leaf, Trees, Recycle, Bike, Sun, Droplets, Inbox, Check } from 'lucide-react';
import { ACTIONS } from '../lib/presentation';
const icons = { Trees, Recycle, Bike, Sun, Droplets };
export function ActionIcon({ type, size = 20 }) { const Icon = icons[ACTIONS[type]?.icon] || Leaf; return <Icon size={size} strokeWidth={1.6} />; }
export function Brand() { return <span className="brand"><span className="brand-mark"><Leaf size={23} strokeWidth={1.5} /></span>eco<span className="brand-light">mesh</span><span className="brand-dot">.</span></span>; }
export function PageHeader({ eyebrow, title, description, children }) { return <header className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{description && <p className="page-description">{description}</p>}</div>{children && <div className="header-actions">{children}</div>}</header>; }
export function Button({ children, variant = 'primary', busy, className = '', ...props }) { return <button className={`button ${variant} ${className}`} {...props} disabled={props.disabled || busy}>{busy && <RefreshCw size={15} className="spin" />}{children}</button>; }
export function Notice({ children, type = 'error' }) { return children ? <div className={`notice ${type}`} role={type === 'error' ? 'alert' : 'status'}>{type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}<span>{children}</span></div> : null; }
export function Empty({ title = 'Nothing here yet', children, action }) { return <div className="empty"><Inbox size={30} strokeWidth={1} /><h3>{title}</h3>{children && <p>{children}</p>}{action}</div>; }
export function Loading({ label = 'Loading live data' }) { return <div className="loading" role="status"><span className="loading-dot" />{label}<div className="skeleton-lines"><i /><i /><i /></div></div>; }
export function ResourceState({ resource, children, empty }) {
  if (resource.loading) return <Loading />;
  if (resource.error) return <div className="resource-error"><Notice>{resource.error}</Notice><Button variant="secondary" onClick={resource.refresh}><RefreshCw size={15} />Retry</Button></div>;
  if (resource.data == null) return empty || <Empty title="Choose a school to continue" />;
  return children(resource.data);
}
export function Status({ value }) { const names = { pending: 'Verifying', needs_review: 'Needs review', awaiting_guardian: 'Guardian needed', verified: 'Verified', rejected: 'Rejected', proposed: 'Proposed', approved: 'Approved', superseded: 'Superseded', open: 'Open', funded: 'Funded' }; return <span className={`status ${value}`}><i />{names[value] || value}</span>; }
export function Progress({ value = 0, label }) { return <div className="progress" role="progressbar" aria-valuenow={Math.max(0, Math.min(100, value))} aria-valuemin={0} aria-valuemax={100} aria-label={label || 'Progress'}><span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>; }
export function Panel({ title, label, children, action, className = '' }) { return <section className={`panel ${className}`}><div className="panel-heading"><div>{label && <p className="eyebrow">{label}</p>}<h2>{title}</h2></div>{action}</div>{children}</section>; }
export function Field({ label, hint, children }) { return <label className="field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>; }
export function FormCard({ title, description, submitLabel = 'Save changes', onSubmit, children, destructive = false, onSuccess }) {
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [success, setSuccess] = useState('');
  return <form className="panel form-card" onSubmit={async event => {
    event.preventDefault(); const form = event.currentTarget; const data = Object.fromEntries(new FormData(form));
    setBusy(true); setError(''); setSuccess('');
    try { const result = await onSubmit(data); setSuccess(typeof result === 'string' ? result : 'Changes saved.'); form.reset(); onSuccess?.(); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }}><div><h2>{title}</h2>{description && <p className="muted">{description}</p>}</div><fieldset disabled={busy}>{children}</fieldset><Notice>{error}</Notice><Notice type="success">{success}</Notice><Button busy={busy} variant={destructive ? 'danger' : 'primary'} type="submit">{submitLabel}<ArrowRight size={16} /></Button></form>;
}
