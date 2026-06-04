import { useState } from 'react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  async function handleSubmit() {
    const res = await fetch('/api/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    setMessage(data.message);
  }

  return (
    <div style={{ margin: '40px', fontFamily: 'Arial' }}>
      <h2>Lupa Password</h2>
      <input placeholder="Email kamu" value={email}
        onChange={e => setEmail(e.target.value)} /><br /><br />
      <button onClick={handleSubmit}>Kirim Link Reset</button>
      {message && <p>{message}</p>}
    </div>
  );
}
