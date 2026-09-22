import titles from '../data/titles.json';
import auditoriums from '../data/auditoriums.json';

/**
 * Content API — static JSON fallback.
 * Replace with Supabase calls when backend is wired.
 */

export function fetchTitles(category = null) {
  if (!category || category === 'all') return Promise.resolve(titles);
  return Promise.resolve(titles.filter((t) => t.category === category));
}

export function fetchTitle(id) {
  const title = titles.find((t) => t.id === id);
  return title ? Promise.resolve(title) : Promise.reject(new Error('Title not found'));
}

export function fetchShowtimes(titleId) {
  const title = titles.find((t) => t.id === titleId);
  return Promise.resolve(title?.showtimes || []);
}

export function fetchAuditorium(id) {
  const aud = auditoriums[id];
  return aud ? Promise.resolve(aud) : Promise.reject(new Error('Auditorium not found'));
}
