// Centralized API endpoint resolver supporting both same-origin, custom backend URLs, and Firebase Hosting
const DEFAULT_CLOUD_RUN_BACKEND = 'https://ais-pre-yflvpsdaczwb3ytw7tzr57-516651106530.asia-east1.run.app';

export function getBackendBaseUrl(): string {
  // 1. Check user-configured backend URL stored in localStorage (set via Admin Portal)
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('moon_backend_url');
      if (stored && stored.trim()) {
        return stored.trim().replace(/\/$/, '');
      }
    } catch {
      // ignore localStorage errors
    }
  }

  // 2. Check environment variable VITE_API_URL
  const customUrl = import.meta.env.VITE_API_URL;
  if (customUrl && typeof customUrl === 'string' && customUrl.trim()) {
    return customUrl.trim().replace(/\/$/, '');
  }

  // 3. When hosted on Firebase Hosting (*.web.app or *.firebaseapp.com)
  if (
    typeof window !== 'undefined' &&
    (window.location.hostname.includes('web.app') ||
      window.location.hostname.includes('firebaseapp.com'))
  ) {
    return DEFAULT_CLOUD_RUN_BACKEND;
  }

  // 4. Same origin (localhost or full-stack production server)
  return '';
}

export function getApiUrl(path: string): string {
  const base = getBackendBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (!base) {
    return normalizedPath;
  }
  return `${base}${normalizedPath}`;
}

export function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const url = getApiUrl(input);
  return fetch(url, init);
}

