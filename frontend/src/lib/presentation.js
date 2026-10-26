export const ACTIONS = {
  plantation: { name: 'Tree plantation', short: 'Trees', color: '#3e674b', icon: 'Trees', max: 50 },
  waste_segregation: { name: 'Waste segregation', short: 'Waste', color: '#ad704a', icon: 'Recycle', max: 100 },
  sustainable_transport: { name: 'Sustainable transport', short: 'Transport', color: '#c49b43', icon: 'Bike', max: 100 },
  solar_adoption: { name: 'Solar adoption', short: 'Solar', color: '#b15c37', icon: 'Sun', max: 200 },
  water_conservation: { name: 'Water conservation', short: 'Water', color: '#5d838a', icon: 'Droplets', max: 5000 },
};
export const BADGES = { first_action: 'First Step', five_actions: 'Getting Going', twenty_actions: 'Committed', all_rounder: 'All-Rounder', streak_4_weeks: '4-Week Streak', carbon_10: '10 kg Saved', carbon_50: '50 kg Club', carbon_100: '100 kg Hero' };
export const number = value => value == null ? '—' : new Intl.NumberFormat('en-IN', { maximumFractionDigits: 3 }).format(value);
export const money = value => value == null ? '—' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
export function parseBackendDate(value) {
  // MongoDB returns naive ISO timestamps representing UTC. Do not interpret them as device-local time.
  const normalized = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(value) && !/(?:Z|[+-]\d{2}:?\d{2})$/i.test(value) ? `${value.replace(' ', 'T')}Z` : value;
  return new Date(normalized);
}
export function date(value, withTime = false) {
  if (!value) return '—'; const parsed = parseBackendDate(value); if (Number.isNaN(parsed.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}) }).format(parsed);
}
