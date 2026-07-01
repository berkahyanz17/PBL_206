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
INSERT INTO `admins` VALUES (1,'admin','$2b$10$H8xaTjO1I50IRYgzNUcCE.bs1F89WaO70KP8r3QJPkhWeMN5Lrj8y',-5022288086,1,1,0);
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

DROP TABLE IF EXISTS `ulasan`;
CREATE TABLE `ulasan` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `appointment_id` int(11) NOT NULL,
  `pasien_id` int(11) NOT NULL,
  `dokter_id` int(11) NOT NULL,
  `bintang` tinyint(1) NOT NULL,
  `komentar` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `appointment_id` (`appointment_id`),
  KEY `pasien_id` (`pasien_id`),
  KEY `dokter_id` (`dokter_id`),
  CONSTRAINT `ulasan_ibfk_1` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ulasan_ibfk_2` FOREIGN KEY (`pasien_id`) REFERENCES `pasiens` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ulasan_ibfk_3` FOREIGN KEY (`dokter_id`) REFERENCES `dokters` (`id`) ON DELETE CASCADE,
  CONSTRAINT `bintang_check` CHECK (`bintang` BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

DROP TABLE IF EXISTS `chats`;
CREATE TABLE `chats` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sender_role` enum('admin','dokter') DEFAULT NULL,
  `sender_id` int(11) DEFAULT NULL,
  `receiver_role` enum('admin','dokter') DEFAULT NULL,
  `receiver_id` int(11) DEFAULT NULL,
  `pesan` text DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `file_url` varchar(255) DEFAULT NULL,
  `file_type` varchar(20) DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
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
  `last_active` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `no_str` (`no_str`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

LOCK TABLES `dokters` WRITE;
INSERT INTO `dokters` VALUES
(1,'dr. Kuro Tetsuro','kuro@gmail.com','$2b$10$H8xaTjO1I50IRYgzNUcCE.bs1F89WaO70KP8r3QJPkhWeMN5Lrj8y','Umum','STR-2025-1111',150000,NULL,NULL,NULL,1,1,NULL),
(2,'dr. Ichinose Guren','guren@gmail.com','$2b$10$H8xaTjO1I50IRYgzNUcCE.bs1F89WaO70KP8r3QJPkhWeMN5Lrj8y','Spesialis Dalam','STR-2025-2222',200000,NULL,NULL,NULL,1,1,NULL),
(3,'dr. Dazai Osamu','dazai@gmail.com','$2b$10$H8xaTjO1I50IRYgzNUcCE.bs1F89WaO70KP8r3QJPkhWeMN5Lrj8y','Anak','STR-2025-3333',100000,NULL,NULL,NULL,1,1,NULL),
(4,'dr. Rina Wulandari','rina@gmail.com','$2b$10$H8xaTjO1I50IRYgzNUcCE.bs1F89WaO70KP8r3QJPkhWeMN5Lrj8y','Umum','STR-2025-4444',150000,NULL,NULL,NULL,1,1,NULL),
(5,'dr. Budi Sanjaya','budisanjaya@gmail.com','$2b$10$H8xaTjO1I50IRYgzNUcCE.bs1F89WaO70KP8r3QJPkhWeMN5Lrj8y','Umum','STR-2025-5555',150000,NULL,NULL,NULL,1,1,NULL),
(6,'dr. Sari Handayani','sari@gmail.com','$2b$10$H8xaTjO1I50IRYgzNUcCE.bs1F89WaO70KP8r3QJPkhWeMN5Lrj8y','Spesialis Dalam','STR-2025-6666',200000,NULL,NULL,NULL,1,1,NULL);
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
(3,'Jumat','08:00:00','16:00:00'),
(4,'Senin','08:00:00','16:00:00'),
(4,'Selasa','08:00:00','16:00:00'),
(4,'Rabu','08:00:00','16:00:00'),
(4,'Kamis','08:00:00','16:00:00'),
(4,'Jumat','08:00:00','16:00:00'),
(5,'Senin','08:00:00','16:00:00'),
(5,'Selasa','08:00:00','16:00:00'),
(5,'Rabu','08:00:00','16:00:00'),
(5,'Kamis','08:00:00','16:00:00'),
(5,'Jumat','08:00:00','16:00:00'),
(6,'Senin','08:00:00','16:00:00'),
(6,'Selasa','08:00:00','16:00:00'),
(6,'Rabu','08:00:00','16:00:00'),
(6,'Kamis','08:00:00','16:00:00'),
(6,'Jumat','08:00:00','16:00:00');
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
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

LOCK TABLES `pasiens` WRITE;
INSERT INTO `pasiens` (`id`,`nama`,`email`,`password`,`no_hp`,`nik`,`notif_approve`,`notif_pengingat`) VALUES
(1,'Andi Yohee','andi@gmail.com','$2b$10$H8xaTjO1I50IRYgzNUcCE.bs1F89WaO70KP8r3QJPkhWeMN5Lrj8y','08111111111',NULL,1,1),
(2,'Budiman','budiman@gmail.com','$2b$10$H8xaTjO1I50IRYgzNUcCE.bs1F89WaO70KP8r3QJPkhWeMN5Lrj8y','08222222222',NULL,1,1),
(3,'Megumi Fushiguro','megumi@gmail.com','$2b$10$H8xaTjO1I50IRYgzNUcCE.bs1F89WaO70KP8r3QJPkhWeMN5Lrj8y','08333333333',NULL,1,1),
(4,'Budi','budi@gmail.com','$2b$10$H8xaTjO1I50IRYgzNUcCE.bs1F89WaO70KP8r3QJPkhWeMN5Lrj8y','d713a3fdb6bbad8f6b8176bb:0cac1e23023ed23d4d9abf3f87693efa:be2d8caf3474a8bd3ef1db92','e8dde9d0430e07e393f24b1b:27ac46104eeb6f5b0049793adae08ef3:b57fb6cbadc0dc96418ec706ff85e4e3',1,1),
(5,'Haji','haji@gmail.com','$2b$10$H8xaTjO1I50IRYgzNUcCE.bs1F89WaO70KP8r3QJPkhWeMN5Lrj8y','e3273737ce259b0316fa608a:aff30d2d58b3e0902888b837b50f36fb:45a7cb046e42415e0709568a','c0fdd9de3b0f9b080d81721e:8399f79132327d0de8618c978d7b2516:57a35e68f5689adb2dc906bf647d69a3',1,1),
(6,'Wulan','wulan@gmail.com','$2b$10$H8xaTjO1I50IRYgzNUcCE.bs1F89WaO70KP8r3QJPkhWeMN5Lrj8y','301be0ab1d26e41960394a90:b91e5680a7e549e6ca9a98847c60f2e3:f840e0c8e88d97fabdffc6bb','17241aa4af19612ea7251418:bc5058245c2d88926bd313f5ac260588:36920c1159f5b81910bd7cf3bc5e8c18',1,1),
(7,'Andi Saputra','andisaputra@gmail.com','$2b$10$H8xaTjO1I50IRYgzNUcCE.bs1F89WaO70KP8r3QJPkhWeMN5Lrj8y','4a4cd0b525aa28e6a3a14f62:3241dd1b9eced9aea063d3b77ae3622f:613561a82cc4c68f85a3f240','07179dacd0cfc99200b08ef7:ae20861ce0e667cfe3cbf8acdbb1c603:6b3223904968679e85a852a4603ac34f',1,1),
(8,'Rina Dewi','rinadewi@gmail.com','$2b$10$H8xaTjO1I50IRYgzNUcCE.bs1F89WaO70KP8r3QJPkhWeMN5Lrj8y','676741d7e47ba7532773a5bf:536e6c82a85792faeecea271889cc5d8:4059cb79d431cca469cdf3fb','a50f8f38e2e87f733285f2ca:e22005b4ae5c14965245a77ddd2a7a3c:fcbf93076571c9ab1370d139d1a088ad',1,1),
(9,'Fajar Nugroho','fajarnugroho@gmail.com','$2b$10$H8xaTjO1I50IRYgzNUcCE.bs1F89WaO70KP8r3QJPkhWeMN5Lrj8y','1bbb2516b48bf613537d40c1:c1a50dfa6cb0b27a227cbd53bb596e3d:a00cc97c4b783c37d1caf774','b3169445c92b6eccd3b59a8e:ea7bea482de2b572dfa2e0d64df39eb3:44e7a8c25569edd1a5ce83c05bd646a0',1,1),
(10,'Rina Kartika','rinakartika@gmail.com','$2b$10$H8xaTjO1I50IRYgzNUcCE.bs1F89WaO70KP8r3QJPkhWeMN5Lrj8y','8b9b9f7cfff4b72a4ad96201:267dbdadbef1e994ac7e866c19bbe37e:768647798212824a99c40ccd','a25382c2b9295f7a5f37d3ce:b8723935dc9c321cc84c6d43d682a662:003fac7e471210d603f8579e59eaf718',1,1),
(11,'Teguh Prasetyo','teguhprasetyo@gmail.com','$2b$10$H8xaTjO1I50IRYgzNUcCE.bs1F89WaO70KP8r3QJPkhWeMN5Lrj8y','f496fc43a879648997d79003:c699842f297f27808249cb3301485acc:ea4e565537a10072edf4cf3b','ee9ed66a7fbac6d545f4e61c:25af0cc2f1cfaba7480d4280868f19d7:3da3b07d6d1c9354de99c8069115f275',1,1),
(12,'Ron Kamonohashi','ron@gmail.com','$2b$10$H8xaTjO1I50IRYgzNUcCE.bs1F89WaO70KP8r3QJPkhWeMN5Lrj8y','c613ebc0d636f8372cc276df:672750c72f0aa4ada1fc8897cebfb93d:d5f22d2ebb50b79c6bcefb48','990c11369fad13f643e1cb89:6e13064fb72648d5e48639b9d4b27304:e0317763b6b834df8bfddb7fc66060cd',1,1),
(13,'Natsuki Seba','natsuki@gmail.com','$2b$10$H8xaTjO1I50IRYgzNUcCE.bs1F89WaO70KP8r3QJPkhWeMN5Lrj8y','85819816122d633b6f422ab7:81c1faba6e7e772dbf039de5868c0b15:0549ed1bc781fa0021942ff0','29aaf9096229a9e4f0ffa4fb:28600962c6262aea6c351aa2f94ff01e:46b9757bd9ef67326df7b840710763ca',1,1);
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
-- DEMO DATA: appointments, rekam_medis, chats, notifications
-- Supaya dashboard admin/dokter/pasien tidak kosong saat pertama dijalankan
-- ════════════════════════════════════════════════════════════════════════════

LOCK TABLES `appointments` WRITE;
INSERT INTO `appointments` (`id`,`pasien_id`,`dokter_id`,`keluhan`,`tgl`,`jam`,`status`) VALUES
(1,4,1,'Sakit kepala','2026-05-30','09:00:00','selesai'),
(2,6,1,'Check up rutin','2026-05-30','10:00:00','dikonfirmasi'),
(3,6,1,'Check up rutin','2026-05-30','11:00:00','menunggu'),
(4,5,1,'Demam 3 hari','2026-05-30','10:00:00','menunggu'),
(5,7,4,'Sakit kepala','2026-05-24','15:00:00','menunggu'),
(6,4,1,'Pusing, mual','2026-05-25','09:00:00','menunggu'),
(7,3,1,'Muntah, batuk pilek','2026-05-24','13:30:00','dikonfirmasi'),
(8,13,2,'Check up rutin','2026-05-22','10:00:00','selesai'),
(9,8,5,'Demam','2026-05-28','11:00:00','selesai'),
(10,6,6,'Check up rutin','2026-05-25','09:30:00','selesai'),
(11,1,1,'Batuk pilek','2026-05-20','09:00:00','selesai'),
(12,2,2,'Alergi kulit','2026-05-18','13:00:00','selesai'),
(13,3,3,'Imunisasi anak','2026-05-19','10:30:00','selesai'),
(14,5,3,'Demam pada anak','2026-05-21','11:00:00','selesai'),
(15,7,4,'Konsultasi umum','2026-05-17','14:00:00','selesai'),
(16,9,4,'Sakit maag','2026-05-23','09:30:00','selesai'),
(17,10,5,'Nyeri sendi','2026-05-26','15:30:00','selesai'),
(18,11,6,'Kontrol tekanan darah','2026-05-27','10:00:00','selesai');
UNLOCK TABLES;

LOCK TABLES `rekam_medis` WRITE;
INSERT INTO `rekam_medis` (`id`,`appointment_id`,`diagnosa`,`resep`,`catatan`) VALUES
(1,1,'Sakit Kepala','Paracetamol 500mg x1','Kondisi baik, tekanan darah normal'),
(2,4,'Demam','Paracetamol 3x1','Diberi obat parasetamol 3x1'),
(3,2,'Check up Rutin','Vitamin C 1x1','Semua hasil lab dalam batas normal'),
(4,9,'Demam','Paracetamol 3x1','Diberi obat parasetamol 3x1'),
(5,10,'Check up Rutin','Vitamin C 1x1','Kondisi baik, tekanan darah normal 120/80');
UNLOCK TABLES;

LOCK TABLES `chats` WRITE;
INSERT INTO `chats` (`sender_role`,`sender_id`,`receiver_role`,`receiver_id`,`pesan`) VALUES
('dokter',4,'admin',1,'Nyam nyam'),
('dokter',5,'admin',1,'Yehoo'),
('dokter',6,'admin',1,'Saya bisanya jam segini'),
('admin',1,'dokter',6,'Baik dok, terima kasih infonya');
UNLOCK TABLES;

-- ════════════════════════════════════════════════════════════════════════════
-- SEED DATA: ulasan (rating & review pasien untuk dokter)
-- Setiap dokter dapat 2 ulasan dari appointment yang sudah 'selesai'
-- ════════════════════════════════════════════════════════════════════════════
LOCK TABLES `ulasan` WRITE;
INSERT INTO `ulasan` (`appointment_id`,`pasien_id`,`dokter_id`,`bintang`,`komentar`) VALUES
(1,4,1,5,'Dokternya ramah dan penjelasannya sangat jelas!'),
(11,1,1,4,'Pelayanan cepat, ruang tunggu nyaman.'),
(8,13,2,5,'Sangat profesional, diagnosanya tepat.'),
(12,2,2,4,'Konsultasinya detail, obatnya cocok.'),
(13,3,3,5,'Dokter anak yang sabar, anak saya jadi tidak takut.'),
(14,5,3,5,'Penjelasan mudah dipahami orang tua.'),
(15,7,4,4,'Baik dan komunikatif.'),
(16,9,4,5,'Diagnosanya akurat, cepat sembuh.'),
(9,8,5,4,'Pelayanan bagus, antriannya cepat.'),
(17,10,5,5,'Sangat membantu, terima kasih dok.'),
(10,6,6,5,'Kondisi saya jadi jauh lebih baik.'),
(18,11,6,4,'Ramah dan informatif.');
UNLOCK TABLES;

LOCK TABLES `notifications` WRITE;
INSERT INTO `notifications` (`role`,`user_id`,`icon`,`icon_color`,`text`,`time`,`is_read`) VALUES
('admin',1,'👤','orange','Pasien baru mendaftar: Rina Kartika','13.45',0),
('admin',1,'📅','blue','Booking baru masuk dari Budiman ke dr. Kuro','13.30',0),
('admin',1,'👤','orange','Pasien baru mendaftar: Teguh Prasetyo','12.50',0),
('admin',1,'📅','blue','Booking baru masuk dari Megumi ke dr. Ichinose','11.20',1);
UNLOCK TABLES;

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
  ('klinik_jam_buka',   'Senin–Jumat 08.00–17.00, Sabtu 08.00–13.00','Jam Operasional',        'umum'),
  ('klinik_telepon',    '(021) 1234-5678',                            'Nomor Telepon',          'kontak'),
  ('klinik_email',      'info@healthsync.web.id',                     'Email Klinik',           'kontak'),
  ('klinik_whatsapp',   '08xx-xxxx-xxxx',                             'WhatsApp',               'kontak'),
  ('mamoru_greeting',   'Halo! Saya Mamoru, asisten virtual HealthSync Clinic. Ada yang bisa saya bantu?', 'Sapaan Mamoru', 'mamoru'),
  ('mamoru_darurat_msg','Untuk kondisi darurat, segera hubungi IGD terdekat atau hubungi klinik kami.', 'Pesan Darurat Mamoru', 'mamoru'),
  ('mamoru_context_extra', '', 'Konteks Tambahan untuk Mamoru (opsional)', 'mamoru')
ON DUPLICATE KEY UPDATE `key` = `key`; -- idempotent, aman dijalankan ulang

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
