# Guía de Despliegue - Dashboard de Auditoría SEO

Esta guía te ayudará a desplegar la aplicación en producción.

## 📋 Pre-requisitos

- Cuenta en [Supabase](https://supabase.com)
- Cuenta en [Vercel](https://vercel.com) (recomendado) o tu plataforma preferida
- Repositorio Git (GitHub, GitLab, Bitbucket)

## 🗄️ Paso 1: Configurar Base de Datos en Supabase

### 1.1 Crear Proyecto

1. Ve a [app.supabase.com](https://app.supabase.com)
2. Haz clic en "New Project"
3. Completa los datos:
   - **Name**: `caldea-seo-audit`
   - **Database Password**: Genera una contraseña segura (guárdala)
   - **Region**: Elige la más cercana a tus usuarios
4. Espera a que el proyecto se cree (2-3 minutos)

### 1.2 Ejecutar Schema SQL

1. En el panel de Supabase, ve a **SQL Editor**
2. Haz clic en "New Query"
3. Copia y pega el contenido completo de `database/schema.sql`
4. Haz clic en "Run" (▶️)
5. Verifica que no haya errores

### 1.3 Obtener Credenciales

1. Ve a **Settings** > **API**
2. Copia los siguientes valores:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGc...` (clave larga)

## 🚀 Paso 2: Desplegar en Vercel

### 2.1 Preparar Repositorio

```bash
# Inicializar Git (si no lo has hecho)
git init
git add .
git commit -m "Initial commit: SEO Audit Dashboard"

# Subir a GitHub
git remote add origin https://github.com/tu-usuario/caldea-seo-audit.git
git branch -M main
git push -u origin main
```

### 2.2 Conectar con Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Haz clic en "Add New Project"
3. Importa tu repositorio de GitHub
4. Configura el proyecto:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### 2.3 Configurar Variables de Entorno

En la sección "Environment Variables" de Vercel, añade:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### 2.4 Desplegar

1. Haz clic en "Deploy"
2. Espera a que termine el build (2-3 minutos)
3. Tu aplicación estará disponible en `https://tu-proyecto.vercel.app`

## 🌐 Paso 2B: Desplegar en Subdirectorio (davidzapata.es/errores_caldea/)

Si necesitas desplegar en un subdirectorio de tu dominio existente en lugar de Vercel:

### 2B.1 Configuración de Next.js

El proyecto ya está configurado con:

```javascript
// next.config.js
basePath: '/errores_caldea',
assetPrefix: '/errores_caldea',
```

### 2B.2 Build para Producción

```bash
# Instalar dependencias
npm install

# Crear build de producción
npm run build

# Iniciar servidor (para pruebas locales)
npm run start
```

### 2B.3 Subir al Servidor

Necesitas subir los siguientes archivos/carpetas al servidor:

```
/errores_caldea/
├── .next/          (carpeta completa del build)
├── public/         (archivos estáticos)
├── package.json
├── package-lock.json
├── next.config.js
└── node_modules/   (o ejecutar npm install en el servidor)
```

### 2B.4 Configurar Servidor Web

#### Para Apache (.htaccess)

Crea un archivo `.htaccess` en `/errores_caldea/`:

```apache
# Reescribir todas las peticiones a Next.js
RewriteEngine On
RewriteBase /errores_caldea/

# Si el archivo/directorio existe, servir directamente
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d

# Redirigir todo a Next.js en el puerto 3000
RewriteRule ^(.*)$ http://localhost:3000/errores_caldea/$1 [P,L]
```

#### Para Nginx

Añade a tu configuración de nginx:

```nginx
location /errores_caldea/ {
    proxy_pass http://localhost:3000/errores_caldea/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

### 2B.5 Ejecutar Next.js en el Servidor

Necesitas mantener Next.js ejecutándose en el servidor:

#### Opción A: PM2 (Recomendado)

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar aplicación
cd /ruta/a/errores_caldea
pm2 start npm --name "errores_caldea" -- start

# Guardar configuración para auto-inicio
pm2 save
pm2 startup
```

#### Opción B: systemd

Crea `/etc/systemd/system/errores_caldea.service`:

```ini
[Unit]
Description=Errores Caldea Next.js App
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/davidzapata.es/errores_caldea
ExecStart=/usr/bin/npm start
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Luego:

```bash
sudo systemctl enable errores_caldea
sudo systemctl start errores_caldea
```

### 2B.6 Variables de Entorno en Servidor

Crea un archivo `.env.local` en el servidor con tus credenciales de Supabase:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

**⚠️ IMPORTANTE**: No subas el `.env.local` a Git. Créalo manualmente en el servidor.


## 👥 Paso 3: Crear Usuarios

### Opción A: Registro Manual

1. Ve a tu aplicación desplegada
2. Haz clic en "Regístrate"
3. Ingresa email y contraseña
4. Confirma el email (revisa tu bandeja)

### Opción B: Crear Usuarios desde Supabase

1. En Supabase, ve a **Authentication** > **Users**
2. Haz clic en "Add user"
3. Ingresa email y contraseña
4. Marca "Auto Confirm User" si no quieres enviar email

## 📊 Paso 4: Importar Datos de Auditoría

### 4.1 Preparar CSV

Crea un archivo CSV con el siguiente formato:

```csv
issue_type_id,url,linked_from
1,https://caldea.com/pagina-404-1,https://caldea.com/origen-1
1,https://caldea.com/pagina-404-2,https://caldea.com/origen-2
12,https://caldea.com/images/sin-alt-1.jpg,https://caldea.com/galeria
```

### 4.2 Importar en Supabase

1. Ve a **Table Editor** > `audit_urls`
2. Haz clic en "Insert" > "Import data from CSV"
3. Selecciona tu archivo CSV
4. Mapea las columnas correctamente
5. Haz clic en "Import"

### 4.3 Verificar Importación

```sql
-- En SQL Editor, ejecuta:
SELECT COUNT(*) FROM audit_urls;
SELECT status, COUNT(*) FROM audit_urls GROUP BY status;
```

## 🔒 Paso 5: Seguridad (Opcional pero Recomendado)

### 5.1 Configurar Email Personalizado

1. En Supabase, ve a **Authentication** > **Email Templates**
2. Personaliza los templates de:
   - Confirmación de email
   - Recuperación de contraseña
   - Cambio de email

### 5.2 Configurar Dominio Personalizado en Vercel

1. Ve a tu proyecto en Vercel
2. **Settings** > **Domains**
3. Añade tu dominio (ej: `audit.caldea.com`)
4. Configura los DNS según las instrucciones

### 5.3 Habilitar CAPTCHA (Anti-spam)

1. En Supabase, ve a **Authentication** > **Settings**
2. Activa "Enable Captcha protection"
3. Configura con hCaptcha o reCAPTCHA

## 🔄 Paso 6: Actualizaciones Futuras

### Despliegue Automático

Vercel desplegará automáticamente cada vez que hagas push a `main`:

```bash
git add .
git commit -m "Descripción de cambios"
git push origin main
```

### Rollback

Si algo sale mal:

1. Ve a tu proyecto en Vercel
2. **Deployments**
3. Encuentra el deployment anterior que funcionaba
4. Haz clic en "..." > "Promote to Production"

## 📈 Paso 7: Monitoreo

### Analytics en Vercel

1. Ve a tu proyecto > **Analytics**
2. Revisa:
   - Visitas
   - Rendimiento (Core Web Vitals)
   - Errores

### Logs en Supabase

1. Ve a **Logs** > **API Logs**
2. Revisa consultas lentas o errores

## 🆘 Solución de Problemas

### Error: "Missing environment variables"

- Verifica que las variables estén en Vercel
- Asegúrate de que empiecen con `NEXT_PUBLIC_`
- Redeploy después de añadirlas

### Error: "Failed to fetch"

- Verifica que la URL de Supabase sea correcta
- Comprueba que RLS esté configurado correctamente
- Revisa los logs en Supabase

### Error: "Authentication failed"

- Verifica que el usuario esté confirmado
- Comprueba que la contraseña sea correcta
- Revisa las políticas de RLS

## 📞 Soporte

Para problemas técnicos:
- [Documentación de Vercel](https://vercel.com/docs)
- [Documentación de Supabase](https://supabase.com/docs)
- [Comunidad de Next.js](https://github.com/vercel/next.js/discussions)

---

**¡Listo!** Tu dashboard de auditoría SEO está en producción 🎉
