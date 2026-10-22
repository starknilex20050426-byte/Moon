// Centralized API endpoint resolver supporting both same-origin and decoupled Firebase Hosting
const CLOUD_RUN_BACKEND = 'https://ais-pre-yflvpsdaczwb3ytw7tzr57-516651106530.asia-east1.run.app';

export function getApiUrl(path: string): string {
  const customUrl = import.meta.env.VITE_API_URL;
  if (customUrl) {
    return `${customUrl.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
  }

  if (typeof window !== 'undefined') {
    const storedUrl = localStorage.getItem('moon_backend_url');
    if (storedUrl && storedUrl.trim()) {
      const trimmed = storedUrl.trim();
      // Purge non-HTTP strings (e.g. Vercel project IDs prj_...)
      if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
        localStorage.removeItem('moon_backend_url');
      } else if (trimmed === window.location.origin || trimmed === window.location.origin.replace(/\/$/, '')) {
        // If pointing to current origin, use relative paths to avoid unnecessary CORS
        return path;
      } else {
        return `${trimmed.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
      }
    }
  }

  // When hosted on Firebase Hosting (*.web.app or *.firebaseapp.com) without a reverse proxy,
  // automatically forward API calls to the live backend server.
  if (
    typeof window !== 'undefined' &&
    (window.location.hostname.includes('web.app') ||
      window.location.hostname.includes('firebaseapp.com'))
  ) {
    return `${CLOUD_RUN_BACKEND}${path.startsWith('/') ? path : `/${path}`}`;
  }

  return path;
}

export function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const url = getApiUrl(input);
  return fetch(url, init);
}
