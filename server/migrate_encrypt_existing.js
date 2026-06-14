// ─── server/migrate_encrypt_existing.js ──────────────────────────────────────
// Script migrasi SEKALI JALAN — enkripsi data pasien lama yang masih plaintext.
//
// Jalankan dari dalam container server SETELAH ENCRYPTION_KEY diset:
//   docker exec -it <server_container> node migrate_encrypt_existing.js
//
// Script ini AMAN dijalankan berkali-kali:
//   - Data yang sudah terenkripsi (format iv:tag:cipher) dilewati otomatis.
//   - Hanya plaintext yang diproses.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';
// require('dotenv').config(); // opsional, kalau pakai .env lokal
// untuk saat ini .env masih di docker-compose.yml
const mysql  = require('mysql2/promise');
const { encrypt, ENCRYPTED_FIELDS } = require('./crypto');

const FIELDS_TO_MIGRATE = ENCRYPTED_FIELDS; // ['nik','no_hp','alamat','riwayat_penyakit','alergi']

function isAlreadyEncrypted(value) {
  if (!value) return true; // null/kosong, skip
  // Format terenkripsi: "hexhex:hexhex:hexhex" (3 bagian dipisah titik dua)
  const parts = value.split(':');
  return parts.length === 3 && parts.every(p => /^[0-9a-f]+$/i.test(p));
}

async function migrate() {
  const db = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'db',
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || 'secret',
    database: process.env.DB_NAME     || 'db_praktikum',
  });

  console.log('🔌 DB connected. Mulai migrasi enkripsi...\n');

  const [pasiens] = await db.query(
    `SELECT id, ${FIELDS_TO_MIGRATE.join(', ')} FROM pasiens`
  );

  let updated = 0;
  let skipped = 0;

  for (const pasien of pasiens) {
    const updates = {};

    for (const field of FIELDS_TO_MIGRATE) {
      const val = pasien[field];
      if (!val || isAlreadyEncrypted(val)) {
        // null atau sudah terenkripsi — skip field ini
        continue;
      }
      updates[field] = encrypt(val);
    }

    if (Object.keys(updates).length === 0) {
      console.log(`  ⏭️  Pasien ID ${pasien.id} — semua field null/sudah terenkripsi, skip.`);
      skipped++;
      continue;
    }

    const setClauses = Object.keys(updates).map(f => `${f} = ?`).join(', ');
    const values     = [...Object.values(updates), pasien.id];
    await db.query(`UPDATE pasiens SET ${setClauses} WHERE id = ?`, values);

    console.log(`  ✅ Pasien ID ${pasien.id} — field dienkripsi: ${Object.keys(updates).join(', ')}`);
    updated++;
  }

  console.log(`\n📊 Selesai. Updated: ${updated}, Skipped: ${skipped}, Total: ${pasiens.length}`);
  await db.end();
}

migrate().catch(err => {
  console.error('❌ Migrasi gagal:', err.message);
  process.exit(1);
});
