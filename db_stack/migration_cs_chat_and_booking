-- ════════════════════════════════════════════════════════════════════════════
-- MIGRATION: Chat CS Pasien (komplain/refund) + no schema change needed
-- untuk validasi booking 1 jam sebelumnya (itu logic di aplikasi, bukan DB)
-- ════════════════════════════════════════════════════════════════════════════
-- Jalankan file ini SEKALI di database yang sudah ada (tidak menghapus data lain).
-- Contoh: mysql -u root -p nama_db < migration_cs_chat_and_booking.sql

CREATE TABLE IF NOT EXISTS `cs_tickets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pasien_id` int(11) NOT NULL,
  `appointment_id` int(11) DEFAULT NULL,
  `jenis` enum('refund','komplain') NOT NULL DEFAULT 'komplain',
  `kategori` varchar(100) DEFAULT NULL,
  `deskripsi` text DEFAULT NULL,
  `status` enum('menunggu_approval','aktif','ditutup') NOT NULL DEFAULT 'menunggu_approval',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `closed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `pasien_id` (`pasien_id`),
  KEY `appointment_id` (`appointment_id`),
  CONSTRAINT `cs_tickets_ibfk_1` FOREIGN KEY (`pasien_id`) REFERENCES `pasiens` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cs_tickets_ibfk_2` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

CREATE TABLE IF NOT EXISTS `cs_messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ticket_id` int(11) NOT NULL,
  `sender_role` enum('admin','pasien') NOT NULL,
  `pesan` text NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `ticket_id` (`ticket_id`),
  CONSTRAINT `cs_messages_ibfk_1` FOREIGN KEY (`ticket_id`) REFERENCES `cs_tickets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
