import { useState, useRef } from 'react';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';

export default function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [captchaToken, setCaptchaToken] = useState(null);
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

  async function handleLogin() {
    if (!captchaToken) {
      setMessage('Selesaikan CAPTCHA dulu.');
      return;
    }

    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, captchaToken })
    });
    const data = await res.json();
    setMessage(data.message);
    captchaRef.current.resetCaptcha();
    setCaptchaToken(null);
  }
  
  return (
    <div style={{ margin: '40px', fontFamily: 'Arial' }}>
      <h2>Login</h2>
      <input placeholder="Username" value={username}
        onChange={e => setUsername(e.target.value)} /><br /><br />
      <input type="password" placeholder="Password" value={password}
        onChange={e => setPassword(e.target.value)} /><br /><br />
      <HCaptcha
        sitekey="97304a14-ac8e-473a-b1b2-f6aa751631f2"
        onVerify={token => setCaptchaToken(token)}
        onExpire={() => setCaptchaToken(null)}
        ref={captchaRef}
      />
      <br />
      <button onClick={handleLogin}>Login</button>
      {message && <p>{message}</p>}
      <p><a href="/forgot-password">Lupa password?</a></p>
    </div>
  );
}
