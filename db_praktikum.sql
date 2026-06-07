-- HealthSync Clinic Database Schema

CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS dokters (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE,
  password VARCHAR(255) NOT NULL,
  spesialis VARCHAR(100),
  no_str VARCHAR(100) UNIQUE,
  harga INT,
  bio TEXT,
  foto VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS pasiens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE,
  password VARCHAR(255) NOT NULL,
  no_hp VARCHAR(20),
  nik VARCHAR(20),
  tgl_lahir DATE,
  gender ENUM('Laki-laki','Perempuan'),
  alamat TEXT,
  riwayat_penyakit TEXT,
  alergi TEXT,
  foto VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pasien_id INT,
  dokter_id INT,
  keluhan TEXT,
  tgl DATE,
  jam TIME,
  status ENUM('menunggu','dikonfirmasi','selesai','ditolak') DEFAULT 'menunggu',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pasien_id) REFERENCES pasiens(id) ON DELETE CASCADE,
  FOREIGN KEY (dokter_id) REFERENCES dokters(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS rekam_medis (
  id INT AUTO_INCREMENT PRIMARY KEY,
  appointment_id INT,
  diagnosa TEXT,
  resep TEXT,
  catatan TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS jadwal_dokter (
  id INT AUTO_INCREMENT PRIMARY KEY,
  dokter_id INT,
  hari ENUM('Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'),
  jam_mulai TIME,
  jam_selesai TIME,
  FOREIGN KEY (dokter_id) REFERENCES dokters(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS chats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sender_role ENUM('admin','dokter'),
  sender_id INT,
  receiver_role ENUM('admin','dokter'),
  receiver_id INT,
  pesan TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255),
  token VARCHAR(255),
  expires_at DATETIME,
  used TINYINT(1) DEFAULT 0
);

-- Seed: Admin default
-- password: admin123 (bcrypt hash)
INSERT IGNORE INTO admins (username, password) VALUES (
  'admin',
  '$2b$10$S8CIXcEMu6SfDh1tjeYw1OkVmCFc71AhVxZw3V1u7WYi.EBGSq/Fa'
);
