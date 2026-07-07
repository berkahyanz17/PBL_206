# Tutorial Setup Monitoring: Prometheus + Grafana

**Topologi:**

| Mesin | IP | Role |
|---|---|---|
| Windows Server | 192.168.10.10 | Prometheus + Grafana + Alertmanager |
| uiserver | 192.168.20.20 | Target (DMZ) |
| dbserver | 192.168.10.30 | Target |
| Ubuntu Desktop | 192.168.10.50 | Target |
| Windows 11 Client | *(isi IP statis/hardcode di sini)* | Target |

Urutan pengerjaan: **uiserver → dbserver → Ubuntu Desktop → Windows 11 → Windows Server**. Semua exporter disiapkan dulu di tiap mesin, baru terakhir Windows Server yang scrape semuanya — jadi pas sampai langkah terakhir, tinggal cek semua target langsung `UP`, ga perlu bolak-balik VM.

---

## BAGIAN 1 — uiserver (192.168.20.20)

### 1.1 Tambahin node-exporter ke docker-compose.yml yang sudah ada

```bash
cd /path/ke/project/uiserver
nano docker-compose.yml
```

Tambahin service ini (di level `services:` yang sama dengan container lain):

```yaml
  node-exporter:
    image: prom/node-exporter:latest
    container_name: node-exporter
    restart: unless-stopped
    network_mode: host
    pid: host
    volumes:
      - /:/host:ro,rslave
    command:
      - '--path.rootfs=/host'
```

### 1.2 Tambahin juga cAdvisor (monitoring per-container: nginx, frontend, dst)

Di file `docker-compose.yml` yang sama, tambahin service ini:

```yaml
  cadvisor:
    image: gcr.io/cadvisor/cadvisor:latest
    container_name: cadvisor
    restart: unless-stopped
    ports:
      - "8080:8080"
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
      - /dev/disk/:/dev/disk:ro
```

### 1.3 Jalankan

```bash
docker compose up -d --no-pull
docker compose ps
```

Pastikan semua container lain (nginx, frontend, dst) tetap `Up`, dan `node-exporter` + `cadvisor` juga `Up`.

### 1.4 Cek exporter jalan lokal

```bash
curl http://localhost:9100/metrics | head -20
curl http://localhost:8080/metrics | head -20
```

Kalau muncul baris `# HELP` dan `# TYPE`, berarti sukses.

### 1.5 Firewall — restrict hanya dari Windows Server

```bash
sudo ufw allow from 192.168.10.10 to any port 9100 proto tcp
sudo ufw allow from 192.168.10.10 to any port 8080 proto tcp
sudo ufw deny 9100
sudo ufw deny 8080
sudo ufw status numbered
```

> Urutan penting: `allow` spesifik dulu, baru `deny` umum. Cek `ufw status numbered` buat mastiin rule `allow` ada di atas `deny`.

### 1.6 Kalau ada firewall/router DMZ terpisah (pfSense dll)

Tambahin rule di situ juga: **inbound TCP 9100 dan TCP 8080, source 192.168.10.10, destination 192.168.20.20**. Rule di `ufw` doang ga cukup kalau ada firewall appliance di depan DMZ.

✅ **uiserver selesai.** Lanjut ke dbserver.

---

## BAGIAN 2 — dbserver (192.168.10.30)

### 2.1 Tambahin node-exporter ke docker-compose.yml yang sudah ada

```bash
cd /path/ke/project/dbserver
nano docker-compose.yml
```

```yaml
  node-exporter:
    image: prom/node-exporter:latest
    container_name: node-exporter
    restart: unless-stopped
    network_mode: host
    pid: host
    volumes:
      - /:/host:ro,rslave
    command:
      - '--path.rootfs=/host'
```

### 2.2 Tambahin juga cAdvisor (monitoring per-container: mariadb, redis, dst)

Di file `docker-compose.yml` yang sama, tambahin service ini:

