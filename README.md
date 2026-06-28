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

Full stack app of a clinic website

## URL Structure

```
/                          → Role Picker
/admin/login
/admin/dashboard
/admin/appointments
/admin/dokter
/admin/pasien
/admin/chat
/admin/settings

/dokter/login
/dokter/lupa-password
/dokter/jadwal
/dokter/riwayat
/dokter/rekam-medis
/dokter/kelola-jadwal
/dokter/chat
/dokter/profil
/dokter/settings

/pasien/login
/pasien/daftar
/pasien/lupa-password
/pasien/reset-password
/pasien/home
/pasien/cari-dokter
/pasien/riwayat
/pasien/profil
/pasien/settings
```

## Project Structure

```
berkah@uiserver:~/PBL_206$ tree
.
├── backup.sh
├── client
│   ├── dist
│   ├── Dockerfile
│   ├── index.html
│   ├── nginx.conf
│   ├── package.json
│   ├── src
│   │   ├── App.jsx
│   │   ├── components
│   │   │   ├── AdminSidebar.jsx
│   │   │   ├── DokterSidebar.jsx
│   │   │   ├── NotifPopup.jsx
│   │   │   ├── PasienSidebar.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── index.css
│   │   ├── main.jsx
│   │   ├── pages
│   │   │   ├── admin
│   │   │   │   ├── Appointments.jsx
│   │   │   │   ├── Chat.jsx
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── Dokter.jsx
│   │   │   │   ├── KlinikSettings.jsx
│   │   │   │   ├── Login.jsx
│   │   │   │   ├── Pasien.jsx
│   │   │   │   └── Settings.jsx
│   │   │   ├── dokter
│   │   │   │   ├── Chat.jsx
│   │   │   │   ├── Jadwal.jsx
│   │   │   │   ├── KelolaJadwal.jsx
│   │   │   │   ├── Login.jsx
│   │   │   │   ├── LupaPassword.jsx
│   │   │   │   ├── Profil.jsx
│   │   │   │   ├── RekamMedis.jsx
│   │   │   │   ├── Riwayat.jsx
│   │   │   │   └── Settings.jsx
│   │   │   ├── Index.jsx
│   │   │   └── pasien
│   │   │       ├── CariDokter.jsx
│   │   │       ├── Daftar.jsx
│   │   │       ├── Home.jsx
│   │   │       ├── Login.jsx
│   │   │       ├── LupaPassword.jsx
│   │   │       ├── Mamoruchat.jsx
│   │   │       ├── Profil.jsx
│   │   │       ├── ResetPassword.jsx
│   │   │       ├── Riwayat.jsx
│   │   │       └── Settings.jsx
│   │   └── utils
│   │       └── api.js
│   └── vite.config.js
├── db_praktikum.sql
├── docker-compose.yml
├── env.example
├── healthsync_final.html
├── healthsync-tls-tutorial.md
├── MonitorPBL206.ps1
├── nginx
│   └── nginx.conf
├── README.md
└── server
    ├── backup-strategy.md
    ├── crypto.js
    ├── Dockerfile
    ├── ENKRIPSI_GUIDE.md
    ├── index.js
    ├── migrate_encrypt_existing.js
    └── package.json
12 directories, 58 files
berkah@uiserver:~/PBL_206$
```
