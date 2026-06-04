const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const nodemailer = require('nodemailer');
const crypto = require('crypto');

const transporter = nodemailer.createTransport({
  host: 'smtp.resend.com',
  port: 465,
  secure: true,
  auth: {
    user: 'resend',
    pass: process.env.MAIL_PASS
  }
});

let db;
async function connectDB() {
  while (true) {
    try {
      db = await mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
      });
      console.log('DB connected'); break;
    } catch (err) {
      console.log('DB not ready, retrying in 3s...');
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

app.get('/api/users', async (req, res) => {
  const [rows] = await db.query('SELECT id, username FROM users');
  res.json(rows);
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const [rows] = await db.query(
    'SELECT * FROM users WHERE username = ? AND password = ?',
    [username, password]
  );
  if (rows.length > 0) {
    res.json({ success: true, message: 'Login sukses' });
  } else {
    res.status(401).json({ success: false, message: 'Login gagal' });
  }
});

// POST /api/forgot-password
app.post('/api/forgot-password', async (req, res) => {
  const { email } = req.body;
  const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
  if (rows.length === 0) {
    return res.json({ success: true, message: 'Jika email terdaftar, link reset telah dikirim.' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 3600000); // 1 jam
  await db.query(
    'INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)',
    [email, token, expires]
  );

  const resetLink = `http://192.168.56.10/reset-password?token=${token}`;
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: email,
    subject: 'Reset Password',
    html: `<p>Klik link berikut untuk reset password (berlaku 1 jam):</p>
           <a href="${resetLink}">${resetLink}</a>`
  });

  res.json({ success: true, message: 'Link reset telah dikirim ke email kamu.' });
});

// POST /api/reset-password
app.post('/api/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  const [rows] = await db.query(
    'SELECT * FROM password_resets WHERE token = ? AND used = 0 AND expires_at > NOW()',
    [token]
  );
  if (rows.length === 0) {
    return res.status(400).json({ success: false, message: 'Token tidak valid atau sudah expired.' });
  }

  await db.query('UPDATE users SET password = ? WHERE email = ?', [newPassword, rows[0].email]);
  await db.query('UPDATE password_resets SET used = 1 WHERE token = ?', [token]);

  res.json({ success: true, message: 'Password berhasil direset.' });
});

connectDB().then(() => {
  app.listen(3001, () => console.log('Server jalan di port 3001'));
});
