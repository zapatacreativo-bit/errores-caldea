# Guía Completa de Despliegue en Servidor

Esta guía te ayudará a desplegar el proyecto paso a paso en tu servidor.

## 📦 Paso 1: Subir el Archivo ZIP al Servidor

### Opción A: Usando FTP/SFTP (FileZilla, WinSCP)

1. **Abre tu cliente FTP** (FileZilla, WinSCP, etc.)
2. **Conecta a tu servidor**:
   - Host: `davidzapata.es` o la IP del servidor
   - Usuario: tu usuario FTP
   - Contraseña: tu contraseña FTP
   - Puerto: 21 (FTP) o 22 (SFTP)

3. **Navega a la carpeta del sitio**:
   ```
   /var/www/davidzapata.es/
   o
   /home/usuario/public_html/
   ```

4. **Crea la carpeta `errores_caldea`** si no existe

5. **Sube el archivo ZIP**:
   - Arrastra `errores_caldea-deploy-XXXXXXXX.zip` a la carpeta `/var/www/davidzapata.es/`

### Opción B: Usando SSH/SCP

```bash
# Desde tu PC (PowerShell o CMD)
scp errores_caldea-deploy-*.zip usuario@davidzapata.es:/var/www/davidzapata.es/
```

---

## 🗜️ Paso 2: Descomprimir el Archivo

### Opción A: Usando SSH

1. **Conecta por SSH**:
   ```bash
   ssh usuario@davidzapata.es
   ```

2. **Navega a la carpeta**:
   ```bash
   cd /var/www/davidzapata.es/
   ```

3. **Descomprime el archivo**:
   ```bash
   unzip errores_caldea-deploy-*.zip -d errores_caldea/
   ```

4. **Verifica que se descomprimió correctamente**:
   ```bash
   ls -la errores_caldea/
   ```

   Deberías ver:
   ```
   .next/
   pages/
   components/
   lib/
   styles/
   package.json
   next.config.js
   .env.local
   README-DEPLOY.txt
   ```

### Opción B: Usando cPanel

1. **Inicia sesión en cPanel**
2. Ve a **Administrador de archivos**
3. Navega a `/public_html/` o la carpeta de tu sitio
4. Selecciona el archivo ZIP
5. Haz clic en **Extraer**
6. Selecciona la carpeta destino: `errores_caldea/`

---

## 📦 Paso 3: Instalar Dependencias de Node.js

### Verificar que Node.js está instalado

```bash
# Conecta por SSH
ssh usuario@davidzapata.es

# Verifica la versión de Node.js
node --version
# Debe ser v18 o superior

# Verifica npm
npm --version
```

### Si Node.js NO está instalado

**En Ubuntu/Debian:**
```bash
# Instalar Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**En CentOS/RHEL:**
```bash
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
```

### Instalar dependencias del proyecto

```bash
# Navega a la carpeta del proyecto
cd /var/www/davidzapata.es/errores_caldea/

# Instala las dependencias (solo producción)
npm install --production

# Esto puede tardar 2-3 minutos
```

---

## 🚀 Paso 4: Iniciar la Aplicación con PM2

### Instalar PM2 (si no está instalado)

```bash
# Instalar PM2 globalmente
sudo npm install -g pm2
```

### Iniciar la aplicación

```bash
# Asegúrate de estar en la carpeta del proyecto
cd /var/www/davidzapata.es/errores_caldea/

# Inicia la aplicación con PM2
pm2 start npm --name "errores_caldea" -- start

# Verifica que está corriendo
pm2 status
```

Deberías ver algo como:
```
┌─────┬──────────────────┬─────────┬─────────┬──────────┐
│ id  │ name             │ status  │ restart │ uptime   │
├─────┼──────────────────┼─────────┼─────────┼──────────┤
│ 0   │ errores_caldea   │ online  │ 0       │ 5s       │
└─────┴──────────────────┴─────────┴─────────┴──────────┘
```

### Configurar PM2 para auto-inicio

```bash
# Guarda la configuración actual
pm2 save

# Configura PM2 para iniciarse al arrancar el servidor
pm2 startup

# Copia y ejecuta el comando que te muestra PM2
# Será algo como:
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u usuario --hp /home/usuario
```

### Comandos útiles de PM2

```bash
# Ver logs en tiempo real
pm2 logs errores_caldea

