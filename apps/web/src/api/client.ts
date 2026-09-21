function getApiUrl(path: string): string {
  const rawBase = import.meta.env.VITE_API_URL;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  if (!rawBase) {
    // In local dev, Vite proxies /api to http://localhost:3001
    return `/api${cleanPath}`;
  }

  // Trim trailing slash from env URL
  const trimmed = rawBase.replace(/\/+$/, '');
  // Ensure the path hits /api endpoint
  const base = trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
  return `${base}${cleanPath}`;
}

export async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const url = getApiUrl(path);
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': 'admin', // Placeholder until auth is integrated
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Request failed');
    let message = `HTTP ${response.status}`;
    try {
      const parsed = JSON.parse(errorText);
      if (parsed.message) message = parsed.message;
    } catch {
      if (errorText && errorText.length < 200) message = errorText;
    }
    throw new Error(message);
  }

  const text = await response.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Invalid JSON response: ${text.slice(0, 100)}`);
  }
}