```yaml
  cadvisor:
    image: gcr.io/cadvisor/cadvisor:latest
    container_name: cadvisor
    restart: unless-stopped
    ports:
      - "8080:8080"
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
      - /dev/disk/:/dev/disk:ro
```

### 2.3 Jalankan

```bash
docker compose up -d --no-pull
docker compose ps
```

Pastikan mariadb dan redis tetap `Up`, dan `node-exporter` + `cadvisor` juga `Up`.

### 2.4 Cek lokal

```bash
curl http://localhost:9100/metrics | head -20
curl http://localhost:8080/metrics | head -20
```

### 2.5 Firewall

```bash
sudo ufw allow from 192.168.10.10 to any port 9100 proto tcp
sudo ufw allow from 192.168.10.10 to any port 8080 proto tcp
sudo ufw deny 9100
sudo ufw deny 8080
sudo ufw status numbered
```

✅ **dbserver selesai.** Lanjut ke Ubuntu Desktop.

---

## BAGIAN 3 — Ubuntu Desktop (192.168.10.50)

### 3.1 Download & install node_exporter (native, bukan Docker)

```bash
cd /tmp
wget https://github.com/prometheus/node_exporter/releases/download/v1.8.2/node_exporter-1.8.2.linux-amd64.tar.gz
tar xvfz node_exporter-1.8.2.linux-amd64.tar.gz
sudo mv node_exporter-1.8.2.linux-amd64/node_exporter /usr/local/bin/
```

### 3.2 Bikin user khusus (best practice)

```bash
sudo useradd --no-create-home --shell /usr/sbin/nologin node_exporter
sudo chown node_exporter:node_exporter /usr/local/bin/node_exporter
```

### 3.3 Bikin systemd unit file

```bash
sudo nano /etc/systemd/system/node_exporter.service
```

Isi:

```ini
[Unit]
Description=Node Exporter
Wants=network-online.target
After=network-online.target

[Service]
User=node_exporter
Group=node_exporter
Type=simple
ExecStart=/usr/local/bin/node_exporter
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

### 3.4 Enable & start (biar auto-start tiap reboot)

```bash
sudo systemctl daemon-reload
sudo systemctl enable node_exporter
sudo systemctl start node_exporter
sudo systemctl status node_exporter
```

Harus `active (running)`.

### 3.5 Cek lokal

```bash
curl http://localhost:9100/metrics | head -20
```

### 3.6 Firewall

```bash
sudo ufw allow from 192.168.10.10 to any port 9100 proto tcp
sudo ufw deny 9100
sudo ufw status numbered
```

✅ **Ubuntu Desktop selesai.** Lanjut ke Windows 11.

---

## BAGIAN 4 — Windows 11 Client

> Set IP static dulu (atau catat IP DHCP saat ini) karena bakal di-hardcode di `prometheus.yml`. Kalau IP berubah nanti, tinggal update manual di `prometheus.yml` di Windows Server.

Cek IP sekarang:
```powershell
ipconfig
```
Catat `IPv4 Address`-nya — sebut ini `<IP-WIN11>` di langkah selanjutnya.

### 4.1 Download windows_exporter

Download `.msi` dari:
https://github.com/prometheus-community/windows_exporter/releases

Pilih file `windows_exporter-<versi>-amd64.msi`.

### 4.2 Install (PowerShell as Administrator)

```powershell
msiexec /i windows_exporter-0.27.0-amd64.msi ENABLED_COLLECTORS="cpu,cs,logical_disk,net,os,service,system,memory,tcp" /qn
```

### 4.3 Cek service jalan

```powershell
Get-Service windows_exporter
```

Kalau belum `Running`:
```powershell
Start-Service windows_exporter
```

### 4.4 Firewall

```powershell
New-NetFirewallRule -DisplayName "windows_exporter" -Direction Inbound -Protocol TCP -LocalPort 9182 -RemoteAddress 192.168.10.10 -Action Allow
```

> `-RemoteAddress 192.168.10.10` biar cuma Windows Server yang bisa akses, bukan seluruh subnet.

### 4.5 Cek lokal

Buka browser di PC ini:
```
http://localhost:9182/metrics
```

✅ **Windows 11 selesai.** Lanjut ke Windows Server — tahap terakhir, sekaligus tempat semua target disatukan.

---

## BAGIAN 5 — Windows Server (192.168.10.10)

### 5.1 Download NSSM (dibutuhkan buat Prometheus & Alertmanager jadi service)

Download dari https://nssm.cc/download, extract ke `C:\nssm`.

### 5.2 Install Prometheus

**Download & extract:**
- https://prometheus.io/download/ → pilih `windows-amd64.zip`
- Extract ke `C:\prometheus`

**Edit `C:\prometheus\prometheus.yml`** — ganti seluruh isinya dengan:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['localhost:9093']

rule_files:
  - "alert_rules.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'uiserver'
    static_configs:
      - targets: ['192.168.20.20:9100']
        labels:
          instance: 'uiserver'

  - job_name: 'dbserver'
    static_configs:
      - targets: ['192.168.10.30:9100']
        labels:
          instance: 'dbserver'

  - job_name: 'ubuntu_desktop'
    static_configs:
      - targets: ['192.168.10.50:9100']
        labels:
          instance: 'ubuntu-desktop'

  - job_name: 'windows11_client'
    static_configs:
      - targets: ['<IP-WIN11>:9182']       # ganti dengan IP dari Bagian 4
        labels:
          instance: 'windows11-client'

  - job_name: 'uiserver_cadvisor'
    static_configs:
      - targets: ['192.168.20.20:8080']
        labels:
          instance: 'uiserver-containers'

  - job_name: 'dbserver_cadvisor'
    static_configs:
      - targets: ['192.168.10.30:8080']
        labels:
          instance: 'dbserver-containers'
```

