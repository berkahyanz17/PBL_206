// ─── server/crypto.js ────────────────────────────────────────────────────────
// AES-256-GCM encrypt/decrypt helper.
// Taruh di: server/crypto.js
// Require di index.js: const { encrypt, decrypt } = require('./crypto');
//
// ENV yang dibutuhkan (tambah di docker-compose.yml):
//   ENCRYPTION_KEY: string hex 64 karakter (= 32 bytes)
//
// Generate key sekali:
//   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
// ─────────────────────────────────────────────────────────────────────────────

'use strict';
const crypto = require('crypto');

const ALGORITHM  = 'aes-256-gcm';
const IV_LEN     = 12;   // 96-bit IV — rekomendasi NIST untuk GCM
const TAG_LEN    = 16;   // 128-bit auth tag

function getKey() {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      '[crypto] ENCRYPTION_KEY harus berupa hex 64 karakter (32 bytes). ' +
      'Generate dengan: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  return Buffer.from(hex, 'hex');
}

/**
 * Enkripsi string plaintext.
 * Output: string "iv:authTag:ciphertext" dalam hex, aman disimpan di DB (TEXT/VARCHAR).
 * Return null kalau input null/undefined/kosong.
 */
function encrypt(plaintext) {
  if (plaintext === null || plaintext === undefined || plaintext === '') return null;

  const key = getKey();
  const iv  = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(String(plaintext), 'utf8'),
    cipher.final()
  ]);
  const tag = cipher.getAuthTag();

  // Format: iv(hex):tag(hex):ciphertext(hex)
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Dekripsi string hasil encrypt().
 * Return null kalau input null/undefined/kosong.
 * Throw error kalau data rusak atau kunci salah (GCM auth gagal).
 */
function decrypt(encryptedStr) {
  if (encryptedStr === null || encryptedStr === undefined || encryptedStr === '') return null;

  const parts = encryptedStr.split(':');
  if (parts.length !== 3) {
    // Kemungkinan data lama yang belum dienkripsi — kembalikan apa adanya
    // (berguna saat masa transisi/migrasi)
    console.warn('[crypto] Data tidak dalam format encrypted, dikembalikan as-is.');
    return encryptedStr;
  }

  const [ivHex, tagHex, dataHex] = parts;
  const key = getKey();

  try {
    const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(dataHex, 'hex')),
      decipher.final()
    ]);
    return decrypted.toString('utf8');
  } catch (err) {
    console.error('[crypto] Decrypt gagal (data rusak atau kunci salah):', err.message);
    throw new Error('Dekripsi gagal — data mungkin rusak atau kunci enkripsi berubah.');
  }
}

/**
 * Enkripsi object: hanya field yang ada di ENCRYPTED_FIELDS.
 * Berguna untuk encrypt payload sebelum INSERT/UPDATE.
 */
const ENCRYPTED_FIELDS = ['nik', 'no_hp', 'alamat', 'riwayat_penyakit', 'alergi'];

function encryptPasien(data) {
  const result = { ...data };
  for (const field of ENCRYPTED_FIELDS) {
    if (field in result) {
      result[field] = encrypt(result[field]);
    }
  }
  return result;
}

/**
 * Dekripsi object: hanya field yang ada di ENCRYPTED_FIELDS.
 * Berguna untuk decrypt row dari DB sebelum dikirim ke frontend.
 */
function decryptPasien(row) {
  if (!row) return null;
  const result = { ...row };
  for (const field of ENCRYPTED_FIELDS) {
    if (field in result) {
      try {
        result[field] = decrypt(result[field]);
      } catch {
        result[field] = null; // jangan crash seluruh response
      }
    }
  }
  return result;
}

module.exports = { encrypt, decrypt, encryptPasien, decryptPasien, ENCRYPTED_FIELDS };
