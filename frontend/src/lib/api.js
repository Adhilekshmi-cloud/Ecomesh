const configuredBase = import.meta.env.VITE_API_URL?.trim();
export const API_BASE_URL = (configuredBase || (import.meta.env.DEV ? 'http://localhost:8000' : '')).replace(/\/+$/, '');
export class ApiError extends Error {
  constructor(message, status) { super(message); this.name = 'ApiError'; this.status = status; }
}
export async function apiRequest(path, { token, responseType = 'json', timeoutMs = 30000, ...options } = {}) {
  if (!API_BASE_URL) throw new ApiError('Configure VITE_API_URL for this deployment.', 0);
  const headers = new Headers(options.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (options.body != null && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  const controller = new AbortController();
  const cancel = () => controller.abort();
  let timedOut = false;
  const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
  options.signal?.addEventListener('abort', cancel, { once: true });
  if (options.signal?.aborted) controller.abort();
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers, signal: controller.signal });
    if (!response.ok) {
      const payload = await response.text();
      let message = `Request failed (${response.status})`;
      try {
        const { detail } = JSON.parse(payload);
        if (typeof detail === 'string') message = detail;
        else if (Array.isArray(detail)) message = detail.map(item => `${item.loc?.slice(1).join('.') || 'Request'}: ${item.msg}`).join('; ');
      } catch { /* Avoid displaying server HTML. */ }
      if (response.status === 401 && token && path !== '/auth/change-password' && path !== '/my/delete-account') window.dispatchEvent(new CustomEvent('ecomesh:expired', { detail: token }));
      throw new ApiError(message, response.status);
    }
    if (response.status === 204) return null;
    return responseType === 'blob' ? await response.blob() : await response.json();
  } catch (error) {
    if (error instanceof ApiError || options.signal?.aborted) throw error;
    if (timedOut) throw new ApiError('EcoMesh took too long to respond. Retry the request; saved actions remain in your outbox.', 0);
    if (error instanceof SyntaxError) throw new ApiError('The API returned an unreadable response. Please retry.', 502);
    throw new ApiError('Could not reach EcoMesh. Check your connection and API address, then retry.', 0);
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener('abort', cancel);
  }
}
export const segment = value => encodeURIComponent(value);
export function query(values = {}) {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => { if (value !== undefined && value !== null && value !== '') params.set(key, String(value)); });
  return params.size ? `?${params}` : '';
}
export const get = (path, token, signal) => apiRequest(path, { token, signal });
export const post = (path, body, token) => apiRequest(path, { method: 'POST', token, timeoutMs: path.startsWith('/pipeline/') ? 120000 : 30000, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
export const apiLogin = (username, password) => post('/auth/login', { username: username.trim(), password });
export const apiRegister = body => post('/auth/signup', body);
export const apiMe = token => get('/auth/me', token);
export function apiSubmitAction({ file, fields, token }) {
  const body = new FormData(); body.append('photo', file);
  Object.entries(fields).forEach(([key, value]) => { if (value != null) body.append(key, String(value)); });
  return apiRequest('/submissions', { method: 'POST', token, body, timeoutMs: 60000 });
}
export const apiReviewSubmission = (id, decision, reviewer, token, note = '') => post(`/review/${segment(id)}`, { decision, reviewer, note }, token);
export const apiMyMissions = token => get('/my/missions', token);
export const apiClaimMission = (id, token) => post(`/my/missions/${segment(id)}/claim`, undefined, token);
export function photoUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function downloadReport(schoolId, token) {
  const blob = await apiRequest(`/reports/school/${segment(schoolId)}`, { token, responseType: 'blob' });
  downloadBlob(blob, `ecomesh_${schoolId}_report.csv`);
}
