# ============================================
# Monitoring Script PBL_206 
# HealthSync Clinic Infrastructure Monitor
# ============================================
$TOKEN = "8913999451:AAFnbHUqE0NrdHvrRXlr5XmZgfTiT5QsanY"
$CHAT_ID = "-5022288086"
$API_URL = "https://api.telegram.org/bot$TOKEN/sendMessage"

# ── Ambil data sistem ──────────────────────
$hostname  = $env:COMPUTERNAME
$timestamp = Get-Date -Format "dd/MM/yyyy HH:mm:ss"

# CPU
$cpu = [math]::Round((Get-CimInstance Win32_Processor | Measure-Object -Property LoadPercentage -Average).Average, 1)

# RAM
$ramObj      = Get-CimInstance Win32_OperatingSystem
$ramTotal    = [math]::Round($ramObj.TotalVisibleMemorySize / 1MB, 2)
$ramFree     = [math]::Round($ramObj.FreePhysicalMemory / 1MB, 2)
$ramUsedPct  = [math]::Round((($ramTotal - $ramFree) / $ramTotal) * 100, 1)

# Disk C
$diskC      = Get-PSDrive C | Select-Object -ExpandProperty Used
$diskCFree  = Get-PSDrive C | Select-Object -ExpandProperty Free
$diskCPct   = [math]::Round(($diskC / ($diskC + $diskCFree)) * 100, 1)
$diskCFreeGB = [math]::Round($diskCFree / 1GB, 1)

# ── Cek Service Windows ────────────────────
function Get-ServiceStatus($name) {
    $svc = Get-Service -Name $name -ErrorAction SilentlyContinue
    if ($svc) { return $svc.Status } else { return "Not Found" }
}

$addsStatus  = Get-ServiceStatus "NTDS"        # AD DS
$dnsStatus   = Get-ServiceStatus "DNS"         # DNS Server
$rdpStatus   = Get-ServiceStatus "TermService" # Remote Desktop
$smbStatus   = Get-ServiceStatus "LanmanServer" # SMB/File Sharing


# ── Cek HealthSync di Ubuntu ──────────────
$healthsyncStatus = try {
    $r = Invoke-WebRequest -Uri "http://192.168.20.20" -TimeoutSec 5 -UseBasicParsing
    if ($r.StatusCode -eq 200 -or $r.StatusCode -eq 301 -or $r.StatusCode -eq 302) { 
        "Online" 
    } else { 
        "Error ($($r.StatusCode))" 
    }
} catch { "OFFLINE" }

# ── Cek konektivitas ke VM lain ───────────
$pingClient = try {
    $p = Test-Connection -ComputerName "192.168.10.103" -Count 1 -ErrorAction Stop
    "Online ($($p.ResponseTime)ms)"
} catch { "OFFLINE" }

$pingUbuntu = try {
    $p = Test-Connection -ComputerName "192.168.10.50" -Count 1 -ErrorAction Stop
    "Online ($($p.ResponseTime)ms)"
} catch { "OFFLINE" }

# ── Cek login gagal 5 menit terakhir ──────
$failedLogins = (Get-WinEvent -FilterHashtable @{
    LogName   = "Security"
    Id        = 4625
    StartTime = (Get-Date).AddMinutes(-5)
} -ErrorAction SilentlyContinue | Measure-Object).Count

# ── Cek uptime server ─────────────────────
$uptime     = (Get-Date) - $ramObj.LastBootUpTime
$uptimeStr  = "{0}h {1}m" -f [int]$uptime.TotalHours, $uptime.Minutes

# ── Tentukan alert ────────────────────────
$alerts = @()
if ($cpu -gt 80)                          { $alerts += "CPU TINGGI ($cpu%)" }
if ($ramUsedPct -gt 85)                   { $alerts += "RAM TINGGI ($ramUsedPct%)" }
if ($diskCPct -gt 90)                     { $alerts += "DISK C HAMPIR PENUH ($diskCPct%)" }
if ($addsStatus -ne "Running")            { $alerts += "AD DS DOWN!" }
if ($dnsStatus -ne "Running")             { $alerts += "DNS SERVER DOWN!" }
if ($rdpStatus -ne "Running")             { $alerts += "RDP SERVICE DOWN!" }
if ($smbStatus -ne "Running")             { $alerts += "SMB SERVICE DOWN!" }
if ($healthsyncStatus -ne "Online")       { $alerts += "HEALTHSYNC APP DOWN!" }
if ($pingClient -eq "OFFLINE")            { $alerts += "WIN11 CLIENT TIDAK TERJANGKAU!" }
if ($pingUbuntu -eq "OFFLINE")            { $alerts += "UBUNTU VM TIDAK TERJANGKAU!" }
if ($failedLogins -gt 3)                  { $alerts += "LOGIN GAGAL BERULANG ($failedLogins kali)!" }

$statusLabel = if ($alerts.Count -gt 0) { "PERINGATAN" } else { "NORMAL" }
$statusEmoji = if ($alerts.Count -gt 0) { "[!]" } else { "[OK]" }
$line        = "------------------------------"

# ── Susun pesan ───────────────────────────
$msg  = "$statusEmoji [PBL_206] MONITORING REPORT `n"
$msg += "$line`n"
$msg += "Host    : $hostname`n"
$msg += "Waktu   : $timestamp`n"
$msg += "Uptime  : $uptimeStr`n"
$msg += "Status  : $statusLabel`n"
$msg += "$line`n"
$msg += "[SISTEM]`n"
$msg += "CPU     : $cpu%`n"
$msg += "RAM     : $ramUsedPct% ($ramFree GB bebas)`n"
$msg += "Disk C  : $diskCPct% ($diskCFreeGB GB bebas)`n"
$msg += "$line`n"
$msg += "[SERVICES WINDOWS]`n"
$msg += "AD DS   : $addsStatus`n"
$msg += "DNS     : $dnsStatus`n"
$msg += "RDP     : $rdpStatus`n"
$msg += "SMB     : $smbStatus`n"
$msg += "$line`n"
$msg += "[HEALTHSYNC CLINIC]`n"
$msg += "Web     : $healthsyncStatus`n"
$msg += "Win11   : $pingClient`n"
$msg += "Ubuntu  : $pingUbuntu`n"
$msg += "$line`n"
$msg += "[KEAMANAN]`n"
$msg += "Login Gagal (5 mnt) : $failedLogins kali`n"

if ($alerts.Count -gt 0) {
    $msg += "$line`n"
    $msg += "[ALERT]`n"
    foreach ($alert in $alerts) {
        $msg += "  >> $alert`n"
    }
}

# ── Kirim ke Telegram ─────────────────────
$body = @{
    chat_id = $CHAT_ID
    text    = $msg
}

try {
    Invoke-RestMethod -Uri $API_URL -Method POST -Body $body
    Write-Host "[OK] Pesan terkirim ke Telegram: $(Get-Date)"
} catch {
    Write-Host "[ERROR] Gagal kirim: $_"
}