CREATE DATABASE IF NOT EXISTS db_praktikum;
USE db_praktikum;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL
);

ALTER TABLE users ADD COLUMN email VARCHAR(255) UNIQUE;
-- atau langsung di CREATE TABLE-nya tambah kolom email

CREATE TABLE IF NOT EXISTS password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  used TINYINT(1) DEFAULT 0
);

INSERT INTO users (username, password, email) VALUES ('berkah', 'berkah', 'berkahyanuarzulhiansyah@gmail.com');
