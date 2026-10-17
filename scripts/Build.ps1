$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
function Invoke-Checked([string]$Program, [string[]]$Arguments) {
  & $Program @Arguments
  if ($LASTEXITCODE -ne 0) { throw "$Program terminó con código $LASTEXITCODE" }
}
Invoke-Checked npm.cmd @('ci')
Invoke-Checked npm.cmd @('test')
Invoke-Checked npm.cmd @('run','dist:win')
$version = (Get-Content 'package.json' -Raw | ConvertFrom-Json).version
Get-FileHash "dist\WITI_BOT_Setup_v$version.exe" -Algorithm SHA256 | Format-List
