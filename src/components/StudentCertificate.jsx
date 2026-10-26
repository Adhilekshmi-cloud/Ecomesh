import { useState } from 'react';
import { Printer, Leaf } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useResource } from '../lib/resource';
import { segment } from '../lib/api';
import { date, number } from '../lib/presentation';
import { Brand, Button, PageHeader, ResourceState } from './ui';
export default function StudentCertificate({ schoolName, revision }) {
  const [generatedAt] = useState(() => new Date());
  const { user, token } = useAuth(); const resource = useResource(`/students/${segment(user.student_id)}/summary`, token, revision);
  return <><PageHeader eyebrow="YOUR RECORD OF CONTRIBUTION" title="A statement of action." description="A printable view of your recorded EcoMesh contribution."><Button variant="secondary" disabled={!resource.data} onClick={() => window.print()}><Printer size={16} />Print statement</Button></PageHeader><ResourceState resource={resource}>{profile => <article className="impact-statement"><div className="statement-top"><Brand /><span>PERSONAL IMPACT RECORD</span></div><div className="statement-emblem"><Leaf size={45} strokeWidth={1} /></div><p className="eyebrow">EVERYDAY ACTION. LASTING INTENT.</p><h2>Climate action<br /><em>starts with you.</em></h2><p className="statement-name">{profile.name || user.username}</p><p>{schoolName || profile.school_id} · {profile.class_name || 'Class not recorded'}</p><div className="statement-metrics"><div><strong>{number(profile.total_kg_co2e)}</strong><span>kg CO₂e estimated impact</span></div><div><strong>{number(profile.total_actions)}</strong><span>verified actions</span></div><div><strong>{number(profile.points)}</strong><span>EcoPoints</span></div></div><p className="statement-description">This statement reflects the student profile returned by EcoMesh on {date(generatedAt)}. Carbon impact is estimated from verified activities using the backend’s recorded emission factors.</p><div className="statement-bottom"><span>{profile.level} · {number(profile.streak_weeks)} week streak</span><span>Student ID · {profile.student_id}</span></div><p className="small muted">A personal activity statement. It is not an accredited certificate or certified carbon credit.</p></article>}</ResourceState></>;
}
