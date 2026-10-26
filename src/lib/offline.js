import { useCallback, useEffect, useRef, useState } from 'react';
import { apiSubmitAction, post } from './api';
const DB = 'ecomesh-offline-v1';
function openDB() {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) { reject(new Error('Offline storage is unavailable in this browser.')); return; }
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore('actions', { keyPath: 'client_id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Could not open offline storage.'));
  });
}
async function transaction(mode, operation) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('actions', mode); const request = operation(tx.objectStore('actions')); let result;
    request.onsuccess = () => { result = request.result; };
    tx.oncomplete = () => { db.close(); resolve(result); };
    tx.onabort = tx.onerror = () => { db.close(); reject(new Error('Could not save the offline action. Check browser storage space.')); };
  });
}
export const queueAction = action => transaction('readwrite', store => store.put(action));
export const removeQueuedAction = id => transaction('readwrite', store => store.delete(id));
export async function queuedActions(studentId) {
  const all = await transaction('readonly', store => store.getAll());
  return all.filter(action => action.student_id === studentId).sort((a, b) => a.queued_at.localeCompare(b.queued_at));
}
export function useOfflineQueue(user, token, onChanged) {
  const [actions, setActions] = useState([]); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const syncLock = useRef(false);
  const studentId = user?.role === 'student' ? user.student_id : null;
  const refresh = useCallback(async () => {
    if (!studentId) { setActions([]); return; }
    try { setActions(await queuedActions(studentId)); } catch (err) { setError(err.message); }
  }, [studentId]);
  useEffect(() => {
    if (!studentId) return;
    let active = true;
    queuedActions(studentId)
      .then(rows => { if (active) setActions(rows); })
      .catch(err => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [studentId]);
  const sync = useCallback(async () => {
    if (!studentId || !token || !navigator.onLine || syncLock.current) return;
    syncLock.current = true;
    setBusy(true); setError('');
    let changed = false;
    try {
      const pending = await queuedActions(studentId);
      for (let start = 0; start < pending.length; start += 200) {
        const batch = pending.slice(start, start + 200);
        const statuses = await post('/my/sync-status', { client_ids: batch.map(item => item.client_id) }, token);
        for (const item of batch) {
          try {
            if (statuses[item.client_id]?.status === 'not_received') await apiSubmitAction({ file: item.file, fields: item.fields, token });
            else if (!statuses[item.client_id]?.id) throw new Error('Could not confirm receipt. Retry syncing.');
            await removeQueuedAction(item.client_id); changed = true;
          } catch (err) {
            await queueAction({ ...item, error: err.message });
            if (err.status === 0 || err.status === 401 || err.status === 403) throw err;
          }
        }
      }
    } catch (err) { setError(err.message); }
    finally { syncLock.current = false; setBusy(false); await refresh(); if (changed) onChanged(); }
  }, [studentId, token, refresh, onChanged]);
  useEffect(() => { const online = () => sync(); window.addEventListener('online', online); return () => window.removeEventListener('online', online); }, [sync]);
  return { actions, error, busy, refresh, sync, discard: async id => { await removeQueuedAction(id); await refresh(); } };
}
