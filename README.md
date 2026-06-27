# PBL_206
Secure Mini Enterprise Infrastructure Deployment

ssh dari wsl ke vm server
```
ssh -i /mnt/d/TLID_SSH_KEY/tlid -p 2223 berkah@192.168.56.105
# atau
ssh -i ~/.ssh/tlid -p 2223 berkah@192.168.56.105
```
fitur cepat update dari github + jalanin server
```
git pull --rebase && docker compose down && docker compose up --build -d
```
akses ke database mariadb
```
docker exec -it db-stack-db-1 mariadb -u root -p
```
akses ke browser
```
https://192.168.56.105
```
nambahin fitur dari vm server
```
git add .
git commit -m "PESAN_BUAT COMMIT"
git pull --rebase
git push
```
ambil update dari github
```
git pull --rebase
```
jalanin server
```
docker compose up -d
```
jalanin server + build
```
docker compose up --build -d
```
matiin server
```
docker compose down
```
matiin server + reset database
```
docker compose down -v
```
migrasi data lama ke data terenkripsi
```
docker exec -it pbl_206-server-1 node migrate_encrypt_existing.js
```
Trivy scan latest cve vulnerability
```
# Check images name
docker images

# Install trivy if not already
sudo curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sudo sh -s -- -b /usr/local/bin

# Scan
trivy image pbl_206-server:latest
trivy image pbl_206-client:latest
```
# HealthSync Clinic

Frontend-only React app served by Nginx via Docker.

## URL Structure

```
/                          → Role Picker
/admin/login
/admin/dashboard
/admin/appointments
/admin/dokter
/admin/pasien
/admin/chat

/dokter/login
/dokter/lupa-password
/dokter/jadwal
/dokter/riwayat
/dokter/rekam-medis
/dokter/kelola-jadwal
/dokter/chat
/dokter/profil

/pasien/login
/pasien/daftar
/pasien/lupa-password
/pasien/reset-password
/pasien/home
/pasien/cari-dokter
/pasien/riwayat
/pasien/profil
```

## Setup & Run

### 1. Install & Build React

```bash
cd client
npm install
npm run build
cd ..
```

### 2. Run with Docker

```bash
docker-compose up -d
```

Site is now accessible at **http://<your-ip>** (port 80).

### 3. Dev Mode (optional, no Docker needed)

```bash
cd client
npm run dev
```

Opens at http://localhost:5173
