# PBL_206
Secure Mini Enterprise Infrastructure Deployment

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
