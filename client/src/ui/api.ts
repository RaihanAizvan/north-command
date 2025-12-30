const raw = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ?? '';
const normalized = raw ? raw.replace(/\/$/, '') : '';

// Allow users to provide domain without scheme (e.g. north-command.onrender.com)
function withScheme(url: string) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `https://${url}`;
}

export const API_BASE_URL = withScheme(normalized);

export function apiUrl(path: string) {
  if (!API_BASE_URL) return path;
  return `${API_BASE_URL}${path}`;
}
