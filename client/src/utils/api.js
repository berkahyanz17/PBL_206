const BASE = '/api';

export function saveTokens(accessToken, refreshToken) {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
}
export function getAccessToken()  { return localStorage.getItem('accessToken'); }
export function getRefreshToken() { return localStorage.getItem('refreshToken'); }
export function clearTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

export async function apiFetch(url, options = {}) {
  const makeRequest = (token) => fetch(`${BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  let res = await makeRequest(getAccessToken());

  if (res.status === 401) {
    const refreshRes = await fetch('/api/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: getRefreshToken() })
    });
    if (refreshRes.ok) {
      const data = await refreshRes.json();
      saveTokens(data.accessToken, data.refreshToken);
      res = await makeRequest(data.accessToken);
    } else {
      clearTokens();
      window.location.href = '/';
    }
  }

  return res.json();
}
