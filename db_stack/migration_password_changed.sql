-- Migration: tambah kolom password_changed
-- Jalankan sekali di dbserver (database yang sudah jalan), TIDAK perlu import ulang db_praktikum.sql.
-- Tujuan: admin & dokter default 0 (perlu diingatkan ganti password),
--         pasien default 1 (password sudah dipilih sendiri saat daftar).

ALTER TABLE `admins`  ADD COLUMN `password_changed` tinyint(1) DEFAULT 0;
ALTER TABLE `dokters` ADD COLUMN `password_changed` tinyint(1) DEFAULT 0;
ALTER TABLE `pasiens` ADD COLUMN `password_changed` tinyint(1) DEFAULT 1;

-- Pasien yang sudah ada dianggap sudah pakai password sendiri, jadi set semua ke 1.
UPDATE `pasiens` SET `password_changed` = 1;
