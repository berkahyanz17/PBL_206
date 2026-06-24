# Tutorial: TLS Setup HealthSync Clinic dengan Cloudflare Tunnel

> **Project:** PBL_206 — HealthSync Clinic  
> **Stack:** React/Vite · Express.js · MariaDB · Redis · Nginx · Docker Compose  
> **Domain:** healthsync.web.id  
> **Tujuan:** Mengganti self-signed certificate dengan TLS trusted via Cloudflare Tunnel tanpa IP publik

---

## Daftar Isi

1. [Overview & Persiapan](#1-overview--persiapan)
2. [Beli Domain di DomainEsia](#2-beli-domain-di-domainesia)
3. [Add Domain ke Cloudflare](#3-add-domain-ke-cloudflare)
4. [Ganti Nameserver di DomainEsia](#4-ganti-nameserver-di-domainesia)
5. [Buat Cloudflare API Token](#5-buat-cloudflare-api-token)
6. [Install & Setup Cloudflare Tunnel](#6-install--setup-cloudflare-tunnel)
7. [Jalankan Tunnel sebagai Service](#7-jalankan-tunnel-sebagai-service)
8. [Refactor Docker Compose](#8-refactor-docker-compose)
9. [Refactor Nginx Config](#9-refactor-nginx-config)
10. [Verifikasi](#10-verifikasi)

---

## 1. Overview & Persiapan

### Kondisi Awal

HealthSync Clinic menggunakan self-signed certificate yang di-mount langsung dari host:

```yaml
# docker-compose.yml (lama)
nginx:
  volumes:
    - /etc/ssl/certs/server.crt:/etc/ssl/certs/server.crt:ro
    - /etc/ssl/private/server.key:/etc/ssl/private/server.key:ro
    - /etc/ssl/certs/ca-chain.crt:/etc/ssl/certs/ca-chain.crt:ro
```

Masalah: browser selalu menampilkan warning "Not Secure" karena self-signed cert tidak dipercaya CA publik.

### Solusi: Cloudflare Tunnel

Karena server berjalan di VM lokal tanpa IP publik, solusi yang dipilih adalah **Cloudflare Tunnel**:

```
Browser → https://healthsync.web.id
        → Cloudflare (TLS terminate, cert trusted ✅)
        → Cloudflare Tunnel (encrypted)
        → cloudflared daemon di VM
        → Nginx Docker (port 80)
        → client / server container
```

Keuntungan:
- Tidak perlu IP publik
- Tidak perlu port forwarding
- TLS dihandle Cloudflare (trusted di semua browser)
- Gratis

### Yang Dibutuhkan

- Domain (dibeli di registrar manapun)
- Akun Cloudflare (gratis)
- Server/VM Linux yang menjalankan Docker Compose

---

## 2. Beli Domain di DomainEsia

Beli domain di [domainesia.com](https://domainesia.com). Pilih domain yang sesuai project kamu, misalnya `healthsync.web.id`.

Setelah pembayaran selesai, lanjut ke step berikutnya.

---

## 3. Add Domain ke Cloudflare

### 3.1 Login ke Cloudflare

Buka [dash.cloudflare.com](https://dash.cloudflare.com) → login atau daftar akun baru (gratis).

### 3.2 Tambah Domain

1. Klik **"+ Add"** di pojok kanan atas
2. Pilih **"Add a domain"**
3. Masukkan domain kamu (contoh: `web.id`)
4. Klik **Continue**
5. Pilih plan **Free** → klik **Continue**
6. Cloudflare akan scan DNS records yang ada → klik **Continue**
7. Jika muncul popup **"Add records later"** → klik **Confirm**

### 3.3 Catat Nameserver

Cloudflare akan menampilkan halaman **"Update your nameservers"** dengan 2 nameserver yang di-assign ke akun kamu. Contoh:

```
davina.ns.cloudflare.com
kareem.ns.cloudflare.com
```

> Nameserver kamu mungkin berbeda namanya. Catat keduanya.

---

## 4. Ganti Nameserver di DomainEsia

### 4.1 Login ke DomainEsia

Buka [domainesia.com](https://domainesia.com) → login ke Client Area.

### 4.2 Ubah Nameserver

1. Klik **Domains** → **My Domains**
2. Klik domain kamu → **Manage**
3. Cari menu **Nameservers**
4. Pilih **"Use custom nameservers"**
5. **Hapus** nameserver lama:
   ```
   nsx1.domainesia.com
   nsx2.domainesia.com
   ```
6. **Isi** dengan nameserver Cloudflare kamu:
   ```
   NS 1: davina.ns.cloudflare.com
   NS 2: kareem.ns.cloudflare.com
   ```
7. Klik **Save**

### 4.3 Tunggu Propagasi

Setelah save, balik ke Cloudflare dan klik **"I updated my nameservers"**.

Propagasi DNS biasanya memakan waktu **5–30 menit**. Cloudflare akan mengirim email konfirmasi ke alamat email akun kamu begitu domain aktif.

> Tunggu email dari Cloudflare sebelum lanjut ke step berikutnya.

---

## 5. Buat Cloudflare API Token

> Step ini diperlukan jika kamu ingin menggunakan Let's Encrypt di masa depan. Untuk Cloudflare Tunnel sendiri, token tidak wajib — tapi bagus untuk disiapkan.

### 5.1 Buka Halaman API Tokens

1. Klik **profile icon** (pojok kanan atas) → **My Profile**
2. Pilih tab **API Tokens**
3. Klik **"Create Token"**

### 5.2 Pilih Template

Scroll ke bawah, cari template **"Edit zone DNS"** → klik **"Use template"**.

### 5.3 Konfigurasi Token

- **Token name:** `certbot-healthsync` (atau nama lain yang kamu ingat)
- **Permissions:** `Zone → DNS → Edit` (sudah auto-filled)
- **Zone Resources:**
  - Kolom pertama: `Include`
  - Kolom kedua: `Specific zone`
  - Kolom ketiga: pilih domain kamu dari dropdown

> Dropdown domain hanya akan muncul setelah domain aktif di Cloudflare (setelah step 4 selesai).

Klik **"Continue to summary"** → **"Create Token"**.

### 5.4 Salin Token

Token hanya ditampilkan **sekali**. Salin dan simpan di tempat aman.

### 5.5 Verifikasi Token (Opsional)

```bash
curl -X GET "https://api.cloudflare.com/client/v4/user/tokens/verify" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

Response jika valid:
```json
{
  "result": { "status": "active" },
  "success": true
}
```

---

## 6. Install & Setup Cloudflare Tunnel

Jalankan semua perintah ini di VM/server Linux kamu (bukan di dalam Docker container).

### 6.1 Install `cloudflared`

```bash
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o cloudflared.deb
sudo dpkg -i cloudflared.deb

# Verifikasi instalasi
cloudflared --version
```

### 6.2 Login ke Cloudflare

```bash
cloudflared tunnel login
```

Output akan menampilkan sebuah URL. Buka URL tersebut di browser → pilih domain kamu → klik **Authorize**.

Setelah berhasil, credentials tersimpan otomatis di `~/.cloudflared/cert.pem`.

### 6.3 Buat Tunnel

```bash
cloudflared tunnel create healthsync
```

Output:
```
Tunnel credentials written to /home/berkah/.cloudflared/44586b7d-531c-4f53-8437-2f5a44dbb082.json
Created tunnel healthsync with id 44586b7d-531c-4f53-8437-2f5a44dbb082
```

Catat **UUID** tunnel kamu (bagian `44586b7d-...`).

### 6.4 Buat File Konfigurasi

```bash
nano ~/.cloudflared/config.yml
```

Isi dengan:

```yaml
tunnel: <UUID-tunnel-kamu>
credentials-file: /home/<username>/.cloudflared/<UUID-tunnel-kamu>.json

ingress:
  - hostname: healthsync.web.id
    service: http://localhost:80
  - service: http_status:404
```

Ganti `<UUID-tunnel-kamu>` dan `<username>` dengan nilai yang sesuai. Contoh:

```yaml
tunnel: 44586b7d-531c-4f53-8437-2f5a44dbb082
credentials-file: /home/berkah/.cloudflared/44586b7d-531c-4f53-8437-2f5a44dbb082.json

ingress:
  - hostname: healthsync.web.id
    service: http://localhost:80
  - service: http_status:404
```

### 6.5 Buat DNS Record (CNAME Otomatis)

```bash
cloudflared tunnel route dns healthsync healthsync.web.id
```

Output:
```
Added CNAME healthsync.web.id which will route to this tunnel tunnelID=44586b7d-...
```

Perintah ini otomatis membuat CNAME record di Cloudflare DNS yang mengarahkan `healthsync.web.id` ke tunnel kamu.

### 6.6 Test Tunnel (Foreground)

```bash
cloudflared tunnel run healthsync
```

Jika berhasil, akan muncul log seperti:
```
INF Registered tunnel connection connIndex=0 ... location=cgk01 protocol=quic
INF Registered tunnel connection connIndex=1 ... location=sin22 protocol=quic
```

Tekan `Ctrl+C` untuk stop setelah memastikan tunnel berjalan.

---

## 7. Jalankan Tunnel sebagai Service

Agar tunnel otomatis berjalan saat boot, install sebagai systemd service.

### 7.1 Copy Config ke System Path

```bash
sudo mkdir -p /etc/cloudflared

sudo cp ~/.cloudflared/config.yml /etc/cloudflared/config.yml
sudo cp ~/.cloudflared/<UUID>.json /etc/cloudflared/
sudo cp ~/.cloudflared/cert.pem /etc/cloudflared/
```

### 7.2 Update Path di Config

```bash
sudo nano /etc/cloudflared/config.yml
```

Ubah `credentials-file` agar mengarah ke path sistem:

```yaml
tunnel: 44586b7d-531c-4f53-8437-2f5a44dbb082
credentials-file: /etc/cloudflared/44586b7d-531c-4f53-8437-2f5a44dbb082.json

ingress:
  - hostname: healthsync.web.id
    service: http://localhost:80
  - service: http_status:404
```

### 7.3 Install & Enable Service

```bash
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared

# Cek status
sudo systemctl status cloudflared
```

Output yang diharapkan:
```
● cloudflared.service - cloudflared
   Active: active (running) since ...
```

---

## 8. Refactor Docker Compose

Edit `docker-compose.yml` di project HealthSync kamu.

### Sebelum (bagian nginx):

```yaml
nginx:
  image: nginx:alpine
  restart: unless-stopped
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro
    - /etc/ssl/certs/server.crt:/etc/ssl/certs/server.crt:ro
    - /etc/ssl/private/server.key:/etc/ssl/private/server.key:ro
    - /etc/ssl/certs/ca-chain.crt:/etc/ssl/certs/ca-chain.crt:ro
```

### Sesudah:

```yaml
nginx:
  image: nginx:alpine
  restart: unless-stopped
  ports:
    - "80:80"
  volumes:
    - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro
  depends_on:
    server:
      condition: service_healthy
    client:
      condition: service_started
  networks:
    - frontend
    - backend
```

Perubahan:
- Hapus port `443:443`
- Hapus 3 baris mount SSL certificate

---

## 9. Refactor Nginx Config

Edit `nginx/nginx.conf`. Ganti seluruh isinya dengan konfigurasi berikut yang menghapus SSL block dan mempertahankan semua security config.

```nginx
limit_req_zone $binary_remote_addr zone=api:10m    rate=60r/m;
limit_req_zone $binary_remote_addr zone=auth:10m   rate=5r/m;
limit_req_zone $binary_remote_addr zone=upload:10m rate=10r/m;

server {
    listen 80;
    server_name healthsync.web.id;

    # Security headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options           "DENY"                                         always;
    add_header X-Content-Type-Options    "nosniff"                                      always;
    add_header X-XSS-Protection          "1; mode=block"                                always;
    add_header Referrer-Policy           "strict-origin-when-cross-origin"              always;
    add_header Permissions-Policy        "geolocation=(), microphone=(), camera=()"     always;
    add_header Content-Security-Policy   "default-src 'self'; script-src 'self' https://js.hcaptcha.com https://newassets.hcaptcha.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://newassets.hcaptcha.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://newassets.hcaptcha.com https://*.hcaptcha.com; connect-src 'self' https://api2.hcaptcha.com https://sentry.hcaptcha.com https://*.hcaptcha.com https://*.w.hcaptcha.com; frame-src https://newassets.hcaptcha.com; frame-ancestors 'none';" always;

    client_max_body_size 10M;
    server_tokens        off;

    resolver 127.0.0.11 valid=30s;

    set $backend  http://server:3001;
    set $frontend http://client:80;

    # Frontend
    location / {
        proxy_pass         $frontend;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $http_x_forwarded_proto;
        proxy_hide_header  X-Powered-By;
    }

    # Auth endpoints (rate limit ketat)
    location ~* ^/api/(login|register|forgot-password|reset-password) {
        limit_req  zone=auth burst=3 nodelay;
        proxy_pass         $backend;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $http_x_forwarded_proto;
        proxy_hide_header  X-Powered-By;
    }

    # Upload endpoint
    location /api/upload {
        limit_req  zone=upload burst=5 nodelay;
        client_max_body_size 10M;
        proxy_pass         $backend;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $http_x_forwarded_proto;
        proxy_set_header   Authorization     $http_authorization;
        proxy_read_timeout 60s;
    }

    # General API
    location /api/ {
        limit_req  zone=api burst=30 nodelay;
        proxy_pass         $backend;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $http_x_forwarded_proto;
        proxy_set_header   Authorization     $http_authorization;
        proxy_hide_header  X-Powered-By;
        proxy_connect_timeout 10s;
        proxy_read_timeout    30s;
        proxy_send_timeout    30s;
    }

    # Static uploads
    location /uploads/ {
        location ~* \.(php|js|sh|py|pl|cgi)$ {
            deny all;
        }
        proxy_pass        $backend;
        proxy_set_header  Host      $host;
        proxy_set_header  X-Real-IP $remote_addr;
        add_header X-Content-Type-Options "nosniff"   always;
        add_header Content-Disposition    "attachment" always;
    }

    # Health check (internal only)
    location /health {
        allow 172.0.0.0/8;
        deny  all;
        proxy_pass $backend;
    }

    # Blokir akses ke hidden files
    location ~ /\. {
        deny all;
        return 404;
    }
}
```

> **Penting:** `$scheme` diganti dengan `$http_x_forwarded_proto` pada semua `proxy_set_header X-Forwarded-Proto`. Ini penting agar Express.js mengetahui bahwa request aslinya HTTPS dari Cloudflare, bukan HTTP dari tunnel lokal.

### Restart Nginx

```bash
cd ~/PBL_206
docker compose up -d --force-recreate nginx
```

---

## 10. Verifikasi

### Cek Semua Service Running

```bash
docker compose ps
```

Semua container harus berstatus `Up` / `healthy`.

### Cek Tunnel Status

```bash
sudo systemctl status cloudflared
```

Harus `Active: active (running)`.

### Cek Log Tunnel Real-time

```bash
sudo journalctl -u cloudflared -f
```

### Akses Domain

Buka browser dan akses:

```
https://healthsync.web.id
```

Hasil yang diharapkan:
- ✅ Halaman HealthSync Clinic tampil
- ✅ Ikon gembok hijau / tidak ada warning di browser
- ✅ Sertifikat dikeluarkan oleh Cloudflare (bisa dicek dengan klik ikon gembok)

---

## Perintah Referensi Cepat

```bash
# Status tunnel
sudo systemctl status cloudflared

# Log tunnel real-time
sudo journalctl -u cloudflared -f

# Restart tunnel
sudo systemctl restart cloudflared

# Cek semua container Docker
docker compose ps

# Log nginx
docker compose logs nginx -f

# Restart nginx setelah edit config
docker compose restart nginx

# Lihat semua tunnel yang ada
cloudflared tunnel list
```

---

## Troubleshooting

### Tunnel jalan tapi website tidak bisa diakses

Cek apakah Nginx sudah running dan listen di port 80:
```bash
docker compose ps
curl -v http://localhost:80
```

### Error: credentials file doesn't exist

Pastikan path di `config.yml` sesuai dengan username kamu:
```bash
ls ~/.cloudflared/
# Pastikan file .json ada
```

Update path di `/etc/cloudflared/config.yml` sesuai nama file yang ada.

### Domain belum resolve

Cek propagasi DNS:
```bash
nslookup healthsync.web.id
# atau
dig healthsync.web.id CNAME
```

Harus return CNAME ke `*.cfargotunnel.com`.

### `X-Forwarded-Proto` tidak terbaca di Express.js

Tambahkan di awal `index.js` server:
```javascript
app.set('trust proxy', 1);
```

Ini diperlukan agar `req.protocol` mengembalikan `https` bukan `http`.

---

## Ringkasan Perubahan File

| File | Perubahan |
|------|-----------|
| `docker-compose.yml` | Hapus port 443, hapus 3 mount SSL cert |
| `nginx/nginx.conf` | Hapus server block 443 + SSL config, gabung jadi 1 block port 80, ganti `$scheme` → `$http_x_forwarded_proto` |
| `/etc/cloudflared/config.yml` | File baru — konfigurasi tunnel |
| `/etc/cloudflared/<UUID>.json` | File baru — credentials tunnel |
| `/etc/systemd/system/cloudflared.service` | File baru — dibuat otomatis oleh `cloudflared service install` |
