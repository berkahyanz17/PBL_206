CREATE DATABASE IF NOT EXISTS db_praktikum;
USE db_praktikum;
 
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    role ENUM('admin','dokter','pasien') NOT NULL DEFAULT 'pasien'
);
 
CREATE TABLE IF NOT EXISTS password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  used TINYINT(1) DEFAULT 0
);
 
INSERT INTO users (username, password, email, role) VALUES
  ('admin', 'admin123', 'admin@healthsync.com', 'admin'),
  ('dokter', 'dokter123', 'dokter@healthsync.com', 'dokter'),
  ('berkah', 'berkah', 'berkahyanuarzulhiansyah@gmail.com', 'pasien');
 
