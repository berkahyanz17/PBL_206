const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('/app/uploads'));

const JWT_SECRET = process.env.JWT_SECRET || 'healthsync_secret_key';
const SALT_ROUNDS = 10;

// ─── Multer (foto profil) ────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = '/app/uploads';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// ─── Nodemailer ──────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: 'smtp.resend.com',
  port: 465,
  secure: true,
  auth: {
    user: 'resend',
    pass: process.env.MAIL_PASS
  }
});

// ─── Database ────────────────────────────────────────────────────────────────
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
      console.log('DB connected');
      break;
    } catch (err) {
      console.log('DB not ready, retrying in 3s...');
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

// ─── Middleware JWT ───────────────────────────────────────────────────────────
function verifyToken(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth) return res.status(401).json({ success: false, message: 'Token tidak ada.' });
  const token = auth.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Token tidak valid.' });
  }
}

// ─── hCaptcha ────────────────────────────────────────────────────────────────
async function verifyCaptcha(token) {
  if (!token) return false;
  const res = await fetch('https://api.hcaptcha.com/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `response=${token}&secret=${process.env.HCAPTCHA_SECRET}`
  });
  const data = await res.json();
  console.log('hCaptcha response:', JSON.stringify(data));
  return data.success;
}

// ════════════════════════════════════════════════════════════════════════════
// AUTH
// ════════════════════════════════════════════════════════════════════════════

