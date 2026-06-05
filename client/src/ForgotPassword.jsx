import { useState, useRef } from 'react';
import HCaptcha from '@hcaptcha/react-hcaptcha';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [captchaToken, setCaptchaToken] = useState(null);
  const captchaRef = useRef(null);

  async function handleSubmit() {
    if (!captchaToken) {
      setMessage('Selesaikan CAPTCHA dulu.');
      return;
    }
    const res = await fetch('/api/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, captchaToken })
    });
    const data = await res.json();
    setMessage(data.message);
    captchaRef.current.resetCaptcha();
    setCaptchaToken(null);
  }

  return (
    <div style={{ margin: '40px', fontFamily: 'Arial' }}>
      <h2>Lupa Password</h2>
      <input placeholder="Email kamu" value={email}
        onChange={e => setEmail(e.target.value)} /><br /><br />
      <HCaptcha
        sitekey="97304a14-ac8e-473a-b1b2-f6aa751631f2"
        onVerify={token => setCaptchaToken(token)}
        onExpire={() => setCaptchaToken(null)}
        ref={captchaRef}
      />
      <br />
      <button onClick={handleSubmit}>Kirim Link Reset</button>
      {message && <p>{message}</p>}
    </div>
  );
}
