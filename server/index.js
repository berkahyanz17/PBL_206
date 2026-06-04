const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const nodemailer = require('nodemailer');
const crypto = require('crypto');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS  // Gmail App Password, bukan password biasa
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

connectDB().then(() => {
  app.listen(3001, () => console.log('Server jalan di port 3001'));
});
