# Implementasi: Automated Backup + MariaDB TDE
## Disesuaikan untuk `~/db-stack/` di DB VM (192.168.56.113)

---

## PART 1 — Automated Backup

### 1. Copy script ke DB VM

```bash
# Di laptop kamu, scp backup.sh ke DB VM
scp backup.sh berkah@192.168.56.113:~/backup.sh
```

Di DB VM:
```bash
chmod +x ~/backup.sh
```

### 2. Pastikan MYSQL_ROOT_PASSWORD ada di .env

Cek dulu:
```bash
cd ~/db-stack
cat .env | grep MYSQL_ROOT_PASSWORD
```

Kalau tidak ada baris itu, tambahkan manual ke `.env` (samakan dengan password root yang sudah dipakai container `db` saat ini — jangan ganti password, cukup pastikan tertulis di `.env` supaya script bisa baca otomatis).

### 3. Test manual dulu sebelum dijadwalkan

```bash
~/backup.sh
cat ~/backups/backup.log 2>/dev/null || echo "(belum ada log, ini test manual jadi normal)"
ls -lh ~/backups/
```

Harus muncul file `db_<timestamp>.sql.gz` dengan ukuran > 0. Kalau gagal, baca error message — script sekarang fail-fast (`set -euo pipefail`) jadi error akan jelas terlihat, bukan diam-diam menghasilkan file kosong.

### 4. Jadwalkan via cron

```bash
crontab -e
```

Tambahkan:
```
0 10 * * * /home/berkah/backup.sh >> /home/berkah/backups/backup.log 2>&1
```

### 5. Anacron untuk catch-up kalau VM mati saat jam 10 pagi

```bash
sudo apt install anacron
sudo nano /etc/anacrontab
```

Tambahkan baris:
```
1   10   backup-db   /home/berkah/backup.sh >> /home/berkah/backups/backup.log 2>&1
```

### 6. Verifikasi isi backup valid (penting — jangan skip)

```bash
zcat ~/backups/db_<timestamp>.sql.gz | head -50
```

Harus terlihat statement SQL (`CREATE TABLE`, `INSERT INTO`, dst), bukan error message atau file kosong.

---

## PART 2 — MariaDB TDE (Transparent Data Encryption)

**Konfirmasi dulu sebelum lanjut:** TDE ini encrypt-at-rest di level file storage InnoDB. Tidak mengubah query SQL, tidak mengubah kode backend Node.js, tidak mengubah schema. Backend tetap connect & query seperti biasa.

**PENTING — backup dulu sebelum apply TDE.** Jalankan PART 1 di atas dulu (atau backup manual) sebelum lanjut ke bawah, karena restart container `db` dengan config baru sebaiknya dilakukan dengan data sudah ter-backup.

### 1. Generate encryption keyfile

Di DB VM, masuk ke folder stack:
```bash
cd ~/db-stack
```

Copy `generate-tde-key.sh` ke sini, lalu:
```bash
chmod +x generate-tde-key.sh
./generate-tde-key.sh
```

Ini menghasilkan:
- `mysql-encryption/keyfile` — berisi key enkripsi aktual
- `mysql-encryption/keyfile.key` — key untuk mengenkripsi keyfile itu sendiri

**Backup kedua file ini ke tempat aman di LUAR VM** (password manager / vault) — kalau hilang, data terenkripsi tidak bisa dibaca lagi, termasuk dari backup `.sql.gz` yang sudah di-dump sebelum TDE aktif (dump SQL biasa tetap plaintext, jadi backup lama aman, tapi data BARU yang masuk setelah TDE aktif akan butuh keyfile ini untuk dibaca ulang dari raw file `.ibd`).

### 2. Set permission yang benar

```bash
chmod 600 mysql-encryption/keyfile mysql-encryption/keyfile.key
```

Container MariaDB jalan sebagai user `mysql` di dalam container — pastikan file ini readable oleh container. Kalau ada masalah permission setelah restart, cek dengan:
```bash
docker compose logs db --tail 50
```

### 3. Edit docker-compose.yml

Lihat file `docker-compose-db-tde-snippet.yml` — tambahkan bagian `volumes` dan `command` ke service `db` yang sudah ada. **Jangan hapus** environment variable atau ports yang sudah ada, cukup tambahkan dua bagian itu.

### 4. Restart service db

```bash
docker compose up -d db
```

Cek log untuk pastikan plugin termuat tanpa error:
```bash
docker compose logs db --tail 100 | grep -i encrypt
```

Harus muncul baris seperti `InnoDB: Encrypting redo log` atau sejenisnya, tanpa error fatal.

### 5. Verifikasi TDE aktif

```bash
docker exec -it db-stack-db-1 mariadb -u root -p
```

```sql
SHOW VARIABLES LIKE 'innodb_encrypt%';
```

Harus terlihat `innodb_encrypt_tables = ON` dan `innodb_encrypt_log = ON`.

Cek tabel yang sudah ada (tabel lama TIDAK otomatis encrypted, hanya tabel baru/yang di-ALTER):
```sql
SELECT table_schema, table_name, create_options 
FROM information_schema.tables 
WHERE table_schema = 'db_praktikum';
```

### 6. Encrypt tabel yang sudah ada (penting!)

`innodb_encrypt_tables=ON` membuat tabel BARU otomatis encrypted, tapi tabel yang **sudah ada sebelumnya** perlu di-`ALTER` manual supaya file fisiknya benar-benar di-encrypt ulang:

```sql
-- Jalankan untuk setiap tabel yang sudah ada di db_praktikum
ALTER TABLE pasien ENCRYPTED=YES;
ALTER TABLE dokter ENCRYPTED=YES;
ALTER TABLE rekam_medis ENCRYPTED=YES;
-- dst, sesuaikan dengan nama tabel kamu yang sebenarnya
```

Cek daftar tabel dulu kalau lupa nama lengkapnya:
```sql
SHOW TABLES FROM db_praktikum;
```

### 7. Verifikasi backend tidak terdampak

Test endpoint yang biasa dipakai (login, lihat data pasien, dst) — harus tetap berjalan normal tanpa perubahan apa pun di kode. Kalau ada error koneksi setelah restart `db`, cek apakah container `db` benar-benar up:
```bash
docker compose ps
```

---

## Catatan Keamanan

- **Backup `.sql.gz` dari `mysqldump`/`mariadb-dump` TETAP PLAINTEXT** — TDE hanya melindungi file `.ibd` di disk, bukan output dump SQL. Kalau mau backup juga terenkripsi, perlu langkah tambahan (encrypt file backup dengan `gpg` atau `openssl enc`) — kasih tahu kalau ini juga mau diimplementasi.
- Jangan commit `mysql-encryption/keyfile` dan `keyfile.key` ke Git. Tambahkan ke `.gitignore`:
  ```
  mysql-encryption/
  ```
