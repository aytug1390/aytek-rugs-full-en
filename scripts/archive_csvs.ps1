$root = 'C:\proje-aytek-rugs'
$archive = 'C:\proje-aytek-rugs\aytek-rugs-full-en\archived_csvs'

if (-not (Test-Path $archive)) {
    New-Item -Path $archive -ItemType Directory -Force | Out-Null
}

Get-ChildItem -Path $root -Recurse -Filter '*.csv' -File |
    Where-Object { $_.FullName -ne (Join-Path $root 'cappadocia.csv') -and $_.FullName -notlike "$archive*" } |
    ForEach-Object {
        $src = $_.FullName
        $dest = Join-Path $archive $_.Name
        if (-not (Test-Path $dest)) {
            Copy-Item -Path $src -Destination $dest -ErrorAction Stop
            Write-Output "COPIED:$src -> $dest"
            Remove-Item -Path $src -Force -ErrorAction Stop
            Write-Output "REMOVED:$src"
        }
        else {
            Write-Output "DEST_EXISTS_SKIP:$src -> $dest"
        }
    }
