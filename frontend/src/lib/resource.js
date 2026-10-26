import { useCallback, useEffect, useState } from 'react';
import { get } from './api';
export function useResource(path, token, revision = 0, interval = 0) {
  const [version, setVersion] = useState(0);
  const key = JSON.stringify([path, token, revision, version]);
  const source = JSON.stringify([path, token]);
  const [state, setState] = useState({ data: null, error: '', key: null, source: null });
  const refresh = useCallback(() => setVersion(value => value + 1), []);
  useEffect(() => {
    const controller = new AbortController(); let timer;
    if (!path) return () => controller.abort();
    const load = async () => {
      try {
        const data = await get(path, token, controller.signal);
        if (!controller.signal.aborted) setState({ data, error: '', key, source });
      } catch (error) {
        if (!controller.signal.aborted) setState({ data: null, error: error.message, key, source });
      } finally { if (!controller.signal.aborted && interval) timer = setTimeout(load, interval); }
    };
    load();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [path, token, interval, key, source]);
  if (!path) return { data: null, error: '', loading: false, refresh };
  if (state.key !== key) return { data: state.source === source ? state.data : null, error: '', loading: state.source !== source || state.data == null, refreshing: true, refresh };
  return { ...state, loading: false, refresh };
}

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const change = event => setMatches(event.matches);
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, [query]);
  return matches;
}
