-- Tambah kolom qris_image ke tabel dokters (path file QRIS pembayaran per-dokter)
ALTER TABLE `dokters`
  ADD COLUMN `qris_image` varchar(255) DEFAULT NULL AFTER `foto`;
