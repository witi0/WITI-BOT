# Run only in a disposable Windows 10/11 x64 VM without development tools.
param([Parameter(Mandatory=$true)][string]$Installer,[switch]$DisposableVM)
$ErrorActionPreference='Stop'
if (-not $DisposableVM) { throw 'Usa una VM desechable y el argumento -DisposableVM. Este ensayo instala y desinstala WITI BOT.' }
if (-not [Environment]::Is64BitOperatingSystem) { throw 'Se requiere Windows x64' }
$Installer=(Resolve-Path $Installer).Path
$Destination=Join-Path $env:LOCALAPPDATA 'Programs\WITI-BOT-QA'
$Data=Join-Path $env:APPDATA 'WITI BOT'
if ((Test-Path $Destination) -or (Test-Path $Data)) { throw 'La VM no está limpia: ya hay instalación o datos WITI BOT. No se modificaron.' }
$Evidence=[ordered]@{windows=[Environment]::OSVersion.VersionString;started=(Get-Date).ToString('o');installerSha256=(Get-FileHash $Installer).Hash;signature=(Get-AuthenticodeSignature $Installer).Status.ToString();tests=@()}
function Record([string]$Name,[bool]$Pass){$Evidence.tests+=@{name=$Name;passed=$Pass};if(-not $Pass){throw "Falló: $Name"}}
try {
 $p=Start-Process $Installer -ArgumentList @('/S',"/D=$Destination") -Wait -PassThru
 Record 'Instalación devuelve cero' ($p.ExitCode -eq 0)
 $Exe=Join-Path $Destination 'WITI BOT.exe'
 Record 'Aplicación x64 instalada' (Test-Path $Exe)
 Record 'Desinstalador instalado' (Test-Path (Join-Path $Destination 'Uninstall WITI BOT.exe'))
 $running=Start-Process $Exe -PassThru
 $deadline=(Get-Date).AddSeconds(30)
 do {Start-Sleep -Milliseconds 500;$running.Refresh()} while(-not $running.HasExited -and $running.MainWindowHandle -eq 0 -and (Get-Date) -lt $deadline)
 Record 'Proceso con ventana visible' (-not $running.HasExited -and $running.MainWindowHandle -ne 0)
 Record 'SQLite creada sin herramientas de desarrollo' (Test-Path (Join-Path $Data 'witi.sqlite'))
 $code=0
 try {Invoke-WebRequest 'http://127.0.0.1:19381/overlay/test' -UseBasicParsing | Out-Null} catch {if($_.Exception.Response){$code=[int]$_.Exception.Response.StatusCode}}
 Record 'Servidor local rechaza acceso sin token' ($code -eq 401)
 $null=$running.CloseMainWindow();$running.WaitForExit(15000) | Out-Null
 Record 'Cierre limpio' $running.HasExited
 $marker=Join-Path $Data 'qa-preservation.txt';Set-Content $marker 'qa'
 $p=Start-Process $Installer -ArgumentList @('/S',"/D=$Destination") -Wait -PassThru
 Record 'Reinstalación preserva archivos personales' ((Test-Path $marker) -and $p.ExitCode -eq 0)
 $u=Start-Process (Join-Path $Destination 'Uninstall WITI BOT.exe') -ArgumentList '/S' -Wait -PassThru
 Start-Sleep -Seconds 2
 Record 'Desinstalación elimina la aplicación' (-not(Test-Path $Exe))
 Record 'Desinstalación silenciosa conserva datos por defecto' (Test-Path $marker)
 $Evidence.pending=@('Probar selección de carpeta y accesos en asistente interactivo','Probar UAC para todos los usuarios','Probar borrado opcional de datos interactivo','Probar actualización HTTPS firmada desde versión N a N+1 y migración','Probar integración OBS, audio y voces Windows','Repetir en Windows 10 y Windows 11')
} finally {
 $Evidence.finished=(Get-Date).ToString('o')
 $Evidence | ConvertTo-Json -Depth 6 | Set-Content -Encoding UTF8 'WITI_BOT_Windows_Evidence.json'
}
