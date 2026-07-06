-- Tambah status baru + kolom paid & harga snapshot ke appointments
ALTER TABLE `appointments`
  MODIFY `status` enum('menunggu_bayar','menunggu','dikonfirmasi','selesai','ditolak','refund') NOT NULL DEFAULT 'menunggu_bayar',
  ADD COLUMN `paid` tinyint(1) NOT NULL DEFAULT 0 AFTER `status`,
  ADD COLUMN `harga` int(11) DEFAULT NULL AFTER `paid`;

-- Data lama dianggap sudah "lunas" biar gak kena logic refund secara gak sengaja
UPDATE `appointments` SET `paid` = 1 WHERE `status` IN ('menunggu','dikonfirmasi','selesai','ditolak');
