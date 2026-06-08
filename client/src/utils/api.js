const BASE = '/api';

export function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${sessionStorage.getItem('token')}`
  };
}

export async function apiFetch(path, options = {}) {
  const res = await fetch(BASE + path, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) }
  });
  if (res.status === 401) {
    sessionStorage.clear();
    // detect role dari path atau sessionStorage
    const path = window.location.pathname;
    if (path.startsWith('/dokter')) window.location.href = '/dokter/login';
    else if (path.startsWith('/pasien')) window.location.href = '/pasien/login';
    else window.location.href = '/admin/login';
    return;
  }
  return res.json();
}
