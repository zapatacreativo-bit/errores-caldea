# Script para empaquetar el proyecto Next.js para despliegue
# Uso: .\package-deploy.ps1

Write-Host "Empaquetando proyecto para despliegue..." -ForegroundColor Cyan

# Nombre del archivo ZIP
$zipName = "errores_caldea-deploy-$(Get-Date -Format 'yyyyMMdd-HHmmss').zip"
$zipPath = Join-Path $PSScriptRoot $zipName

# Crear carpeta temporal
$tempDir = Join-Path $PSScriptRoot "temp-deploy"
if (Test-Path $tempDir) {
    Remove-Item $tempDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

Write-Host "Carpeta temporal creada" -ForegroundColor Green

# Copiar archivos y carpetas necesarias
Write-Host "`nCopiando archivos necesarios..." -ForegroundColor Cyan

# Carpetas completas
$folders = @(
    ".next",
    "public",
    "pages",
    "components",
    "lib",
    "styles"
)

foreach ($folder in $folders) {
    $source = Join-Path $PSScriptRoot $folder
    if (Test-Path $source) {
        Write-Host "  Copiando $folder/" -ForegroundColor Gray
        Copy-Item -Path $source -Destination $tempDir -Recurse -Force
    }
}

# Archivos individuales
$files = @(
    "package.json",
    "package-lock.json",
    "next.config.js",
    "postcss.config.js",
    "tailwind.config.js",
    ".env.local"
)

foreach ($file in $files) {
    $source = Join-Path $PSScriptRoot $file
    if (Test-Path $source) {
        Write-Host "  Copiando $file" -ForegroundColor Gray
        Copy-Item -Path $source -Destination $tempDir -Force
    }
}

# Crear archivo README para el despliegue
$readmeContent = @'
# Instrucciones de Despliegue

## Archivos incluidos
- .next/          -> Build de produccion
- public/         -> Assets estaticos
- pages/          -> Paginas de la aplicacion
- components/     -> Componentes React
- lib/            -> Librerias y utilidades
- styles/         -> Estilos CSS
- Archivos de configuracion

## Pasos para desplegar

1. Subir archivos al servidor
   Sube todo el contenido de este ZIP a: /var/www/davidzapata.es/errores_caldea/

2. Instalar dependencias
   cd /var/www/davidzapata.es/errores_caldea
   npm install --production

3. Configurar variables de entorno
   El archivo .env.local ya esta incluido. Verifica que las credenciales sean correctas.

4. Iniciar aplicacion con PM2
   pm2 start npm --name "errores_caldea" -- start
   pm2 save
   pm2 startup

5. Configurar proxy Apache/Nginx
   Ver DEPLOYMENT.md para configuracion completa.

## Verificar despliegue
Visita: https://davidzapata.es/errores_caldea/

## Solucion de problemas
- Ver logs: pm2 logs errores_caldea
- Reiniciar: pm2 restart errores_caldea
- Estado: pm2 status
'@

Set-Content -Path (Join-Path $tempDir "README-DEPLOY.txt") -Value $readmeContent
Write-Host "  README-DEPLOY.txt creado" -ForegroundColor Gray

# Crear archivo ZIP
Write-Host "`nCreando archivo ZIP..." -ForegroundColor Cyan
Compress-Archive -Path "$tempDir\*" -DestinationPath $zipPath -Force

# Limpiar carpeta temporal
Remove-Item $tempDir -Recurse -Force

# Mostrar información
$zipSize = (Get-Item $zipPath).Length / 1MB
Write-Host "`nEmpaquetado completado!" -ForegroundColor Green
Write-Host "`nArchivo creado: $zipName" -ForegroundColor Yellow
Write-Host "Tamanio: $([math]::Round($zipSize, 2)) MB" -ForegroundColor Yellow
Write-Host "Ubicacion: $zipPath" -ForegroundColor Yellow

Write-Host "`nProximos pasos:" -ForegroundColor Cyan
Write-Host "  1. Sube el archivo ZIP al servidor" -ForegroundColor White
Write-Host "  2. Descomprime en /var/www/davidzapata.es/errores_caldea/" -ForegroundColor White
Write-Host "  3. Ejecuta: npm install --production" -ForegroundColor White
Write-Host "  4. Inicia con PM2 (ver README-DEPLOY.txt)" -ForegroundColor White
Write-Host "  5. Configura el proxy (ver DEPLOYMENT.md)" -ForegroundColor White

Write-Host "`nListo para desplegar!" -ForegroundColor Green
