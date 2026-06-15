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
const helmet = require('helmet');
const pino = require('pino');
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL || 'redis://redis:6379');
const { encryptPasien, decryptPasien } = require('./crypto');

const logger = pino({ level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' });

// Helper — parse or return 400
function validate(schema, body, res) {
  const result = schema.safeParse(body);
  if (!result.success) {
    res.status(400).json({ success: false, message: 'Input tidak valid.', errors: result.error.issues });
    return null;
  }
  return result.data;
}

const app = express();
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use('/uploads', express.static('/app/uploads'));

// ─── Healthcheck ────────────────────────────────────────────────────
app.get('/health', (req, res) => res.sendStatus(200));

const JWT_SECRET         = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  logger.error('JWT_SECRET atau JWT_REFRESH_SECRET belum diset!');
  process.exit(1);
}
const ACCESS_TOKEN_TTL  = 15 * 60;        // 15 menit (detik)
const REFRESH_TOKEN_TTL = 7 * 24 * 3600;  // 7 hari (detik)
const SALT_ROUNDS = 10;

// ─── Multer (foto profil) ────────────────────────────────────────────────────
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = '/app/uploads';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, crypto.randomUUID() + ext);  // random name, no original filename
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});
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
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0
      });
      logger.info('DB connected');
      break;
    } catch (err) {
      logger.info('DB not ready, retrying in 3s...');
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
  } catch (err) {
    logger.info('Verify error:', err.message);
    res.status(401).json({ success: false, message: 'Token tidak valid.' });
  }
}

// ─── Token helpers ────────────────────────────────────────────────────────────
function signAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
}

async function signRefreshToken(payload) {
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_TTL });
  // Simpan di Redis: key = refresh:<token>, value = user id
  await redis.setex(`refresh:${refreshToken}`, REFRESH_TOKEN_TTL, String(payload.id));
  return refreshToken;
}

async function revokeRefreshToken(token) {
  await redis.del(`refresh:${token}`);
}

// verifyToken sudah ada di atas — tidak perlu diubah, tetap pakai JWT_SECRET

// ─── hCaptcha ────────────────────────────────────────────────────────────────
async function verifyCaptcha(token) {
  if (!token) return false;
  const res = await fetch('https://api.hcaptcha.com/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `response=${token}&secret=${process.env.HCAPTCHA_SECRET}`
  });
  const data = await res.json();
  logger.info('hCaptcha response:', JSON.stringify(data));
  return data.success;
}

