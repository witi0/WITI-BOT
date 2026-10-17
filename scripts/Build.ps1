$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
function Invoke-Checked([string]$Program, [string[]]$Arguments) {
  & $Program @Arguments
  if ($LASTEXITCODE -ne 0) { throw "$Program terminó con código $LASTEXITCODE" }
}
Invoke-Checked npm.cmd @('ci')
Invoke-Checked python @('scripts/generate-sounds.py')
Invoke-Checked npm.cmd @('test')
Invoke-Checked npm.cmd @('run','dist:win')
Get-FileHash 'dist\WITI_BOT_Setup_v1.1.0.exe' -Algorithm SHA256 | Format-List
