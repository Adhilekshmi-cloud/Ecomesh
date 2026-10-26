import { useState } from 'react';
import { ArrowRight, ArrowUpRight, Eye, EyeOff, Leaf } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { post } from '../lib/api';
import { useResource } from '../lib/resource';
import { Brand, Button, Field, Notice, ResourceState } from './ui';
export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState('login'); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [success, setSuccess] = useState(''); const [showPassword, setShowPassword] = useState(false);
  const schools = useResource(mode === 'signup' ? '/schools?limit=500' : null);
  const submit = async event => {
    event.preventDefault(); const values = Object.fromEntries(new FormData(event.currentTarget)); setBusy(true); setError(''); setSuccess('');
    try {
      if (mode === 'login') await signIn(values.username, values.password);
      else if (mode === 'signup') await signUp({ ...values, username: values.username.trim(), name: values.name.trim(), class_name: values.class_name.trim(), house: values.house.trim() });
      else { await post('/auth/bootstrap-admin', values); setMode('login'); setSuccess('First administrator created. Sign in with your new credentials.'); }
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  return <div className="auth-layout">
    <section className="auth-story"><div className="auth-story-top"><Brand /><span className="edition">A BETTER EVERYDAY</span></div><div className="auth-editorial"><p className="eyebrow light">THE FUTURE IS A COLLECTIVE EFFORT</p><h1>A little action.<br />A <em>living</em><br />difference.</h1><p>Turn everyday climate habits into a growing record of change. For you. For your campus. For what comes next.</p></div><div className="botanical" aria-hidden="true"><div className="botanical-orbit orbit-one" /><div className="botanical-orbit orbit-two" /><div className="botanical-stem" />{Array.from({ length: 7 }, (_, i) => <i key={i} className={`botanical-leaf leaf-${i}`} />)}<span className="botanical-caption">GROWTH STARTS WITH ONE SMALL THING</span></div><div className="auth-story-footer"><span><Leaf size={15} />Built around real-world action</span><span>EcoMesh <ArrowUpRight size={15} /></span></div></section>
    <section className="auth-form-side"><div className="auth-mobile-brand"><Brand /></div><div className="auth-form-wrap"><span className="section-number">01 / YOUR NEXT CHAPTER</span><h2>{mode === 'login' ? 'Welcome back.' : mode === 'signup' ? 'Start something good.' : 'The first step.'}</h2><p className="muted">{mode === 'login' ? 'Your next small action starts here.' : mode === 'signup' ? 'Create your student account and join your campus.' : 'Set up the first administrator. Available only before an admin exists.'}</p>
      {mode !== 'bootstrap' && <div className="segmented"><button type="button" className={mode === 'login' ? 'selected' : ''} onClick={() => { setMode('login'); setError(''); }}>Sign in</button><button type="button" className={mode === 'signup' ? 'selected' : ''} onClick={() => { setMode('signup'); setError(''); }}>Join your campus</button></div>}
      <form onSubmit={submit} className="auth-form" key={mode}><fieldset disabled={busy}>
        {mode === 'signup' && <Field label="Full name"><input name="name" autoComplete="name" required maxLength={100} /></Field>}
        <Field label="Username" hint={mode === 'signup' ? 'Use 3–60 characters. Usernames are case-sensitive.' : undefined}><input name="username" autoComplete="username" required minLength={mode === 'login' ? undefined : 3} maxLength={60} /></Field>
        <Field label="Password"><span className="password-field"><input name="password" type={showPassword ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={mode === 'login' ? undefined : 6} maxLength={64} required /><button type="button" className="icon-button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(value => !value)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></span></Field>
        {mode === 'signup' && <><ResourceState resource={schools}>{rows => <Field label="Your school"><select name="school_id" required defaultValue=""><option value="" disabled>Select your campus</option>{rows.map(school => <option value={school.school_id} key={school.school_id}>{school.name} · {school.school_id}</option>)}</select>{rows.length === 0 && <small>No schools are registered yet. Ask your school administrator to add one.</small>}</Field>}</ResourceState><div className="form-grid"><Field label="Class"><input name="class_name" required maxLength={80} /></Field><Field label="House (optional)"><input name="house" maxLength={80} /></Field></div></>}
      </fieldset><Notice>{error}</Notice><Notice type="success">{success}</Notice><Button type="submit" busy={busy} disabled={mode === 'signup' && (!schools.data?.length || !!schools.error)}>{mode === 'login' ? 'Enter your workspace' : mode === 'signup' ? 'Create student account' : 'Create administrator'}<ArrowRight size={18} /></Button></form>
      <p className="auth-footnote">Students can join here. Teacher and administrator accounts are managed by your school.</p><button className="text-button auth-setup" type="button" onClick={() => { setMode(mode === 'bootstrap' ? 'login' : 'bootstrap'); setError(''); }}>{mode === 'bootstrap' ? 'Back to sign in' : 'Setting up EcoMesh for the first time?'}<ArrowUpRight size={13} /></button>
    </div><footer className="auth-bottom">EVERY ACTION HAS A RIPPLE.</footer></section>
  </div>;
}
