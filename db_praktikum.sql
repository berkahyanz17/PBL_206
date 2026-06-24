/*M!999999\- enable the sandbox mode */ 
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;

DROP TABLE IF EXISTS `admins`;
CREATE TABLE `admins` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `telegram_chat_id` varchar(100) DEFAULT NULL,
  `notif_pasien_baru` tinyint(1) DEFAULT 1,
  `notif_appointment` tinyint(1) DEFAULT 1,
  `notif_chat_dokter` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

LOCK TABLES `admins` WRITE;
INSERT INTO `admins` VALUES (1,'admin','$2b$10$S8CIXcEMu6SfDh1tjeYw1OkVmCFc71AhVxZw3V1u7WYi.EBGSq/Fa',-5022288086,1,1,0);
UNLOCK TABLES;

DROP TABLE IF EXISTS `appointments`;
CREATE TABLE `appointments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pasien_id` int(11) DEFAULT NULL,
  `dokter_id` int(11) DEFAULT NULL,
  `keluhan` text DEFAULT NULL,
  `tgl` date DEFAULT NULL,
  `jam` time DEFAULT NULL,
  `status` enum('menunggu','dikonfirmasi','selesai','ditolak') DEFAULT 'menunggu',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `pasien_id` (`pasien_id`),
  KEY `dokter_id` (`dokter_id`),
  CONSTRAINT `appointments_ibfk_1` FOREIGN KEY (`pasien_id`) REFERENCES `pasiens` (`id`) ON DELETE CASCADE,
  CONSTRAINT `appointments_ibfk_2` FOREIGN KEY (`dokter_id`) REFERENCES `dokters` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

