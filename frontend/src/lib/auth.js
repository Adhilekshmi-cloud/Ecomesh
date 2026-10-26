import { createContext, createElement, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { apiLogin, apiRegister, get, post, segment } from './api';
const TOKEN_KEY = 'ecomesh_access_token';
const AuthContext = createContext(null);
const readToken = () => { try { return sessionStorage.getItem(TOKEN_KEY); } catch { return null; } };
const storeToken = token => { try { if (token) sessionStorage.setItem(TOKEN_KEY, token); else sessionStorage.removeItem(TOKEN_KEY); } catch { /* In-memory auth works with storage disabled. */ } };
export function AuthProvider({ children }) {
  const [token, setToken] = useState(readToken);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);
  const currentToken = useRef(token);
  const refreshProfile = useCallback(() => setVersion(n => n + 1), []);
  const signOut = useCallback(() => { storeToken(null); setToken(null); setUser(null); setProfile(null); setError(''); setLoading(false); }, []);
  useEffect(() => { currentToken.current = token; }, [token]);
  useEffect(() => {
    const expired = event => { if (event.detail === currentToken.current) signOut(); };
    window.addEventListener('ecomesh:expired', expired);
    return () => window.removeEventListener('ecomesh:expired', expired);
  }, [signOut]);
  useEffect(() => {
    const controller = new AbortController();
    if (!token) return () => controller.abort();
    (async () => {
      try {
        const me = await get('/auth/me', token, controller.signal);
        let student = null;
        if (me.student_id) student = await get(`/students/${segment(me.student_id)}/summary`, token, controller.signal);
        if (controller.signal.aborted) return;
        setUser(me); setProfile(student); setError('');
      } catch (err) {
        if (!controller.signal.aborted) { if (err.status === 401) signOut(); else setError(err.message); }
      } finally { if (!controller.signal.aborted) setLoading(false); }
    })();
    return () => controller.abort();
  }, [token, version, signOut]);
  useEffect(() => {
    if (!token || user?.role !== 'student') return;
    const id = setInterval(refreshProfile, 12000);
    return () => clearInterval(id);
  }, [token, user?.role, refreshProfile]);
  useEffect(() => {
    if (!token) return;
    const refresh = async () => {
      try {
        const result = await post('/auth/refresh', undefined, token);
        if (currentToken.current === token) { storeToken(result.access_token); setToken(result.access_token); }
      } catch { /* A valid token is retained through transient refresh failures. */ }
    };
    const id = setInterval(refresh, 30 * 60 * 1000);
    return () => clearInterval(id);
  }, [token]);
  const signIn = async (username, password) => { const result = await apiLogin(username, password); setLoading(true); storeToken(result.access_token); setToken(result.access_token); };
  const signUp = async body => { await apiRegister(body); await signIn(body.username, body.password); };
  const value = { user, profile, token, loading: loading && !!token, error, isAuthenticated: !!user, signIn, signUp, signOut, refreshProfile };
  return createElement(AuthContext.Provider, { value }, children);
}
export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error('useAuth requires AuthProvider'); return value; }