Ganti `<IP-WIN11>` dengan IP yang dicatat di Bagian 4.1.

**Bikin `alert_rules.yml`** di `C:\prometheus\`:

```yaml
groups:
  - name: server_alerts
    rules:
      - alert: HighCPUUsage
        expr: 100 - (avg by(instance)(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "CPU tinggi di {{ $labels.instance }}"

      - alert: DiskAlmostFull
        expr: (node_filesystem_avail_bytes / node_filesystem_size_bytes) * 100 < 10
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Disk hampir penuh di {{ $labels.instance }}"
```

**Validasi config sebelum jalanin sebagai service:**

```powershell
cd C:\prometheus
.\promtool.exe check config prometheus.yml
.\promtool.exe check rules alert_rules.yml
```

**Test manual dulu:**

```powershell
.\prometheus.exe --config.file=C:\prometheus\prometheus.yml --storage.tsdb.path=C:\prometheus\data
```

Buka `http://localhost:9090/targets` — cek target mana yang `UP`/`DOWN` (yang lain masih `DOWN` karena Alertmanager belum jalan, itu normal, dicek lagi nanti). Kalau sudah cek, `Ctrl+C` untuk stop.

**Register sebagai Windows Service via NSSM:**

```powershell
C:\nssm\win64\nssm.exe install Prometheus
```

Di GUI yang muncul, isi:
- **Path**: `C:\prometheus\prometheus.exe`
- **Startup directory**: `C:\prometheus`
- **Arguments**: `--config.file=C:\prometheus\prometheus.yml --storage.tsdb.path=C:\prometheus\data`

Klik **Install service**, lalu:

```powershell
Start-Service Prometheus
Get-Service Prometheus
```

**Firewall:**

```powershell
New-NetFirewallRule -DisplayName "Prometheus" -Direction Inbound -Protocol TCP -LocalPort 9090 -Action Allow
```

### 5.3 Install Grafana

**Download** `.msi` dari https://grafana.com/grafana/download (pilih Windows).

**Install:**

```powershell
msiexec /i grafana-11.x.x.windows-amd64.msi /qn
```

Installer otomatis register & start service bernama `Grafana`.

**Cek service:**

```powershell
Get-Service Grafana
```

**Firewall:**

```powershell
New-NetFirewallRule -DisplayName "Grafana" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
```

**Login pertama kali:**

Buka `http://localhost:3000` (atau `http://192.168.10.10:3000` dari mesin lain), login `admin`/`admin`, langsung diminta ganti password.

**Tambah data source:**

Connections → Data sources → Add data source → **Prometheus** → URL: `http://localhost:9090` → Save & Test.

**Import dashboard siap pakai:**

Dashboards → New → Import → masukin ID:
- `1860` = Node Exporter Full (buat uiserver, dbserver, Ubuntu Desktop)
- `14694` atau `10467` = Windows Exporter (buat Windows 11 client)
- `893` = Docker and system monitoring, atau `14282` = cAdvisor exporter (buat container-level metrics di uiserver & dbserver)

Pas import, pilih data source Prometheus yang baru dibuat.

### 5.4 Install Alertmanager (opsional, buat notifikasi Telegram)

**Download & extract** dari https://prometheus.io/download/#alertmanager → `C:\alertmanager`

**Bikin `alertmanager.yml`** di `C:\alertmanager\`:

```yaml
global:
  resolve_timeout: 5m

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'telegram-bot'

receivers:
  - name: 'telegram-bot'
    telegram_configs:
      - bot_token: 'GANTI_DENGAN_BOT_TOKEN'
        chat_id: GANTI_DENGAN_CHAT_ID
        api_url: 'https://api.telegram.org'
        parse_mode: 'HTML'
```

**Validasi:**

```powershell
cd C:\alertmanager
.\amtool.exe check-config alertmanager.yml
```

**Register service via NSSM:**

```powershell
C:\nssm\win64\nssm.exe install Alertmanager
```
- **Path**: `C:\alertmanager\alertmanager.exe`
- **Arguments**: `--config.file=C:\alertmanager\alertmanager.yml`

```powershell
Start-Service Alertmanager
```

**Firewall:**

```powershell
New-NetFirewallRule -DisplayName "Alertmanager" -Direction Inbound -Protocol TCP -LocalPort 9093 -Action Allow
```

**Restart Prometheus biar konek ke Alertmanager:**

```powershell
Restart-Service Prometheus
```

### 5.5 Verifikasi akhir

Buka `http://192.168.10.10:9090/targets` — semua target harus **UP**:

- `prometheus` (localhost) ✅
- `uiserver` (192.168.20.20:9100) ✅
- `dbserver` (192.168.10.30:9100) ✅
- `ubuntu_desktop` (192.168.10.50:9100) ✅
- `windows11_client` (<IP-WIN11>:9182) ✅
- `uiserver_cadvisor` (192.168.20.20:8080) ✅
- `dbserver_cadvisor` (192.168.10.30:8080) ✅

Kalau ada yang `DOWN`, cek urutan ini:
1. Exporter di mesin target jalan? (`curl localhost:9100/metrics` atau `:9182/metrics` di mesin itu)
2. Firewall di mesin target udah allow dari `192.168.10.10`?
3. Kalau uiserver — firewall/router DMZ udah allow rule-nya juga (bukan cuma `ufw`)?
4. `Test-NetConnection -ComputerName <IP-target> -Port <port>` dari Windows Server — konek atau timeout?

---

## Catatan update IP Windows 11 (karena hardcoded, bukan reservation)

Kalau suatu saat IP Windows 11 client berubah (misal abis reconnect WiFi beda network), tinggal:

1. `ipconfig` di Windows 11 buat cek IP baru
2. Edit `C:\prometheus\prometheus.yml` di Windows Server, ganti target `windows11_client`
3. `promtool check config prometheus.yml`
4. `Restart-Service Prometheus`
5. Cek `http://192.168.10.10:9090/targets` — pastiin `UP` lagi
