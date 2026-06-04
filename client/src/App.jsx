import { useState } from 'react';

import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';

export default function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  async function handleLogin() {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    setMessage(data.message);
  }
  
  // Di dalam komponen App(), sebelum return, tambahkan:
  const path = window.location.pathname;
  if (path === '/forgot-password') return <ForgotPassword />;
  if (path === '/reset-password') return <ResetPassword />;
  
  return (
    <div style={{ margin: '40px', fontFamily: 'Arial' }}>
      <h2>Login</h2>
      <input placeholder="Username" value={username}
        onChange={e => setUsername(e.target.value)} /><br /><br />
      <input type="password" placeholder="Password" value={password}
        onChange={e => setPassword(e.target.value)} /><br /><br />
      
      // Tambah link di bawah tombol Login:
      <p><a href="/forgot-password">Lupa password?</a></p>
      
      <button onClick={handleLogin}>Login</button>
      {message && <p>{message}</p>}
    </div>
  );
}
