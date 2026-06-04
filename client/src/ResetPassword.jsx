import { useState } from 'react';

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const token = new URLSearchParams(window.location.search).get('token');

  async function handleSubmit() {
    const res = await fetch('/api/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword })
    });
    const data = await res.json();
    setMessage(data.message);
  }

  return (
    <div style={{ margin: '40px', fontFamily: 'Arial' }}>
      <h2>Reset Password</h2>
      <input type="password" placeholder="Password baru" value={newPassword}
        onChange={e => setNewPassword(e.target.value)} /><br /><br />
      <button onClick={handleSubmit}>Reset Password</button>
      {message && <p>{message}</p>}
    </div>
  );
}