// POST /api/admin/login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password, captchaToken } = req.body;
    const valid = await verifyCaptcha(captchaToken);
    if (!valid) return res.status(400).json({ success: false, message: 'CAPTCHA tidak valid.' });

    const [rows] = await db.query('SELECT * FROM admins WHERE username = ?', [username]);
    if (rows.length === 0) return res.status(401).json({ success: false, message: 'Username atau password salah.' });

    const match = await bcrypt.compare(password, rows[0].password);
    if (!match) return res.status(401).json({ success: false, message: 'Username atau password salah.' });

    const token = jwt.sign({ id: rows[0].id, role: 'admin', username }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ success: true, token, user: { id: rows[0].id, username } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/dokter/login
app.post('/api/dokter/login', async (req, res) => {
  try {
    const { email, password, captchaToken } = req.body;
    const valid = await verifyCaptcha(captchaToken);
    if (!valid) return res.status(400).json({ success: false, message: 'CAPTCHA tidak valid.' });

    const [rows] = await db.query('SELECT * FROM dokters WHERE email = ? OR no_str = ?', [email, email]);
    if (rows.length === 0) return res.status(401).json({ success: false, message: 'Email/STR atau password salah.' });

    const match = await bcrypt.compare(password, rows[0].password);
    if (!match) return res.status(401).json({ success: false, message: 'Email/STR atau password salah.' });

    const token = jwt.sign({ id: rows[0].id, role: 'dokter', nama: rows[0].nama }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ success: true, token, user: { id: rows[0].id, nama: rows[0].nama, spesialis: rows[0].spesialis } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/pasien/login
app.post('/api/pasien/login', async (req, res) => {
  try {
    const { email, password, captchaToken } = req.body;
    const valid = await verifyCaptcha(captchaToken);
    if (!valid) return res.status(400).json({ success: false, message: 'CAPTCHA tidak valid.' });

    const [rows] = await db.query('SELECT * FROM pasiens WHERE email = ? OR no_hp = ?', [email, email]);
    if (rows.length === 0) return res.status(401).json({ success: false, message: 'Email/HP atau password salah.' });

    const match = await bcrypt.compare(password, rows[0].password);
    if (!match) return res.status(401).json({ success: false, message: 'Email/HP atau password salah.' });

    const token = jwt.sign({ id: rows[0].id, role: 'pasien', nama: rows[0].nama }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ success: true, token, user: { id: rows[0].id, nama: rows[0].nama } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/pasien/daftar
app.post('/api/pasien/daftar', async (req, res) => {
  try {
    const { nama, email, no_hp, password, captchaToken } = req.body;
    const valid = await verifyCaptcha(captchaToken);
    if (!valid) return res.status(400).json({ success: false, message: 'CAPTCHA tidak valid.' });

    const [exist] = await db.query('SELECT id FROM pasiens WHERE email = ?', [email]);
    if (exist.length > 0) return res.status(400).json({ success: false, message: 'Email sudah terdaftar.' });

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    await db.query('INSERT INTO pasiens (nama, email, no_hp, password) VALUES (?, ?, ?, ?)', [nama, email, no_hp, hashed]);
    res.json({ success: true, message: 'Pendaftaran berhasil. Silakan login.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/forgot-password
app.post('/api/forgot-password', async (req, res) => {
  try {
    const { email, captchaToken } = req.body;
    const valid = await verifyCaptcha(captchaToken);
    if (!valid) return res.status(400).json({ success: false, message: 'CAPTCHA tidak valid.' });

    const [dokter] = await db.query('SELECT email FROM dokters WHERE email = ?', [email]);
    const [pasien] = await db.query('SELECT email FROM pasiens WHERE email = ?', [email]);
    if (dokter.length === 0 && pasien.length === 0) {
      return res.json({ success: true, message: 'Jika email terdaftar, link reset telah dikirim.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000);
    await db.query('INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)', [email, token, expires]);

    const resetLink = `https://192.168.56.105/reset-password?token=${token}`;
    await transporter.sendMail({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'Reset Password - HealthSync Clinic',
      html: `<p>Klik link berikut untuk reset password (berlaku 1 jam):</p><a href="${resetLink}">${resetLink}</a>`
    });

    res.json({ success: true, message: 'Link reset telah dikirim ke email kamu.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/reset-password
app.post('/api/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const [rows] = await db.query(
      'SELECT * FROM password_resets WHERE token = ? AND used = 0 AND expires_at > NOW()',
      [token]
    );
    if (rows.length === 0) return res.status(400).json({ success: false, message: 'Token tidak valid atau sudah expired.' });

    const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
    const email = rows[0].email;

    await db.query('UPDATE dokters SET password = ? WHERE email = ?', [hashed, email]);
    await db.query('UPDATE pasiens SET password = ? WHERE email = ?', [hashed, email]);
    await db.query('UPDATE password_resets SET used = 1 WHERE token = ?', [token]);

    res.json({ success: true, message: 'Password berhasil direset.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// ADMIN — DOKTER
// ════════════════════════════════════════════════════════════════════════════

app.get('/api/dokter', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, nama, email, spesialis, no_str, harga, foto FROM dokters');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

app.post('/api/dokter', verifyToken, async (req, res) => {
  try {
    const { nama, email, password, spesialis, no_str, harga } = req.body;
    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    await db.query(
      'INSERT INTO dokters (nama, email, password, spesialis, no_str, harga) VALUES (?, ?, ?, ?, ?, ?)',
      [nama, email, hashed, spesialis, no_str, harga]
    );
    res.json({ success: true, message: 'Dokter berhasil ditambahkan.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

app.delete('/api/dokter/:id', verifyToken, async (req, res) => {
  try {
    await db.query('DELETE FROM dokters WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Dokter berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// ADMIN — PASIEN
// ════════════════════════════════════════════════════════════════════════════

app.get('/api/pasien', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, nama, email, no_hp, nik FROM pasiens');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

app.delete('/api/pasien/:id', verifyToken, async (req, res) => {
  try {
    await db.query('DELETE FROM pasiens WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Pasien berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// APPOINTMENTS
// ════════════════════════════════════════════════════════════════════════════

app.get('/api/appointments', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT a.*, p.nama as pasien_nama, d.nama as dokter_nama, d.spesialis
      FROM appointments a
      JOIN pasiens p ON a.pasien_id = p.id
      JOIN dokters d ON a.dokter_id = d.id
      ORDER BY a.created_at DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

app.post('/api/appointments', verifyToken, async (req, res) => {
  try {
    const { dokter_id, keluhan, tgl, jam } = req.body;
    const pasien_id = req.user.id;
    await db.query(
      'INSERT INTO appointments (pasien_id, dokter_id, keluhan, tgl, jam) VALUES (?, ?, ?, ?, ?)',
      [pasien_id, dokter_id, keluhan, tgl, jam]
    );
    res.json({ success: true, message: 'Appointment berhasil dibuat.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

app.patch('/api/appointments/:id/status', verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    await db.query('UPDATE appointments SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true, message: 'Status berhasil diupdate.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

app.get('/api/appointments/pasien/:id', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT a.*, d.nama as dokter_nama, d.spesialis
      FROM appointments a
      JOIN dokters d ON a.dokter_id = d.id
      WHERE a.pasien_id = ?
      ORDER BY a.created_at DESC
    `, [req.params.id]);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

app.get('/api/appointments/dokter/:id', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT a.*, p.nama as pasien_nama
      FROM appointments a
      JOIN pasiens p ON a.pasien_id = p.id
      WHERE a.dokter_id = ?
      ORDER BY a.tgl DESC, a.jam ASC
    `, [req.params.id]);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// REKAM MEDIS
// ════════════════════════════════════════════════════════════════════════════

app.get('/api/rekam-medis/dokter/:id', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT r.*, a.keluhan, a.tgl, p.nama as pasien_nama
      FROM rekam_medis r
      JOIN appointments a ON r.appointment_id = a.id
      JOIN pasiens p ON a.pasien_id = p.id
      WHERE a.dokter_id = ?
      ORDER BY r.created_at DESC
    `, [req.params.id]);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

app.post('/api/rekam-medis', verifyToken, async (req, res) => {
  try {
    const { appointment_id, diagnosa, resep, catatan } = req.body;
    await db.query(
      'INSERT INTO rekam_medis (appointment_id, diagnosa, resep, catatan) VALUES (?, ?, ?, ?)',
      [appointment_id, diagnosa, resep, catatan]
    );
    await db.query('UPDATE appointments SET status = ? WHERE id = ?', ['selesai', appointment_id]);
    res.json({ success: true, message: 'Rekam medis berhasil disimpan.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// JADWAL DOKTER
// ════════════════════════════════════════════════════════════════════════════

app.get('/api/jadwal/:dokter_id', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM jadwal_dokter WHERE dokter_id = ?', [req.params.dokter_id]);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

app.post('/api/jadwal', verifyToken, async (req, res) => {
  try {
    const { dokter_id, hari, jam_mulai, jam_selesai } = req.body;
    await db.query(
      'INSERT INTO jadwal_dokter (dokter_id, hari, jam_mulai, jam_selesai) VALUES (?, ?, ?, ?)',
      [dokter_id, hari, jam_mulai, jam_selesai]
    );
    res.json({ success: true, message: 'Jadwal berhasil ditambahkan.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

app.delete('/api/jadwal/:id', verifyToken, async (req, res) => {
  try {
    await db.query('DELETE FROM jadwal_dokter WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Jadwal berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// PROFIL
// ════════════════════════════════════════════════════════════════════════════

app.get('/api/dokter/:id/profil', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, nama, email, spesialis, no_str, harga, bio, foto FROM dokters WHERE id = ?',
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Dokter tidak ditemukan.' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

app.put('/api/dokter/:id/profil', verifyToken, upload.single('foto'), async (req, res) => {
  try {
    const { nama, spesialis, no_str, harga, bio, email } = req.body;
    const foto = req.file ? `/uploads/${req.file.filename}` : undefined;
    const fields = [nama, spesialis, no_str, harga, bio, email];
    const query = foto
      ? 'UPDATE dokters SET nama=?, spesialis=?, no_str=?, harga=?, bio=?, email=?, foto=? WHERE id=?'
      : 'UPDATE dokters SET nama=?, spesialis=?, no_str=?, harga=?, bio=?, email=? WHERE id=?';
    if (foto) fields.push(foto);
    fields.push(req.params.id);
    await db.query(query, fields);
    res.json({ success: true, message: 'Profil berhasil diupdate.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

app.get('/api/pasien/:id/profil', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, nama, email, no_hp, nik, tgl_lahir, gender, alamat, riwayat_penyakit, alergi, foto FROM pasiens WHERE id = ?',
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Pasien tidak ditemukan.' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

app.put('/api/pasien/:id/profil', verifyToken, upload.single('foto'), async (req, res) => {
  try {
    const { nama, email, no_hp, nik, tgl_lahir, gender, alamat, riwayat_penyakit, alergi } = req.body;
    const foto = req.file ? `/uploads/${req.file.filename}` : undefined;
    const fields = [nama, email, no_hp, nik, tgl_lahir, gender, alamat, riwayat_penyakit, alergi];
    const query = foto
      ? 'UPDATE pasiens SET nama=?, email=?, no_hp=?, nik=?, tgl_lahir=?, gender=?, alamat=?, riwayat_penyakit=?, alergi=?, foto=? WHERE id=?'
      : 'UPDATE pasiens SET nama=?, email=?, no_hp=?, nik=?, tgl_lahir=?, gender=?, alamat=?, riwayat_penyakit=?, alergi=? WHERE id=?';
    if (foto) fields.push(foto);
    fields.push(req.params.id);
    await db.query(query, fields);
    res.json({ success: true, message: 'Profil berhasil disimpan.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// CHAT (pasien ↔ dokter)
// ════════════════════════════════════════════════════════════════════════════

app.get('/api/chat/:sender_role/:sender_id/:receiver_role/:receiver_id', verifyToken, async (req, res) => {
  try {
    const { sender_role, sender_id, receiver_role, receiver_id } = req.params;
    const [rows] = await db.query(`
      SELECT * FROM chats
      WHERE (sender_role=? AND sender_id=? AND receiver_role=? AND receiver_id=?)
         OR (sender_role=? AND sender_id=? AND receiver_role=? AND receiver_id=?)
      ORDER BY created_at ASC
    `, [sender_role, sender_id, receiver_role, receiver_id,
        receiver_role, receiver_id, sender_role, sender_id]);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

app.post('/api/chat', verifyToken, async (req, res) => {
  try {
    const { sender_role, sender_id, receiver_role, receiver_id, pesan } = req.body;
    await db.query(
      'INSERT INTO chats (sender_role, sender_id, receiver_role, receiver_id, pesan) VALUES (?, ?, ?, ?, ?)',
      [sender_role, sender_id, receiver_role, receiver_id, pesan]
    );
    res.json({ success: true, message: 'Pesan terkirim.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// MAMORU — AI Chatbot (Gemini Flash + Telegram Notification)
// ════════════════════════════════════════════════════════════════════════════

const GEMINI_API_KEY   = process.env.GEMINI_API_KEY;
const TELEGRAM_TOKEN   = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function notifyTelegram(pasienNama, pesan) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log('[Mamoru] ⚠️  Telegram env not set, skipping notification.');
    return;
  }
  const text =
    `🔔 *Pesan Masuk — Mamoru Chatbot*\n` +
    `👤 Pasien: *${pasienNama}*\n` +
    `💬 Pesan: ${pesan}\n` +
    `🕐 ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`;
  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: 'Markdown' })
    });
    const tgData = await tgRes.json();
    if (tgData.ok) {
      console.log('[Mamoru] ✅ Telegram notification sent.');
    } else {
      console.error('[Mamoru] ❌ Telegram error:', JSON.stringify(tgData));
    }
  } catch (err) {
    console.error('[Mamoru] ❌ Telegram fetch failed:', err.message);
  }
}

function isAdminNotifyNeeded(pesan) {
  const keywords = [
    'booking', 'darurat', 'urgent', 'gawat', 'emergency',
    'tidak bisa', 'gagal', 'error', 'komplain', 'keluhan',
    'hubungi', 'telepon', 'bantuan', 'help'
  ];
  return keywords.some(k => pesan.toLowerCase().includes(k));
}

// POST /api/mamoru  — no auth required (public chatbot)
app.post('/api/mamoru', async (req, res) => {
  console.log('[Mamoru] 📨 Request received:', JSON.stringify(req.body).slice(0, 200));
  try {
    const { pesan, history = [], pasienNama = 'Pasien' } = req.body;

    if (!pesan || !pesan.trim()) {
      console.log('[Mamoru] ⚠️  Empty message received.');
      return res.status(400).json({ success: false, message: 'Pesan tidak boleh kosong.' });
    }

    if (!GEMINI_API_KEY) {
      console.error('[Mamoru] ❌ GEMINI_API_KEY is not set!');
      return res.status(500).json({ success: false, message: 'Gemini API key belum dikonfigurasi.' });
    }

    console.log('[Mamoru] 🔑 Gemini key found:', GEMINI_API_KEY.slice(0, 8) + '...');
    console.log('[Mamoru] 💬 Sending to Gemini:', pesan);

    const recentHistory = history.slice(-10).map(m => ({
      role: m.type === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    const systemInstruction = `Kamu adalah Mamoru, asisten kesehatan virtual dari HealthSync Clinic.
Tugasmu membantu pasien dengan informasi seputar layanan klinik: booking dokter, jadwal, riwayat konsultasi, profil, dan pertanyaan umum kesehatan.
Jawab dalam Bahasa Indonesia, ramah, singkat, dan profesional.
Jangan pernah memberikan diagnosis medis. Jika darurat, selalu arahkan ke tenaga medis.
Nama pasien yang sedang chat: ${pasienNama}.`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents: [
            ...recentHistory,
            { role: 'user', parts: [{ text: pesan }] }
          ],
          generationConfig: { maxOutputTokens: 512, temperature: 0.7 }
        })
      }
    );

    console.log('[Mamoru] 📡 Gemini HTTP status:', geminiRes.status);

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('[Mamoru] ❌ Gemini error response:', errText);
      return res.status(502).json({ success: false, message: 'Gagal menghubungi AI. Coba lagi.' });
    }

    const geminiData = await geminiRes.json();
    console.log('[Mamoru] 📦 Gemini raw response:', JSON.stringify(geminiData).slice(0, 300));

    const reply = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text
      || 'Maaf, saya tidak bisa menjawab saat ini. Silakan coba lagi.';

    console.log('[Mamoru] ✅ Reply:', reply.slice(0, 100));

    const needsNotif = isAdminNotifyNeeded(pesan);
    console.log('[Mamoru] 📣 Needs Telegram notif?', needsNotif);
    if (needsNotif) await notifyTelegram(pasienNama, pesan);

    res.json({ success: true, reply });
  } catch (err) {
    console.error('[Mamoru] 💥 Unexpected error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// START
// ════════════════════════════════════════════════════════════════════════════
connectDB().then(() => {
  app.listen(3001, () => console.log('Server jalan di port 3001'));
});
