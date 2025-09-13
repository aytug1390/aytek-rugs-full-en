<#
  setup-gh-secret.ps1
  - Ensures `gh` CLI is available (tries winget),
  - Detects repository slug (owner/repo) from git remote or asks user,
  - Runs `gh auth login --web` if not authenticated,
  - Prompts for ADMIN_PASSWORD securely and uploads it as a repository secret.

  Usage: run from repo (PowerShell)
    pwsh ./scripts/setup-gh-secret.ps1

  Security notes: secret is read as a SecureString and piped to `gh` via stdin to avoid storing it in shell history.
#>

function Ensure-GhInstalled {
  if (Get-Command gh -ErrorAction SilentlyContinue) {
    return $true
  }
  Write-Host "gh CLI not found. Attempting to install via winget..." -ForegroundColor Yellow
  if (Get-Command winget -ErrorAction SilentlyContinue) {
    try {
      winget install --id GitHub.cli -e --silent
    } catch {
      Write-Warning "winget install failed. Please install GitHub CLI manually: https://github.com/cli/cli/releases"
      return $false
    }
    # refresh PATH in current session if needed
    if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
      Write-Host "Please reopen your terminal to finalize gh installation, then re-run this script." -ForegroundColor Yellow
      return $false
    }
    return $true
  }
  Write-Warning "No winget available. Please install GitHub CLI manually: https://github.com/cli/cli/releases"
  return $false
}

function Get-RepoSlugFromGit {
  try {
    $url = git remote get-url origin 2>$null
    if (-not $url) { return $null }
    # support formats: git@github.com:owner/repo.git or https://github.com/owner/repo.git
    if ($url -match 'git@github.com:(?<owner>[^/]+)/(?<repo>[^.]+)') {
      return "${Matches.owner}/${Matches.repo}"
    }
    if ($url -match 'https?://github.com/(?<owner>[^/]+)/(?<repo>[^.]+)') {
      return "${Matches.owner}/${Matches.repo}"
    }
    return $null
  } catch {
    return $null
  }
}

Write-Host "== GitHub Secret Setup Helper ==" -ForegroundColor Cyan

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  Write-Warning "git command not found in PATH. Please run this script inside your cloned repository where git is available."
}

# Ensure gh exists (best-effort)
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  $ok = Ensure-GhInstalled
  if (-not $ok) {
    Write-Host "Cannot continue without gh CLI. Install it and re-run this script." -ForegroundColor Red
    exit 1
  }
}

# Determine repo slug
$repo = Get-RepoSlugFromGit
if (-not $repo) {
  $repo = Read-Host -Prompt "Enter repo slug (owner/repo), e.g. myuser/aytek-rugs-full-en"
}

Write-Host "Using repo: $repo"

# Ensure gh auth
try {
  $status = gh auth status 2>&1
  if ($LASTEXITCODE -ne 0 -or $status -match 'not logged in') {
    Write-Host "You are not logged into gh. Opening browser for web auth..." -ForegroundColor Yellow
    gh auth login --web
  } else {
    Write-Host "gh auth status OK"
  }
} catch {
  Write-Host "gh auth status failed; attempting interactive login..." -ForegroundColor Yellow
  gh auth login --web
}

# Prompt securely for secret value
$secure = Read-Host -Prompt "Enter ADMIN_PASSWORD (input hidden)" -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
$plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)

try {
  # Pipe plaintext to gh to avoid putting it in shell history
  $plain | gh secret set ADMIN_PASSWORD --body - --repo $repo
  if ($LASTEXITCODE -eq 0) {
    Write-Host "Secret ADMIN_PASSWORD set for $repo" -ForegroundColor Green
    Write-Host "Verify with: gh secret list --repo $repo"
  } else {
    Write-Error "gh secret set returned non-zero exit code. See output above."
  }
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
  Remove-Variable plain -ErrorAction SilentlyContinue
}
