# ============================================
# Monitoring Script PBL_206 - Telegram Alert
# ============================================
$TOKEN = "8913999451:AAFnbHUqE0NrdHvrRXlr5XmZgfTiT5QsanY"
$CHAT_ID = "-5022288086"
$API_URL = "https://api.telegram.org/bot$TOKEN/sendMessage"

# Ambil data sistem
$hostname = $env:COMPUTERNAME
$timestamp = Get-Date -Format "dd/MM/yyyy HH:mm:ss"
$cpu = [math]::Round((Get-CimInstance Win32_Processor | Measure-Object -Property LoadPercentage -Average).Average, 1)
$ramObj = Get-CimInstance Win32_OperatingSystem
$ramTotal = [math]::Round($ramObj.TotalVisibleMemorySize / 1MB, 2)
$ramFree = [math]::Round($ramObj.FreePhysicalMemory / 1MB, 2)
$ramUsedPct = [math]::Round((($ramTotal - $ramFree) / $ramTotal) * 100, 1)

$diskC = Get-PSDrive C | Select-Object -ExpandProperty Used
$diskCFree = Get-PSDrive C | Select-Object -ExpandProperty Free
$diskCPct = [math]::Round(($diskC / ($diskC + $diskCFree)) * 100, 1)

# Status Nginx
$nginxStatus = try {
    $r = Invoke-WebRequest -Uri "http://localhost" -TimeoutSec 3 -UseBasicParsing
    if ($r.StatusCode -eq 200) { "Online" } else { "Error ($($r.StatusCode))" }
} catch { "OFFLINE" }

# Cek login gagal 5 menit terakhir
$failedLogins = (Get-WinEvent -FilterHashtable @{LogName="Security"; Id=4625; StartTime=(Get-Date).AddMinutes(-5)} -ErrorAction SilentlyContinue | Measure-Object).Count

# Tentukan status
$alert = ""
if ($cpu -gt 80) { $alert += "CPU TINGGI! " }
if ($ramUsedPct -gt 85) { $alert += "RAM TINGGI! " }
if ($diskCPct -gt 90) { $alert += "DISK PENUH! " }
if ($nginxStatus -ne "Online") { $alert += "NGINX DOWN! " }
if ($failedLogins -gt 3) { $alert += "LOGIN GAGAL BERULANG! " }

$statusLabel = "NORMAL"
if ($alert) { $statusLabel = "PERINGATAN" }

$line = "------------------------------"

$msg = "[PBL_206] MONITORING REPORT`n"
$msg += "$line`n"
$msg += "Host    : $hostname`n"
$msg += "Waktu   : $timestamp`n"
$msg += "Status  : $statusLabel`n"
$msg += "$line`n"
$msg += "CPU     : $cpu%`n"
$msg += "RAM     : $ramUsedPct% terpakai ($ramFree GB bebas)`n"
$msg += "Disk C  : $diskCPct% terpakai`n"
$msg += "Nginx   : $nginxStatus`n"
$msg += "Login Gagal (5 menit): $failedLogins kali`n"
if ($alert) {
    $msg += "$line`n"
    $msg += "ALERT : $alert`n"
}

# Kirim ke Telegram
$body = @{
    chat_id = $CHAT_ID
    text = $msg
}

try {
    Invoke-RestMethod -Uri $API_URL -Method POST -Body $body
    Write-Host "[OK] Pesan terkirim ke Telegram: $(Get-Date)"
} catch {
    Write-Host "[ERROR] Gagal kirim: $_"
}