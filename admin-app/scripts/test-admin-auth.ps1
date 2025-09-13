Param(
  [string]$AdminUrl = 'http://localhost:3001/admin',
  [string]$SecretEnvName = 'ADMIN_SESSION_SECRET'
)

function Write-Result($name, $ok, $details='') {
  $status = if ($ok) { 'PASS' } else { 'FAIL' }
  Write-Host "[$status] $name" -ForegroundColor ($(if ($ok) { 'Green' } else { 'Red' }))
  if ($details) { Write-Host "       $details" }
}

# 1) No cookie -> expect redirect (302)
try {
  $r = Invoke-WebRequest -Uri $AdminUrl -Method GET -MaximumRedirection 0 -ErrorAction Stop
  Write-Result 'No-cookie should redirect (302)' $false "Got $($r.StatusCode)"
} catch {
  if ($_.Exception.Response -and $_.Exception.Response.StatusCode -eq 302) {
    $loc = $_.Exception.Response.Headers['Location'] -join ', '
    Write-Result 'No-cookie should redirect (302)' $true "Location: $loc"
  } else {
    Write-Result 'No-cookie should redirect (302)' $false $_.Exception.Message
  }
}

# 2) Invalid cookie -> expect redirect (302)
try {
  $r = Invoke-WebRequest -Uri $AdminUrl -Method GET -Headers @{ Cookie = 'admin_sess=abc.def' } -MaximumRedirection 0 -ErrorAction Stop
  Write-Result 'Invalid-cookie should redirect (302)' $false "Got $($r.StatusCode)"
} catch {
  if ($_.Exception.Response -and $_.Exception.Response.StatusCode -eq 302) {
    $loc = $_.Exception.Response.Headers['Location'] -join ', '
    Write-Result 'Invalid-cookie should redirect (302)' $true "Location: $loc"
  } else {
    Write-Result 'Invalid-cookie should redirect (302)' $false $_.Exception.Message
  }
}

# 3) Valid token -> expect 200
# Generate token using Node if secret available
$secret = (Get-ChildItem env:$SecretEnvName -ErrorAction SilentlyContinue).Value
if (-not $secret) {
  Write-Host "Warning: environment variable $SecretEnvName not set. You can set it before running this script to auto-generate a token.\n" -ForegroundColor Yellow
  # Show how to set the env var literally; escape $ so PowerShell doesn't try to expand it
  Write-Host "To set for this session (PowerShell):`n`$env:${SecretEnvName} = 'dev-secret'`n" -ForegroundColor Yellow
}

$token = $null
if ($secret) {
  # Create temporary JS file to avoid quoting issues
  $tmp = [System.IO.Path]::GetTempFileName() + '.js'
  $js = @"
const c = require('node:crypto');
const SECRET = process.env.${SecretEnvName} || 'dev-secret';
const now = Date.now();
const exp = now + 14*24*60*60*1000;
const payload = { sub: 'admin', ts: now, exp };
const b64u = b => Buffer.from(b).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const p = b64u(JSON.stringify(payload));
const sig = b64u(c.createHmac('sha256', SECRET).update(p).digest());
console.log(p + '.' + sig);
"@
  $js | Out-File -FilePath $tmp -Encoding ascii
  try {
    $token = node $tmp 2>$null
    $token = $token.Trim()
    Write-Host "Generated token from env $SecretEnvName" -ForegroundColor Green
  } catch {
    Write-Host "Failed to generate token with node: $_" -ForegroundColor Red
  } finally {
    Remove-Item $tmp -ErrorAction SilentlyContinue
  }
} else {
  Write-Host "No secret provided; skipping valid-token test. Set $SecretEnvName and re-run to test." -ForegroundColor Yellow
}

if ($token) {
  try {
    $r = Invoke-WebRequest -Uri $AdminUrl -Method GET -Headers @{ Cookie = "admin_sess=$token" } -MaximumRedirection 0 -ErrorAction Stop
    if ($r.StatusCode -eq 200) { Write-Result 'Valid-token should return 200' $true "Status: 200" } else { Write-Result 'Valid-token should return 200' $false "Status: $($r.StatusCode)" }
  } catch {
    if ($_.Exception.Response -and ($_.Exception.Response.StatusCode -eq 200)) {
      Write-Result 'Valid-token should return 200' $true "Status: 200"
    } else {
      Write-Result 'Valid-token should return 200' $false $_.Exception.Message
    }
  }
}

Write-Host "\nDone. If any tests failed, ensure the admin dev server is running on http://localhost:3001 and that $SecretEnvName matches the secret used to generate tokens."