# Reiniciar la aplicación
pm2 restart errores_caldea

# Detener la aplicación
pm2 stop errores_caldea

# Ver estado
pm2 status

# Monitorear recursos
pm2 monit
```

---

## 🌐 Paso 5: Configurar el Servidor Web (Apache/Nginx)

La aplicación Next.js ahora está corriendo en `http://localhost:3000/errores_caldea/`

Necesitas configurar tu servidor web para hacer proxy a esta aplicación.

### Opción A: Apache (con mod_proxy)

1. **Habilita los módulos necesarios**:
   ```bash
   sudo a2enmod proxy
   sudo a2enmod proxy_http
   sudo a2enmod rewrite
   sudo systemctl restart apache2
   ```

2. **Edita el VirtualHost de tu sitio**:
   ```bash
   sudo nano /etc/apache2/sites-available/davidzapata.es.conf
   ```

3. **Añade esta configuración dentro de `<VirtualHost *:80>`**:
   ```apache
   <Location /errores_caldea>
       ProxyPass http://localhost:3000/errores_caldea
       ProxyPassReverse http://localhost:3000/errores_caldea
       ProxyPreserveHost On
   </Location>
   ```

4. **Reinicia Apache**:
   ```bash
   sudo systemctl restart apache2
   ```

### Opción B: Nginx

1. **Edita la configuración de tu sitio**:
   ```bash
   sudo nano /etc/nginx/sites-available/davidzapata.es
   ```

2. **Añade esta configuración dentro del bloque `server`**:
   ```nginx
   location /errores_caldea/ {
       proxy_pass http://localhost:3000/errores_caldea/;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
       proxy_cache_bypass $http_upgrade;
   }
   ```

3. **Verifica la configuración**:
   ```bash
   sudo nginx -t
   ```

4. **Reinicia Nginx**:
   ```bash
   sudo systemctl restart nginx
   ```

### Opción C: cPanel con Proxy (si tienes acceso)

1. **Inicia sesión en cPanel**
2. Busca **"Application Manager"** o **"Setup Node.js App"**
3. Configura:
   - **Application Root**: `/errores_caldea`
   - **Application URL**: `https://davidzapata.es/errores_caldea`
   - **Application Startup File**: `node_modules/next/dist/bin/next`
   - **Arguments**: `start`

---

## ✅ Paso 6: Verificar el Despliegue

1. **Abre tu navegador** y visita:
   ```
   https://davidzapata.es/errores_caldea/
   ```

2. **Verifica que:**
   - La página carga correctamente
   - Los estilos CSS se aplican
   - No hay errores 404 en la consola del navegador (F12)
   - Puedes navegar entre páginas

3. **Si hay problemas**, revisa los logs:
   ```bash
   # Logs de PM2
   pm2 logs errores_caldea
   
   # Logs de Apache
   sudo tail -f /var/log/apache2/error.log
   
   # Logs de Nginx
   sudo tail -f /var/log/nginx/error.log
   ```

---

## 🔧 Solución de Problemas Comunes

### Error: "Cannot find module"
```bash
cd /var/www/davidzapata.es/errores_caldea/
npm install --production
pm2 restart errores_caldea
```

### Error: Puerto 3000 ya en uso
```bash
# Ver qué proceso usa el puerto 3000
sudo lsof -i :3000

# Detener PM2 y reiniciar
pm2 delete errores_caldea
pm2 start npm --name "errores_caldea" -- start
```

### Error 502 Bad Gateway
- Verifica que PM2 esté corriendo: `pm2 status`
- Verifica que la aplicación esté en el puerto 3000: `pm2 logs errores_caldea`
- Reinicia el servidor web: `sudo systemctl restart apache2` o `sudo systemctl restart nginx`

### CSS/JS no cargan (Error 404)
- Verifica que `basePath` esté en `next.config.js`
- Verifica que la configuración del proxy sea correcta
- Limpia la caché del navegador (Ctrl + Shift + R)

---

## 📞 Necesitas Ayuda?

Si tienes problemas con algún paso, dime:
1. ¿En qué paso estás?
2. ¿Qué error ves?
3. ¿Qué tipo de servidor web usas (Apache/Nginx)?
4. ¿Tienes acceso SSH o solo cPanel?