DROP TABLE IF EXISTS `chats`;
CREATE TABLE `chats` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sender_role` enum('admin','dokter') DEFAULT NULL,
  `sender_id` int(11) DEFAULT NULL,
  `receiver_role` enum('admin','dokter') DEFAULT NULL,
  `receiver_id` int(11) DEFAULT NULL,
  `pesan` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

DROP TABLE IF EXISTS `dokters`;
CREATE TABLE `dokters` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nama` varchar(100) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `spesialis` varchar(100) DEFAULT NULL,
  `no_str` varchar(100) DEFAULT NULL,
  `harga` int(11) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `foto` varchar(255) DEFAULT NULL,
  `telegram_chat_id` varchar(100) DEFAULT NULL,
  `notif_chat_admin` tinyint(1) DEFAULT 1,
  `notif_appointment` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `no_str` (`no_str`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

LOCK TABLES `dokters` WRITE;
INSERT INTO `dokters` VALUES
(1,'dr. Kuro Tetsuro','kuro@klinik.com','$2b$10$S8CIXcEMu6SfDh1tjeYw1OkVmCFc71AhVxZw3V1u7WYi.EBGSq/Fa','Umum','STR-2025-1111',150000,NULL,NULL,NULL,1,1),
(2,'dr. Ichinose Guren','guren@klinik.com','$2b$10$S8CIXcEMu6SfDh1tjeYw1OkVmCFc71AhVxZw3V1u7WYi.EBGSq/Fa','Spesialis Dalam','STR-2025-2222',200000,NULL,NULL,NULL,1,1),
(3,'dr. Dazai Osamu','dazai@klinik.com','$2b$10$S8CIXcEMu6SfDh1tjeYw1OkVmCFc71AhVxZw3V1u7WYi.EBGSq/Fa','Anak','STR-2025-3333',100000,NULL,NULL,NULL,1,1);
UNLOCK TABLES;

DROP TABLE IF EXISTS `jadwal_dokter`;
CREATE TABLE `jadwal_dokter` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `dokter_id` int(11) DEFAULT NULL,
  `hari` enum('Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu') DEFAULT NULL,
  `jam_mulai` time DEFAULT NULL,
  `jam_selesai` time DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `dokter_id` (`dokter_id`),
  CONSTRAINT `jadwal_dokter_ibfk_1` FOREIGN KEY (`dokter_id`) REFERENCES `dokters` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- Default jadwal praktik untuk semua dokter: Senin s/d Jumat, 08:00 - 16:00
LOCK TABLES `jadwal_dokter` WRITE;
INSERT INTO `jadwal_dokter` (`dokter_id`, `hari`, `jam_mulai`, `jam_selesai`) VALUES
(1,'Senin','08:00:00','16:00:00'),
(1,'Selasa','08:00:00','16:00:00'),
(1,'Rabu','08:00:00','16:00:00'),
(1,'Kamis','08:00:00','16:00:00'),
(1,'Jumat','08:00:00','16:00:00'),
(2,'Senin','08:00:00','16:00:00'),
(2,'Selasa','08:00:00','16:00:00'),
(2,'Rabu','08:00:00','16:00:00'),
(2,'Kamis','08:00:00','16:00:00'),
(2,'Jumat','08:00:00','16:00:00'),
(3,'Senin','08:00:00','16:00:00'),
(3,'Selasa','08:00:00','16:00:00'),
(3,'Rabu','08:00:00','16:00:00'),
(3,'Kamis','08:00:00','16:00:00'),
(3,'Jumat','08:00:00','16:00:00');
UNLOCK TABLES;

DROP TABLE IF EXISTS `pasiens`;
CREATE TABLE `pasiens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nama` varchar(100) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `no_hp` TEXT DEFAULT NULL,
  `nik` TEXT DEFAULT NULL,
  `tgl_lahir` date DEFAULT NULL,
  `gender` enum('Laki-laki','Perempuan') DEFAULT NULL,
  `alamat` text DEFAULT NULL,
  `riwayat_penyakit` text DEFAULT NULL,
  `alergi` text DEFAULT NULL,
  `foto` varchar(255) DEFAULT NULL,
  `notif_approve` tinyint(1) DEFAULT 1,
  `notif_pengingat` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

LOCK TABLES `pasiens` WRITE;
INSERT INTO `pasiens` VALUES
(1,'Andi Yohee','andi@gmail.com','$2b$10$S8CIXcEMu6SfDh1tjeYw1OkVmCFc71AhVxZw3V1u7WYi.EBGSq/Fa','08111111111',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,1),
(2,'Budiman','budiman@gmail.com','$2b$10$S8CIXcEMu6SfDh1tjeYw1OkVmCFc71AhVxZw3V1u7WYi.EBGSq/Fa','08222222222',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,1),
(3,'Megumi Fushiguro','megumi@gmail.com','$2b$10$S8CIXcEMu6SfDh1tjeYw1OkVmCFc71AhVxZw3V1u7WYi.EBGSq/Fa','08333333333',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,1);
UNLOCK TABLES;

DROP TABLE IF EXISTS `password_resets`;
CREATE TABLE `password_resets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) DEFAULT NULL,
  `token` varchar(255) DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL,
  `used` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

DROP TABLE IF EXISTS `rekam_medis`;
CREATE TABLE `rekam_medis` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `appointment_id` int(11) DEFAULT NULL,
  `diagnosa` text DEFAULT NULL,
  `resep` text DEFAULT NULL,
  `catatan` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `appointment_id` (`appointment_id`),
  CONSTRAINT `rekam_medis_ibfk_1` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `role` enum('admin','dokter','pasien') NOT NULL,
  `user_id` int(11) NOT NULL,
  `icon` varchar(10) NOT NULL,
  `icon_color` varchar(20) NOT NULL,
  `text` text NOT NULL,
  `time` varchar(50) NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_role_user` (`role`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- ════════════════════════════════════════════════════════════════════════════
-- MIGRATION: Tambah tabel klinik_settings untuk Mamoru context
-- Jalankan sekali di DB yang sudah ada, ATAU tambahkan ke db_praktikum.sql
-- sebelum 'docker compose down -v && up --build'
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS `klinik_settings` (
  `id`            int(11) NOT NULL AUTO_INCREMENT,
  `key`           varchar(100) NOT NULL,
  `value`         text DEFAULT NULL,
  `label`         varchar(150) DEFAULT NULL,   -- label tampilan di admin
  `kategori`      varchar(50) DEFAULT 'umum',  -- umum | kontak | mamoru
  PRIMARY KEY (`id`),
  UNIQUE KEY `key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- Seed data default — admin bisa edit via halaman Settings
INSERT INTO `klinik_settings` (`key`, `value`, `label`, `kategori`) VALUES
  ('klinik_nama',       'HealthSync Clinic',                          'Nama Klinik',            'umum'),
  ('klinik_alamat',     'Jl. Sehat No. 1, Kota Sehat',               'Alamat',                 'umum'),
  ('klinik_jam_buka',   'Senin–Jumat 08.00–16.00, Sabtu 08.00–13.00','Jam Operasional',        'umum'),
  ('klinik_telepon',    '(021) 1234-5678',                            'Nomor Telepon',          'kontak'),
  ('klinik_email',      'info@healthsync.web.id',                         'Email Klinik',           'kontak'),
  ('klinik_whatsapp',   '08xx-xxxx-xxxx',                             'WhatsApp',               'kontak'),
  ('mamoru_greeting',   'Halo! Saya Mamoru, asisten virtual HealthSync Clinic. Ada yang bisa saya bantu?', 'Sapaan Mamoru', 'mamoru'),
  ('mamoru_darurat_msg','Untuk kondisi darurat, segera hubungi IGD terdekat atau hubungi klinik kami.', 'Pesan Darurat Mamoru', 'mamoru'),
  ('mamoru_context_extra', '', 'Konteks Tambahan untuk Mamoru (opsional)', 'mamoru')
ON DUPLICATE KEY UPDATE `key` = `key`; -- idempotent, aman dijalankan ulang

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
