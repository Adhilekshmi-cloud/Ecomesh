import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Camera, MapPin, Check, Upload, WifiOff } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { apiSubmitAction } from '../lib/api';
import { queueAction, removeQueuedAction } from '../lib/offline';
import { useResource } from '../lib/resource';
import { ACTIONS, number } from '../lib/presentation';
import { ActionIcon, Button, Field, Notice, PageHeader, Panel, ResourceState } from './ui';
export default function UploadAction({ schoolId, onChanged, onNavigate, offlineQueue }) {
  const { user, token } = useAuth(); const student = user.role === 'student';
  const factors = useResource('/impact/factors', token);
  const [action, setAction] = useState('plantation'); const [quantity, setQuantity] = useState(''); const [context, setContext] = useState('school');
  const [location, setLocation] = useState(null); const [locating, setLocating] = useState(false); const [locationError, setLocationError] = useState('');
  const [file, setFile] = useState(null); const [preview, setPreview] = useState(''); const [previewError, setPreviewError] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [result, setResult] = useState(null);
  const clientId = useRef(crypto.randomUUID());
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  const locate = () => {
    setLocationError(''); setLocating(true);
    if (!navigator.geolocation) { setLocationError('This browser does not support location capture. Use a browser with location access.'); setLocating(false); return; }
    navigator.geolocation.getCurrentPosition(position => { setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy }); setLocating(false); }, err => { setLocation(null); setLocationError(err.code === 1 ? 'Location permission was denied. Allow location access in your browser and try again.' : 'Could not capture a location. Move to a place with a clear signal and retry.'); setLocating(false); }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  };
  const submit = async event => {
    event.preventDefault(); setError('');
    const values = Object.fromEntries(new FormData(event.currentTarget));
    if (!schoolId) { setError('Choose a registered school before submitting.'); return; }
    if (!file || !location) { setError('Add a photo and capture your actual location.'); return; }
    const captured = new Date(values.captured_at);
    const age = Date.now() - captured.getTime();
    if (!Number.isFinite(age) || age < -5 * 60000 || age > 7 * 86400000) { setError('Use the actual photo time, within the last seven days and no more than five minutes in the future.'); return; }
    const amount = Number(quantity);
    if (!Number.isFinite(amount) || amount <= 0 || amount > ACTIONS[action].max) { setError(`Quantity must be greater than zero and at most ${ACTIONS[action].max}.`); return; }
    setBusy(true);
    const fields = { student_id: student ? user.student_id : values.student_id.trim(), school_id: student ? user.school_id : schoolId, action_type: action, context, latitude: location.latitude, longitude: location.longitude, quantity: amount, captured_at: captured.toISOString(), client_id: clientId.current };
    const queued = { client_id: clientId.current, student_id: user.student_id, fields, file, queued_at: new Date().toISOString() };
    let stored = false;
    try {
      if (student) {
        try { await queueAction(queued); stored = true; }
        catch (storageError) { if (!navigator.onLine) throw storageError; }
      }
      if (!navigator.onLine) {
        if (!student) throw new Error('Staff submissions need an internet connection.');
        setResult({ queued: true });
      } else {
        try {
          const response = await apiSubmitAction({ file, fields, token });
          if (stored) await removeQueuedAction(clientId.current);
          setResult(response); onChanged();
        } catch (err) {
          if (stored && (err.status === 0 || err.status === 401 || err.status >= 500)) { await queueAction({ ...queued, error: err.message }); setResult({ queued: true }); }
          else { if (stored) await removeQueuedAction(clientId.current); throw err; }
        }
      }
      await offlineQueue.refresh();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  if (result) return <><PageHeader eyebrow="ACTION JOURNAL" title={result.queued ? 'Saved here. Ready to sync.' : 'Your action is on its way.'} /><section className="panel submission-result"><span className="result-symbol">{result.queued ? <WifiOff size={30} /> : <Check size={30} />}</span><h2>{result.queued ? 'A small action, safely queued.' : result.duplicate ? 'This action was already received.' : 'Received for verification.'}</h2><p>{result.queued ? 'The photo and details are saved on this device. Reconnect to sync from your journal. Keep this browser’s storage until receipt is confirmed.' : 'Verification, impact, and points come from the server. Follow the result in your action journal.'}</p>{result.id && <p className="mono small">Receipt · {result.id}</p>}<Button onClick={() => onNavigate(student ? 'history' : 'registry')}>View action journal<ArrowRight size={17} /></Button></section></>;
  return <><PageHeader eyebrow="YOUR NEXT SMALL ACTION" title="Make it count." description="Capture the evidence. Add the details. Watch your impact take root." />
    <form className="upload-layout" onSubmit={submit}><div className="upload-main"><Panel label="01 / THE ACTION" title="What changed today?"><ResourceState resource={factors}>{data => <div className="action-options">{Object.keys(ACTIONS).filter(key => data[key]).map(key => <button type="button" key={key} aria-pressed={key === action} className={`action-option ${key === action ? 'selected' : ''}`} onClick={() => { setAction(key); setQuantity(''); }}><ActionIcon type={key} size={24} /><span>{ACTIONS[key].name}</span><small>{data[key].unit}</small>{key === action && <Check size={14} />}</button>)}</div>}</ResourceState><div className="form-grid"><Field label={`Quantity${factors.data?.[action] ? ` · ${factors.data[action].unit}` : ''}`} hint={`Maximum ${ACTIONS[action].max} per submission`}><input type="number" name="quantity" inputMode="decimal" min="0.001" step="any" max={ACTIONS[action].max} value={quantity} onChange={event => setQuantity(event.target.value)} required /></Field><Field label="Where did it happen?"><select value={context} onChange={event => setContext(event.target.value)}><option value="school">At school</option><option value="home">At home</option></select></Field></div>{!student && <Field label="Student ID" hint="Enter the registered student this action belongs to."><input name="student_id" required /></Field>}{context === 'home' && <Notice type="info">Home actions that pass verification need a guardian’s confirmation before impact and points are credited.</Notice>}</Panel>
    <Panel label="02 / THE EVIDENCE" title="Show the action."><label className={`photo-drop ${file ? 'has-photo' : ''}`}><input type="file" name="photo" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif" capture="environment" required onChange={event => { const next = event.target.files?.[0] || null; setFile(next); setPreview(next ? URL.createObjectURL(next) : ''); setPreviewError(false); }} />{preview && !previewError ? <img src={preview} alt="Your selected evidence" onError={() => setPreviewError(true)} /> : <><Camera size={36} strokeWidth={1} /><strong>{file ? file.name : 'Take a photo or choose your evidence'}</strong><span>{file ? 'Preview unavailable for this format. The backend will validate the image.' : 'JPEG, PNG, WebP, HEIC or HEIF'}</span></>}<span className="photo-drop-cta"><Upload size={16} />{file ? 'Change photo' : 'Choose a photo'}</span></label><Field label="When was the photo taken?" hint="Enter the actual capture time. Photos older than 24 hours may need additional review; the upload limit is seven days."><input type="datetime-local" name="captured_at" required /></Field><div className="location-capture"><MapPin size={21} /><div><strong>{location ? 'Location captured' : 'Capture your real location'}</strong><small>{location ? `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)} · ±${Math.round(location.accuracy)} m` : 'Location is used for the school-radius check.'}</small></div><Button type="button" variant="secondary" busy={locating} onClick={locate}>{location ? 'Recapture' : 'Use my location'}</Button></div><Notice>{locationError}</Notice></Panel></div>
    <aside className="upload-aside"><Panel label="BEFORE YOU SEND" title="Evidence first. Impact follows."><div className="estimate-block"><span className="muted small">Estimated impact, before verification</span><strong>{quantity && factors.data?.[action] ? number(Number(quantity) * factors.data[action].factor) : '—'}<small>kg CO₂e</small></strong></div>{factors.data?.[action] && <p className="small muted">{factors.data[action].basis}</p>}<ol className="process-list"><li>Photo, timestamp, and location checks</li><li>Image assessment and any required review</li><li>Server-calculated impact and rewards</li></ol><Notice>{error}</Notice><Button type="submit" busy={busy} disabled={!file || !location || !schoolId || !factors.data}>Submit for verification<ArrowRight size={16} /></Button><p className="small muted">{student ? 'If the connection fails, your action stays in this browser’s offline queue.' : 'Staff submissions are sent directly to the selected campus.'}</p></Panel></aside></form></>;
}
