param(
  [string]$Base = $env:ADMIN_URL
)
if (-not $Base -or $Base -eq "") { $Base = "http://127.0.0.1:3001" }

$loginUrl = "$Base/api/admin-login"
$adminUrl = "$Base/admin"
$tmp = Join-Path $PSScriptRoot "cookies.txt"

# 1) CSRF al
$csrf = (curl.exe -s $loginUrl | ConvertFrom-Json).csrf
if (-not $csrf) { Write-Error "CSRF alınamadı: $loginUrl"; exit 1 }

# 2) Login (cookie jar'a yaz)
$pass = $env:ADMIN_PASSWORD
if (-not $pass -or $pass -eq "") { $pass = 'test' }
$body = "username=admin&password=$pass&csrf=$csrf"
# Pipe body into curl to avoid exposing password in cmdline/process list
$bytes = [System.Text.Encoding]::UTF8.GetBytes($body)
$ms = New-Object System.IO.MemoryStream
$ms.Write($bytes, 0, $bytes.Length)
$ms.Position = 0
$procInfo = &{ curl.exe -i -c $tmp -H "Content-Type: application/x-www-form-urlencoded" -X POST --data-binary @- $loginUrl <&0 } < $ms
Write-Output $procInfo | Select-String -Pattern "^location:.*" -CaseSensitive

# 3) /admin isteği (cookie ile)
$admin = curl.exe -i -b $tmp $adminUrl
$first = ($admin -split "`r?`n`r?`n")[0]
Write-Output $first
