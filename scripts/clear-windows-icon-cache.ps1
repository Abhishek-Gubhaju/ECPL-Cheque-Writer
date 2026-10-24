# Clear the Windows icon cache so a rebuilt ECPL Cheque Writer shows its new icon.
#
# Windows caches shell icons (desktop/taskbar/Start menu shortcuts) by path and
# timestamp. Reinstalling over an existing install often keeps the OLD icon even
# though the .exe on disk is new. This script closes the app, flushes the cache
# and restarts Explorer so the shell re-reads icons from the new binaries.
#
# Run it in a normal PowerShell window - no administrator rights required:
#   powershell -ExecutionPolicy Bypass -File .\scripts\clear-windows-icon-cache.ps1
#
# Then relaunch the app. If the shortcut still shows the old artwork, the
# shortcut itself is stale: delete it and re-run the installer.

$ErrorActionPreference = 'Continue'

$apps = @('ECPL Cheque Writer', 'ECPL - Cheque Writer', 'cheque-writer')
foreach ($name in $apps) {
    Get-Process -Name $name -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
}

Write-Host 'Clearing icon cache...'

# 1. The legacy per-user icon database.
Remove-Item "$env:LOCALAPPDATA\IconCache.db" -Force -ErrorAction SilentlyContinue

# 2. The modern Explorer thumbnail/icon caches (iconcache_*.db, thumbcache_*.db).
$cacheDir = "$env:LOCALAPPDATA\Microsoft\Windows\Explorer"
if (Test-Path $cacheDir) {
    Get-ChildItem $cacheDir -Filter 'iconcache*' -Force -ErrorAction SilentlyContinue |
        Remove-Item -Force -ErrorAction SilentlyContinue
    Get-ChildItem $cacheDir -Filter 'thumbcache*' -Force -ErrorAction SilentlyContinue |
        Remove-Item -Force -ErrorAction SilentlyContinue
}

# 3. Restart Explorer so it rebuilds the cache from scratch.
Write-Host 'Restarting Explorer...'
taskkill /f /im explorer.exe | Out-Null
Start-Sleep -Milliseconds 800
Start-Process explorer.exe

# 4. Ask the shell to refresh its icon overlays.
if (Test-Path "$env:SystemRoot\System32\ie4uinit.exe") {
    & "$env:SystemRoot\System32\ie4uinit.exe" -show
}

Write-Host ''
Write-Host 'Done. Relaunch ECPL Cheque Writer to check the icon.'
Write-Host 'Still stale? The shortcut points at an old build - delete it and reinstall:'
Write-Host "  $env:LOCALAPPDATA\Programs\ECPL Cheque Writer"
