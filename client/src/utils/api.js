const BASE = '/api';

export function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${sessionStorage.getItem('token')}`
  };
}

// Simpan kedua token saat login
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

// Wrapper fetch dengan auto-refresh
export async function apiFetch(url, options = {}) {
  const makeRequest = (token) => fetch(url, {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${token}` }
  });

  let res = await makeRequest(getAccessToken());

  if (res.status === 401) {
    // Coba refresh
    const refreshRes = await fetch('/api/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: getRefreshToken() })
    });

    if (refreshRes.ok) {
      const data = await refreshRes.json();
      saveTokens(data.accessToken, data.refreshToken);
      res = await makeRequest(data.accessToken); // retry dengan token baru
    } else {
      clearTokens();
      window.location.href = '/login'; // force logout
    }
  }

  return res;
}