// ─── Rate limiter middleware ──────────────────────────────────────────────────
async function rateLimiter(req, res, next) {
  const ip = req.headers['x-real-ip'] || req.ip;
  const key = `rl:${ip}:${req.path}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 60);
  if (count > 10) return res.status(429).json({ success: false, message: 'Terlalu banyak percobaan. Coba lagi nanti.' });
  next();
}

// ════════════════════════════════════════════════════════════════════════════
// PATCH — Ganti 3 helper function di index.js (baris 108–146)
// Ganti dari:
//   "// ─── Notification helper" (baris 108)
// Sampai:
//   "  } catch (err) {"  +  "    logger.error('[Notif]..." + "  }" + "}" (baris 143–146)
//
// Dengan kode di bawah ini.
// ════════════════════════════════════════════════════════════════════════════

// ─── Telegram helper ──────────────────────────────────────────────────────────
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

/**
 * Kirim pesan Telegram ke satu chatId.
 * Return: { ok: true } kalau berhasil, { ok: false, reason, code } kalau gagal.
 * TIDAK pernah throw — aman dipanggil fire-and-forget maupun di-await.
 */
async function sendTelegram(chatId, text) {
  if (!TELEGRAM_BOT_TOKEN) {
    logger.warn('[Telegram] ⚠️  TELEGRAM_BOT_TOKEN tidak diset, skip.');
    return { ok: false, reason: 'no_token' };
  }
  if (!chatId) {
    logger.warn('[Telegram] ⚠️  chatId kosong, skip.');
    return { ok: false, reason: 'no_chat_id' };
  }

  try {
    const tgRes = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' })
      }
    );

    const tgData = await tgRes.json();

    if (tgData.ok) {
      logger.info(`[Telegram] ✅ Sent to ${chatId}`);
      return { ok: true };
    }

    // Telegram API returned ok: false — log detail errornya
    const errCode    = tgData.error_code;
    const errDesc    = tgData.description || 'Unknown error';
    let reason       = 'api_error';
    let hint         = '';

    if (errCode === 400 && errDesc.includes('chat not found')) {
      reason = 'chat_not_found';
      hint   = `Chat ID "${chatId}" tidak ditemukan. Pastikan user sudah /start ke bot terlebih dahulu.`;
    } else if (errCode === 400 && errDesc.includes('PEER_ID_INVALID')) {
      reason = 'invalid_chat_id';
      hint   = `Chat ID "${chatId}" tidak valid. Cek kembali format Chat ID di settings.`;
    } else if (errCode === 403 && errDesc.includes('bot was blocked')) {
      reason = 'bot_blocked';
      hint   = `User memblokir bot. Minta user untuk unblock atau /start ulang.`;
    } else if (errCode === 403 && errDesc.includes('user is deactivated')) {
      reason = 'user_deactivated';
      hint   = `Akun Telegram untuk chat ID "${chatId}" telah dideaktivasi.`;
    } else if (errCode === 429) {
      reason = 'rate_limited';
      hint   = `Bot Telegram terkena rate limit. Coba lagi beberapa detik kemudian.`;
    } else if (errCode === 401) {
      reason = 'invalid_token';
      hint   = `TELEGRAM_BOT_TOKEN tidak valid. Cek kembali token di environment variables.`;
    }

    logger.error(`[Telegram] ❌ Error ${errCode} → ${errDesc}${hint ? ' | ' + hint : ''}`);
    return { ok: false, reason, code: errCode, description: errDesc, hint };

  } catch (err) {
    // Network error (DNS gagal, timeout, dsb)
    logger.error('[Telegram] ❌ Network error:', err.message);
    return { ok: false, reason: 'network_error', message: err.message };
  }
}

// ─── Email helper ─────────────────────────────────────────────────────────────
async function sendEmail(to, subject, html) {
  if (!to) return;
  try {
    await transporter.sendMail({ from: 'onboarding@resend.dev', to, subject, html });
  } catch (err) {
    logger.error('[Email] Failed:', err.message);
    // Extract OTP dari html untuk debug
    const otpMatch = html.match(/<strong[^>]*>(\d{6})<\/strong>/);
    if (otpMatch) logger.info(`[2FA DEBUG] OTP untuk ${to}: ${otpMatch[1]}`);
  }
}

// ─── Notification helper ──────────────────────────────────────────────────────
async function createNotif(role, user_id, icon, icon_color, text) {
  try {
    const time = new Date().toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit'
    });
    await db.query(
      'INSERT INTO notifications (role, user_id, icon, icon_color, text, time) VALUES (?, ?, ?, ?, ?, ?)',
      [role, user_id, icon, icon_color, text, time]
    );
  } catch (err) {
    logger.error('[Notif] Failed to create notification:', err.message);
  }
}

// ════════════════════════════════════════════════════════════════════════════
// AUTH
// ════════════════════════════════════════════════════════════════════════════

// POST /api/admin/login
app.post('/api/admin/login', rateLimiter, async (req, res) => {
  try {
    const { username, password, captchaToken } = req.body;
    const captchaOk = await verifyCaptcha(captchaToken);
    if (!captchaOk) return res.json({ success: false, message: 'Captcha tidak valid.' });
    const [rows] = await db.query('SELECT * FROM admins WHERE username = ?', [username]);
    if (rows.length === 0) return res.status(401).json({ success: false, message: 'Username atau password salah.' });
    const match = await bcrypt.compare(password, rows[0].password);
    if (!match) return res.status(401).json({ success: false, message: 'Username atau password salah.' });
    const payload      = { id: rows[0].id, role: 'admin', username };
    const accessToken  = signAccessToken(payload);
    const refreshToken = await signRefreshToken(payload);
    res.json({ success: true, accessToken, refreshToken, user: { id: rows[0].id, username } });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/dokter/login
app.post('/api/dokter/login', rateLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await db.query('SELECT * FROM dokters WHERE email = ? OR no_str = ?', [email, email]);
    if (rows.length === 0) return res.status(401).json({ success: false, message: 'Email/STR atau password salah.' });
    const match = await bcrypt.compare(password, rows[0].password);
    if (!match) return res.status(401).json({ success: false, message: 'Email/STR atau password salah.' });
    const payload      = { id: rows[0].id, role: 'dokter', nama: rows[0].nama };
    const accessToken  = signAccessToken(payload);
    const refreshToken = await signRefreshToken(payload);
    res.json({ success: true, accessToken, refreshToken, user: { id: rows[0].id, nama: rows[0].nama, spesialis: rows[0].spesialis } });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/pasien/login
app.post('/api/pasien/login', rateLimiter, async (req, res) => {
  try {
    const { email, password, captchaToken } = req.body;
    const [rows] = await db.query('SELECT * FROM pasiens WHERE email = ? OR no_hp = ?', [email, email]);
    if (rows.length === 0) return res.status(401).json({ success: false, message: 'Email/HP atau password salah.' });
    const match = await bcrypt.compare(password, rows[0].password);
    if (!match) return res.status(401).json({ success: false, message: 'Email/HP atau password salah.' });
    const payload      = { id: rows[0].id, role: 'pasien', nama: rows[0].nama };
    const accessToken  = signAccessToken(payload);
    const refreshToken = await signRefreshToken(payload);
    res.json({ success: true, accessToken, refreshToken, user: { id: rows[0].id, nama: rows[0].nama } });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/pasien/daftar
app.post('/api/pasien/daftar', async (req, res) => {
  try {
    const { nama, email, no_hp, password } = req.body;
    const [exist] = await db.query('SELECT id FROM pasiens WHERE email = ?', [email]);
    if (exist.length > 0) return res.status(400).json({ success: false, message: 'Email sudah terdaftar.' });

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const enc = encryptPasien({ no_hp });   // enkripsi no_hp saat daftar

    await db.query(
      'INSERT INTO pasiens (nama, email, no_hp, password) VALUES (?, ?, ?, ?)',
      [nama, email, enc.no_hp, hashed]
    );

    // Notify admins
    const [admins] = await db.query('SELECT id, telegram_chat_id, notif_pasien_baru FROM admins');
    for (const a of admins) {
      await createNotif('admin', a.id, '👤', 'orange', `Pasien baru mendaftar: ${nama}`);
      if (a.notif_pasien_baru && a.telegram_chat_id) {
        await sendTelegram(a.telegram_chat_id, `👤 *Pasien Baru Mendaftar*\nNama: *${nama}*\nEmail: ${email}`);
      }
    }
    res.json({ success: true, message: 'Pendaftaran berhasil. Silakan login.' });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/forgot-password
app.post('/api/forgot-password', async (req, res) => {
  try {
    const { email, captchaToken } = req.body;
    const [dokter] = await db.query('SELECT email FROM dokters WHERE email = ?', [email]);
    const [pasien] = await db.query('SELECT email FROM pasiens WHERE email = ?', [email]);
    if (dokter.length === 0 && pasien.length === 0) {
      return res.json({ success: true, message: 'Jika email terdaftar, link reset telah dikirim.' });
    }
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000);
    await db.query('INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)', [email, token, expires]);
    const resetLink = `https://192.168.56.105/pasien/reset-password?token=${token}`;
    await transporter.sendMail({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'Reset Password - HealthSync Clinic',
      html: `<p>Klik link berikut untuk reset password (berlaku 1 jam):</p><a href="${resetLink}">${resetLink}</a>`
    });
    res.json({ success: true, message: 'Link reset telah dikirim ke email kamu.' });
  } catch (err) {
    logger.error(err);
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
    logger.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// ADMIN — DOKTER
// ════════════════════════════════════════════════════════════════════════════

app.get('/api/dokter', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, nama, email, spesialis, no_str, harga, foto FROM dokters');
    await redis.setex('cache:dokter', 300, JSON.stringify({ success: true, data: rows }));
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
    logger.error(err);
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
    const data = rows.map(r => decryptPasien(r));
    res.json({ success: true, data });
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

    const hariMap = ['Minggu','Senin','Selasa','Rabu',"Kamis","Jum'at",'Sabtu'];
    const hariTgl = hariMap[new Date(tgl).getDay()];
    const [jadwal] = await db.query(
      'SELECT * FROM jadwal_dokter WHERE dokter_id = ? AND hari = ?',
      [dokter_id, hariTgl]
    );
    if (jadwal.length === 0) {
      return res.status(400).json({ success: false, message: `Dokter tidak praktik pada hari ${hariTgl}.` });
    }

    const jamBook = jam.slice(0,5);
    const mulai = jadwal[0].jam_mulai.slice(0,5);
    const selesai = jadwal[0].jam_selesai.slice(0,5);
    if (jamBook < mulai || jamBook >= selesai) {
      return res.status(400).json({ success: false, message: `Jam praktik dokter ${mulai}–${selesai}.` });
    }

    const [exist] = await db.query(
      'SELECT id FROM appointments WHERE dokter_id = ? AND tgl = ? AND jam = ? AND status != "ditolak"',
      [dokter_id, tgl, jam]
    );
    if (exist.length > 0) {
      return res.status(400).json({ success: false, message: 'Jam tersebut sudah dibooking pasien lain.' });
    }

    const [result] = await db.query(
      'INSERT INTO appointments (pasien_id, dokter_id, keluhan, tgl, jam) VALUES (?, ?, ?, ?, ?)',
      [pasien_id, dokter_id, keluhan, tgl, jam]
    );

    // Notify admin and dokter
    const [pasienRow] = await db.query('SELECT nama FROM pasiens WHERE id = ?', [pasien_id]);
    const [dokterRow] = await db.query('SELECT nama FROM dokters WHERE id = ?', [dokter_id]);
    const pnama = pasienRow[0]?.nama || 'Pasien';
    const dnama = dokterRow[0]?.nama || 'Dokter';
    const [admins] = await db.query('SELECT id, telegram_chat_id, notif_appointment FROM admins');
    for (const a of admins) {
      await createNotif('admin', a.id, '📅', 'blue', `Booking baru dari ${pnama} ke ${dnama}`);
      if (a.notif_appointment && a.telegram_chat_id) {
        await sendTelegram(a.telegram_chat_id, `📅 *Booking Baru*\nPasien: *${pnama}*\nDokter: ${dnama}\nTgl: ${tgl} · ${jam?.slice(0,5)}`);
      }
    }
    await createNotif('dokter', dokter_id, '📅', 'green', `Pasien baru booking: ${pnama} · ${tgl} ${jam?.slice(0,5)}`);
    const [dokterNotif] = await db.query('SELECT telegram_chat_id, notif_appointment FROM dokters WHERE id = ?', [dokter_id]);
    if (dokterNotif[0]?.notif_appointment && dokterNotif[0]?.telegram_chat_id) {
      await sendTelegram(dokterNotif[0].telegram_chat_id, `📅 *Booking Baru*\nPasien: *${pnama}*\nTgl: ${tgl} · ${jam?.slice(0,5)}\nKeluhan: ${keluhan}`);
    }

    res.json({ success: true, message: 'Appointment berhasil dibuat.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

app.patch('/api/appointments/:id/status', verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    await db.query('UPDATE appointments SET status = ? WHERE id = ?', [status, req.params.id]);

    // Notify pasien on dikonfirmasi or ditolak
    if (status === 'dikonfirmasi' || status === 'ditolak') {
      const [rows] = await db.query(
        `SELECT a.pasien_id, a.tgl, a.jam, d.nama as dnama
         FROM appointments a JOIN dokters d ON d.id = a.dokter_id
         WHERE a.id = ?`,
        [req.params.id]
      );
      if (rows.length > 0) {
        const { pasien_id, tgl, jam, dnama } = rows[0];
        const [pasienRow] = await db.query('SELECT email, nama, notif_approve FROM pasiens WHERE id = ?', [pasien_id]);
        if (status === 'dikonfirmasi') {
          await createNotif('pasien', pasien_id, '✅', 'green', `${dnama} menyetujui appointment kamu · ${tgl} ${jam?.slice(0,5)}`);
          if (pasienRow[0]?.notif_approve && pasienRow[0]?.email) {
            await sendEmail(pasienRow[0].email, '✅ Appointment Dikonfirmasi — HealthSync',
              `<p>Halo <b>${pasienRow[0].nama}</b>,</p><p>Appointment kamu dengan <b>${dnama}</b> pada <b>${tgl} · ${jam?.slice(0,5)}</b> telah dikonfirmasi.</p>`);
          }
        } else {
          await createNotif('pasien', pasien_id, '❌', 'orange', `${dnama} menolak appointment kamu · ${tgl}`);
          if (pasienRow[0]?.notif_approve && pasienRow[0]?.email) {
            await sendEmail(pasienRow[0].email, '❌ Appointment Ditolak — HealthSync',
              `<p>Halo <b>${pasienRow[0].nama}</b>,</p><p>Mohon maaf, appointment kamu dengan <b>${dnama}</b> pada <b>${tgl}</b> ditolak. Silakan booking ulang.</p>`);
          }
        }
      }
    }

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

app.get('/api/jadwal-publik/:dokter_id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM jadwal_dokter WHERE dokter_id = ?', [req.params.dokter_id]);
    res.json({ success: true, data: rows });
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
    await redis.del('cache:dokter');
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
    res.json({ success: true, data: decryptPasien(rows[0]) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

app.put('/api/pasien/:id/profil', verifyToken, upload.single('foto'), async (req, res) => {
  try {
    const { nama, email, no_hp, nik, tgl_lahir, gender, alamat, riwayat_penyakit, alergi } = req.body;
    const foto = req.file ? `/uploads/${req.file.filename}` : undefined;

    // Enkripsi semua field sensitif
    const enc = encryptPasien({ no_hp, nik, alamat, riwayat_penyakit, alergi });
    const fields = [nama, email, enc.no_hp, enc.nik, tgl_lahir || null, gender || null, enc.alamat, enc.riwayat_penyakit, enc.alergi];
    const query = foto
      ? 'UPDATE pasiens SET nama=?, email=?, no_hp=?, nik=?, tgl_lahir=?, gender=?, alamat=?, riwayat_penyakit=?, alergi=?, foto=? WHERE id=?'
      : 'UPDATE pasiens SET nama=?, email=?, no_hp=?, nik=?, tgl_lahir=?, gender=?, alamat=?, riwayat_penyakit=?, alergi=? WHERE id=?';
    if (foto) fields.push(foto);
    fields.push(req.params.id);

    await db.query(query, fields);
    res.json({ success: true, message: 'Profil berhasil disimpan.' });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// CHAT (admin ↔ dokter)
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
    // Notify recipient
    if (sender_role === 'dokter' && receiver_role === 'admin') {
      const [dok] = await db.query('SELECT nama FROM dokters WHERE id = ?', [sender_id]);
      const [admins] = await db.query('SELECT id, telegram_chat_id, notif_chat_dokter FROM admins');
      for (const a of admins) {
        await createNotif('admin', a.id, '💬', 'blue', `Pesan baru dari ${dok[0]?.nama || 'Dokter'}`);
        if (a.notif_chat_dokter && a.telegram_chat_id) {
          await sendTelegram(a.telegram_chat_id, `💬 *Pesan dari ${dok[0]?.nama || 'Dokter'}*\n${pesan}`);
        }
      }
    } else if (sender_role === 'admin' && receiver_role === 'dokter') {
      await createNotif('dokter', receiver_id, '💬', 'blue', 'Admin mengirim pesan baru');
      const [dokNotif] = await db.query('SELECT telegram_chat_id, notif_chat_admin FROM dokters WHERE id = ?', [receiver_id]);
      if (dokNotif[0]?.notif_chat_admin && dokNotif[0]?.telegram_chat_id) {
        await sendTelegram(dokNotif[0].telegram_chat_id, `💬 *Pesan dari Admin*\n${pesan}`);
      }
    }
    res.json({ success: true, message: 'Pesan terkirim.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// SETTINGS — PASSWORD
// ════════════════════════════════════════════════════════════════════════════

app.patch('/api/admin/password', verifyToken, async (req, res) => {
  try {
    const { pwLama, pwBaru } = req.body;
    const [rows] = await db.query('SELECT password FROM admins WHERE id = ?', [req.user.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
    const match = await bcrypt.compare(pwLama, rows[0].password);
    if (!match) return res.status(401).json({ success: false, message: 'Password lama salah.' });
    const hashed = await bcrypt.hash(pwBaru, SALT_ROUNDS);
    await db.query('UPDATE admins SET password = ? WHERE id = ?', [hashed, req.user.id]);
    res.json({ success: true, message: 'Password berhasil diubah.' });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
});

app.patch('/api/dokter/password', verifyToken, async (req, res) => {
  try {
    const { pwLama, pwBaru } = req.body;
    const [rows] = await db.query('SELECT password FROM dokters WHERE id = ?', [req.user.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
    const match = await bcrypt.compare(pwLama, rows[0].password);
    if (!match) return res.status(401).json({ success: false, message: 'Password lama salah.' });
    const hashed = await bcrypt.hash(pwBaru, SALT_ROUNDS);
    await db.query('UPDATE dokters SET password = ? WHERE id = ?', [hashed, req.user.id]);
    res.json({ success: true, message: 'Password berhasil diubah.' });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
});

app.patch('/api/pasien/password', verifyToken, async (req, res) => {
  try {
    const { pwLama, pwBaru } = req.body;
    const [rows] = await db.query('SELECT password FROM pasiens WHERE id = ?', [req.user.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
    const match = await bcrypt.compare(pwLama, rows[0].password);
    if (!match) return res.status(401).json({ success: false, message: 'Password lama salah.' });
    const hashed = await bcrypt.hash(pwBaru, SALT_ROUNDS);
    await db.query('UPDATE pasiens SET password = ? WHERE id = ?', [hashed, req.user.id]);
    res.json({ success: true, message: 'Password berhasil diubah.' });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
});

// ════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ════════════════════════════════════════════════════════════════════════════

app.get('/api/notifikasi', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM notifications WHERE role = ? AND user_id = ? ORDER BY created_at DESC LIMIT 20',
      [req.user.role, req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
});

app.patch('/api/notifikasi/read', verifyToken, async (req, res) => {
  try {
    await db.query(
      'UPDATE notifications SET is_read = 1 WHERE role = ? AND user_id = ?',
      [req.user.role, req.user.id]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
});

// ════════════════════════════════════════════════════════════════════════════
// NOTIF SETTINGS
// ════════════════════════════════════════════════════════════════════════════

app.get('/api/notif-settings', verifyToken, async (req, res) => {
  try {
    const { role, id } = req.user;
    let rows;
    if (role === 'admin') {
      [rows] = await db.query('SELECT telegram_chat_id, notif_pasien_baru, notif_appointment, notif_chat_dokter FROM admins WHERE id = ?', [id]);
    } else if (role === 'dokter') {
      [rows] = await db.query('SELECT telegram_chat_id, notif_chat_admin, notif_appointment FROM dokters WHERE id = ?', [id]);
    } else {
      [rows] = await db.query('SELECT notif_approve, notif_pengingat FROM pasiens WHERE id = ?', [id]);
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) { res.status(500).json({ success: false }); }
});

app.patch('/api/notif-settings', verifyToken, async (req, res) => {
  try {
    const { role, id } = req.user;
    if (role === 'admin') {
      const { telegram_chat_id, notif_pasien_baru, notif_appointment, notif_chat_dokter } = req.body;
      await db.query('UPDATE admins SET telegram_chat_id=?, notif_pasien_baru=?, notif_appointment=?, notif_chat_dokter=? WHERE id=?',
        [telegram_chat_id, notif_pasien_baru ? 1 : 0, notif_appointment ? 1 : 0, notif_chat_dokter ? 1 : 0, id]);
    } else if (role === 'dokter') {
      const { telegram_chat_id, notif_chat_admin, notif_appointment } = req.body;
      await db.query('UPDATE dokters SET telegram_chat_id=?, notif_chat_admin=?, notif_appointment=? WHERE id=?',
        [telegram_chat_id, notif_chat_admin ? 1 : 0, notif_appointment ? 1 : 0, id]);
    } else {
      const { notif_approve, notif_pengingat } = req.body;
      await db.query('UPDATE pasiens SET notif_approve=?, notif_pengingat=? WHERE id=?',
        [notif_approve ? 1 : 0, notif_pengingat ? 1 : 0, id]);
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

// ════════════════════════════════════════════════════════════════════════════
// MAMORU — AI Chatbot (Gemini Flash + Telegram Notification)
// ════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════
// PATCH — Ganti seluruh section Mamoru di index.js dengan kode ini.
// Section yang diganti: mulai dari baris "const GEMINI_API_KEY" sampai
// akhir endpoint POST /api/mamoru (termasuk notifyTelegram & isAdminNotifyNeeded)
//
// TAMBAHKAN JUGA dua endpoint baru di bawah section NOTIF SETTINGS:
//   GET  /api/klinik-settings        (public, untuk Mamoru load context)
//   GET  /api/klinik-settings/admin  (private, untuk halaman admin)
//   PATCH /api/klinik-settings       (private, admin update)
// ════════════════════════════════════════════════════════════════════════════


// ─── Klinik Settings endpoints ───────────────────────────────────────────────
// Taruh di bawah section NOTIF SETTINGS, sebelum section MAMORU

// GET /api/klinik-settings  — public, dipakai Mamoru untuk load context
app.get('/api/klinik-settings', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT `key`, `value`, `label`, `kategori` FROM klinik_settings ORDER BY id');
    // Ubah ke object { key: value } agar mudah dikonsumsi
    const data = {};
    rows.forEach(r => { data[r.key] = r.value; });
    res.json({ success: true, data, rows });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// PATCH /api/klinik-settings  — admin only
app.patch('/api/klinik-settings', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Forbidden.' });
    const updates = req.body; // { key: value, key2: value2, ... }
    for (const [key, value] of Object.entries(updates)) {
      await db.query(
        'INSERT INTO klinik_settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?',
        [key, value, value]
      );
    }
    res.json({ success: true, message: 'Pengaturan klinik berhasil disimpan.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});


// ════════════════════════════════════════════════════════════════════════════
// MAMORU — AI Chatbot (Gemini Flash + Smart Telegram Notification)
// ════════════════════════════════════════════════════════════════════════════

const GEMINI_API_KEY   = process.env.GEMINI_API_KEY;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID; // fallback group chat

// Urutan model: coba satu per satu kalau rate limit
const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
];

// ─── Helper: panggil Gemini dengan fallback model ─────────────────────────
async function callGemini(contents, systemInstruction) {
  for (const model of GEMINI_MODELS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemInstruction }] },
            contents,
            generationConfig: { maxOutputTokens: 512, temperature: 0.7 }
          })
        }
      );
      if (res.status === 429) {
        logger.info(`[Mamoru] ⚠️ ${model} rate limited, trying next...`);
        continue;
      }
      if (!res.ok) {
        const err = await res.text();
        logger.error(`[Mamoru] ❌ ${model} error:`, err);
        continue;
      }
      const data = await res.json();
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (reply) {
        logger.info(`[Mamoru] ✅ Answered by ${model}`);
        return reply;
      }
    } catch (err) {
      logger.error(`[Mamoru] ❌ ${model} fetch error:`, err.message);
    }
  }
  return null;
}

// ─── Helper: load konteks klinik dari DB ─────────────────────────────────
async function loadKlinikContext() {
  try {
    const [rows] = await db.query('SELECT `key`, `value` FROM klinik_settings');
    const s = {};
    rows.forEach(r => { s[r.key] = r.value || ''; });
    return s;
  } catch {
    return {};
  }
}

// ─── Helper: build system prompt dinamis ─────────────────────────────────
function buildSystemPrompt(s, pasienNama, dokterList) {
  const dokterInfo = dokterList.length > 0
    ? dokterList.map(d => `  • ${d.nama} (${d.spesialis}) — Rp${Number(d.harga).toLocaleString('id-ID')}`).join('\n')
    : '  (Data dokter tidak tersedia)';

  return `Kamu adalah Mamoru, asisten kesehatan virtual dari ${s.klinik_nama || 'HealthSync Clinic'}.
Tugasmu membantu pasien dengan informasi seputar layanan klinik.

=== DATA KLINIK ===
Nama    : ${s.klinik_nama || 'HealthSync Clinic'}
Alamat  : ${s.klinik_alamat || '-'}
Jam Buka: ${s.klinik_jam_buka || '-'}
Telepon : ${s.klinik_telepon || '-'}
Email   : ${s.klinik_email || '-'}
WhatsApp: ${s.klinik_whatsapp || '-'}

=== DAFTAR DOKTER AKTIF ===
${dokterInfo}

=== CARA BOOKING ===
1. Login ke portal pasien
2. Buka menu "Cari Dokter"
3. Pilih dokter dan jadwal yang tersedia
4. Isi keluhan dan konfirmasi booking
5. Tunggu konfirmasi dari klinik via notifikasi

=== CARA LIHAT RIWAYAT ===
Buka menu "Riwayat" di sidebar portal pasien.

=== CARA UBAH PROFIL ===
Buka menu "Settings" → tab Profil.

${s.mamoru_context_extra ? `=== INFO TAMBAHAN ===\n${s.mamoru_context_extra}\n` : ''}
=== ATURAN MAMORU ===
- Jawab dalam Bahasa Indonesia, ramah, singkat, dan profesional.
- JANGAN pernah memberikan diagnosis medis.
- Untuk kondisi darurat: ${s.mamoru_darurat_msg || 'segera ke IGD atau hubungi klinik.'}
- Jika pasien marah atau komplain, minta maaf dan arahkan ke admin/telepon klinik.
- Jika ditanya di luar topik klinik, jawab singkat bahwa kamu hanya menangani urusan klinik.
- Nama pasien yang sedang chat: ${pasienNama}.`;
}

// ─── Logika kapan notif ke Telegram ──────────────────────────────────────
//
// LEVEL 1 — DARURAT: langsung notif, prioritas tinggi
const KEYWORDS_DARURAT = [
  'darurat', 'emergency', 'gawat', 'pingsan', 'sesak nafas', 'sesak napas',
  'tidak sadarkan', 'tidak sadar', 'pendarahan', 'kejang', 'stroke', 'serangan jantung',
  'kecelakaan', 'overdosis', 'bunuh diri', 'mau mati'
];

// LEVEL 2 — PERLU BANTUAN ADMIN: notif kalau bot tidak bisa bantu
const KEYWORDS_PERLU_ADMIN = [
  'komplain', 'keluhan', 'tidak puas', 'kecewa', 'mengadu', 'lapor',
  'tidak bisa booking', 'gagal booking', 'error', 'bug', 'tidak muncul',
  'refund', 'cancel', 'batal', 'uang kembali',
  'hubungi', 'telepon klinik', 'nomor klinik', 'minta tolong admin',
  'bicara dengan manusia', 'bicara dengan orang', 'cs', 'customer service'
];

// LEVEL 3 — INFO SAJA: TIDAK perlu notif (bot bisa handle sendiri)
// booking, jadwal, riwayat, profil, info dokter, info klinik, dll.

function classifyPesan(pesan) {
  const p = pesan.toLowerCase();
  if (KEYWORDS_DARURAT.some(k => p.includes(k)))      return 'darurat';
  if (KEYWORDS_PERLU_ADMIN.some(k => p.includes(k)))  return 'perlu_admin';
  return 'normal'; // bot handle sendiri, tidak perlu notif
}

// ─── Kirim notif Telegram ke admin (dengan level) ─────────────────────────
async function notifyAdminTelegram(pasienNama, pesan, level) {
  // Ambil chat_id dari DB (semua admin yang punya telegram_chat_id)
  // + fallback ke env TELEGRAM_CHAT_ID
  const chatIds = new Set();
  try {
    const [admins] = await db.query('SELECT telegram_chat_id FROM admins WHERE telegram_chat_id IS NOT NULL');
    admins.forEach(a => { if (a.telegram_chat_id) chatIds.add(a.telegram_chat_id); });
  } catch { /* skip */ }
  if (TELEGRAM_CHAT_ID) chatIds.add(TELEGRAM_CHAT_ID);

  if (chatIds.size === 0) {
    logger.info('[Mamoru] ⚠️ Tidak ada chat_id admin, skip notif Telegram.');
    return;
  }

  const isDarurat = level === 'darurat';
  const emoji     = isDarurat ? '🚨' : '⚠️';
  const judul     = isDarurat ? 'DARURAT — Butuh Penanganan Segera!' : 'Pasien Butuh Bantuan Admin';
  const text =
    `${emoji} *${judul}*\n` +
    `👤 Pasien: *${pasienNama}*\n` +
    `💬 Pesan: ${pesan}\n` +
    `🕐 ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`;

  for (const chatId of chatIds) {
    try {
      const tgRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' })
      });
      const tgData = await tgRes.json();
      if (tgData.ok) {
        logger.info(`[Mamoru] ✅ Telegram notif [${level}] sent to ${chatId}`);
      } else {
        logger.error(`[Mamoru] ❌ Telegram error for ${chatId}:`, JSON.stringify(tgData));
      }
    } catch (err) {
      logger.error(`[Mamoru] ❌ Telegram fetch failed for ${chatId}:`, err.message);
    }
  }
}

// ─── POST /api/mamoru ─────────────────────────────────────────────────────
app.post('/api/mamoru', async (req, res) => {
  logger.info('[Mamoru] 📨 Request received:', JSON.stringify(req.body).slice(0, 200));
  try {
    const { pesan, history = [], pasienNama = 'Pasien' } = req.body;

    if (!pesan || !pesan.trim()) {
      return res.status(400).json({ success: false, message: 'Pesan tidak boleh kosong.' });
    }
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ success: false, message: 'Gemini API key belum dikonfigurasi.' });
    }

    // Load konteks klinik + daftar dokter secara paralel
    const [klinik, [dokterList]] = await Promise.all([
      loadKlinikContext(),
      db.query('SELECT nama, spesialis, harga FROM dokters ORDER BY nama')
        .catch(() => [[]])
    ]);
    
    const systemInstruction = buildSystemPrompt(klinik, pasienNama, dokterList);

    const recentHistory = history.slice(-10).map(m => ({
      role: m.type === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    // Klasifikasi pesan SEBELUM panggil Gemini (supaya bisa inject warning di reply jika darurat)
    const level = classifyPesan(pesan);

    const reply = await callGemini(
      [...recentHistory, { role: 'user', parts: [{ text: pesan }] }],
      systemInstruction
    ) || 'Maaf, saya tidak bisa menjawab saat ini. Silakan coba lagi atau hubungi klinik langsung.';

    // Notif Telegram hanya untuk level darurat / perlu_admin
    if (level === 'darurat' || level === 'perlu_admin') {
      // Fire-and-forget, tidak blocking response ke user
      notifyAdminTelegram(pasienNama, pesan, level).catch(err =>
        logger.error('[Mamoru] notifyAdminTelegram error:', err.message)
      );
    }

    res.json({ success: true, reply, notifLevel: level }); // notifLevel opsional, untuk debug di frontend
  } catch (err) {
    logger.error('[Mamoru] 💥 Unexpected error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── POST /api/refresh ────────────────────────────────────────────────────────
// Tukar refresh token lama → access token baru + refresh token baru (rotation)
app.post('/api/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ success: false, message: 'Refresh token tidak ada.' });

  try {
    // 1. Verifikasi signature
    const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET);

    // 2. Cek apakah token masih ada di Redis (belum di-revoke)
    const stored = await redis.get(`refresh:${refreshToken}`);
    if (!stored) return res.status(401).json({ success: false, message: 'Refresh token tidak valid atau sudah expired.' });

    // 3. Revoke token lama (rotation — satu token hanya bisa dipakai sekali)
    await revokeRefreshToken(refreshToken);

    // 4. Issue token baru
    const newPayload      = { id: payload.id, role: payload.role, ...(payload.username && { username: payload.username }), ...(payload.nama && { nama: payload.nama }) };
    const newAccessToken  = signAccessToken(newPayload);
    const newRefreshToken = await signRefreshToken(newPayload);

    res.json({ success: true, accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    logger.warn('[Refresh] Token error:', err.message);
    res.status(401).json({ success: false, message: 'Refresh token tidak valid.' });
  }
});

// ─── POST /api/logout ─────────────────────────────────────────────────────────
app.post('/api/logout', async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    try {
      await revokeRefreshToken(refreshToken);
    } catch (err) {
      logger.warn('[Logout] Redis error:', err.message);
    }
  }
  res.json({ success: true, message: 'Logout berhasil.' });
});

// ─── Centralized error handler ──────────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(err.status || 500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message 
  });
});

// ════════════════════════════════════════════════════════════════════════════
// START
// ════════════════════════════════════════════════════════════════════════════
connectDB().then(() => {
  app.listen(3001, () => logger.info('Server jalan di port 3001'));
});
