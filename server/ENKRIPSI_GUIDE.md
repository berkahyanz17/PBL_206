# Panduan Enkripsi HealthSync Clinic

## 1. Generate ENCRYPTION_KEY

Jalankan sekali di terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Hasilnya 64 karakter hex. **Simpan di tempat aman — kalau hilang, data tidak bisa didekripsi.**

---

## 2. Tambah ke docker-compose.yml

```yaml
server:
  environment:
    ENCRYPTION_KEY: "isi_hasil_generate_di_sini_64_karakter"
    # ... env lainnya tetap
```

---

## 3. Urutan Deploy

```bash
# 1. Generate key, tambah ke docker-compose.yml
# 2. Rebuild server
docker compose up --build -d server

# 3. Jalankan migrasi data lama (sekali saja)
docker exec -it <nama_container_server> node migrate_encrypt_existing.js

# 4. Verifikasi di DB — field harus tampak seperti:
#    "a3f1...:9b2c...:4d7e..."  bukan plaintext
```

---

## 4. Key Management Best Practices

| Hal | Yang Harus Dilakukan |
|-----|---------------------|
| Rotasi key | Jika key bocor: generate key baru, decrypt semua data dengan key lama, encrypt ulang dengan key baru, update env |
| Backup key | Simpan di password manager atau secret vault (bukan di repo Git) |
| Jangan hardcode | Key hanya boleh ada di env variable, tidak boleh ada di kode |
| Key berbeda per environment | Dev, staging, production pakai key berbeda |

---

## 5. MariaDB TDE (Tablespace Encryption)

TDE (Transparent Data Encryption) mengenkripsi **file fisik** database di disk — melindungi dari pencurian storage/backup.

### Aktifkan di MariaDB:

**Di `my.cnf` atau via Docker environment:**
```ini
[mysqld]
plugin-load-add = file_key_management
file_key_management_filename = /etc/mysql/encryption/keyfile
file_key_management_filekey = /etc/mysql/encryption/keyfile.key
innodb_encrypt_tables = ON
innodb_encrypt_log = ON
innodb_encryption_threads = 4
```

**Format keyfile** (`/etc/mysql/encryption/keyfile`):
```
1;hex_encryption_key_here
```

**Generate keyfile key:**
```bash
openssl rand -hex 32 > /etc/mysql/encryption/keyfile.key
```

### Di docker-compose.yml:
```yaml
db:
  volumes:
    - ./mysql-encryption/:/etc/mysql/encryption/:ro
  command: >
    --plugin-load-add=file_key_management
    --file-key-management-filename=/etc/mysql/encryption/keyfile
    --innodb-encrypt-tables=ON
    --innodb-encrypt-log=ON
```

> **Catatan:** TDE melindungi data **at rest** (di disk). Kombinasi TDE + AES-256-GCM di aplikasi = defense-in-depth — bahkan DBA yang bisa akses DB langsung tidak bisa baca NIK/rekam medis tanpa ENCRYPTION_KEY aplikasi.

---

## 6. Summary Arsitektur Enkripsi

```
User Input
    │
    ▼
Node.js (AES-256-GCM encrypt)
    │   ← ENCRYPTION_KEY dari env
    ▼
MariaDB (data tersimpan sebagai "iv:tag:cipher")
    │   ← TDE: file fisik di disk juga terenkripsi
    ▼
Node.js (AES-256-GCM decrypt)
    │
    ▼
Frontend (plaintext untuk display)
```

**Password** tetap bcrypt (one-way, tidak perlu decrypt).  
**nama & email** tetap plaintext (dibutuhkan untuk query login/display).
