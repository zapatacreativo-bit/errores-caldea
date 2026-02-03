# Guía de Despliegue en Vercel

Esta guía te ayudará a desplegar tu proyecto Next.js en Vercel de forma gratuita y sencilla.

## 📋 Pre-requisitos

- Cuenta en GitHub (gratis)
- Cuenta en Vercel (gratis)
- Tu proyecto ya está listo para desplegar ✅

---

## 🚀 Paso 1: Crear Repositorio en GitHub

### 1.1 Crear cuenta en GitHub (si no tienes)

1. Ve a [github.com](https://github.com)
2. Haz clic en **Sign up**
3. Completa el registro

### 1.2 Crear nuevo repositorio

1. Inicia sesión en GitHub
2. Haz clic en el botón **"+"** (arriba derecha) → **New repository**
3. Completa los datos:
   - **Repository name**: `errores-caldea`
   - **Description**: `Dashboard de Auditoría SEO para Caldea`
   - **Visibility**: Private (recomendado) o Public
   - **NO marques** "Initialize with README"
4. Haz clic en **Create repository**

### 1.3 Subir tu código a GitHub

Abre **PowerShell** en la carpeta de tu proyecto y ejecuta:

```powershell
# Navega a la carpeta del proyecto
cd "C:\Users\David Zapata\Desktop\ANTIGRAVITY  - Proyectos\errores_caldea"

# Inicializa Git (si no está inicializado)
git init

# Añade todos los archivos
git add .

# Crea el primer commit
git commit -m "Initial commit: SEO Audit Dashboard"

# Conecta con GitHub (reemplaza TU-USUARIO con tu usuario de GitHub)
git remote add origin https://github.com/TU-USUARIO/errores-caldea.git

# Cambia a la rama main
git branch -M main

# Sube el código a GitHub
git push -u origin main
```

**Nota**: GitHub te pedirá autenticación. Usa tu usuario y contraseña, o mejor aún, un **Personal Access Token** (te lo explicaré si lo necesitas).

---

## ☁️ Paso 2: Desplegar en Vercel

### 2.1 Crear cuenta en Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Haz clic en **Sign Up**
3. Selecciona **Continue with GitHub**
4. Autoriza a Vercel para acceder a tu cuenta de GitHub

### 2.2 Importar tu proyecto

1. En el dashboard de Vercel, haz clic en **Add New** → **Project**
2. Busca tu repositorio `errores-caldea`
3. Haz clic en **Import**

### 2.3 Configurar el proyecto

Vercel detectará automáticamente que es un proyecto Next.js. Configura:

- **Framework Preset**: Next.js (auto-detectado)
- **Root Directory**: `./` (dejar por defecto)
- **Build Command**: `npm run build` (auto-detectado)
- **Output Directory**: `.next` (auto-detectado)

### 2.4 Configurar Variables de Entorno

**MUY IMPORTANTE**: Añade tus credenciales de Supabase:

1. Haz clic en **Environment Variables**
2. Añade las siguientes variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://tthmcnforkhdjcvasohh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_X1BI8SxVf_kgWLs71N_-KQ_WJkKAkfu
```

**Importante**: Estas son las credenciales de tu archivo `.env.local`

### 2.5 Desplegar

1. Haz clic en **Deploy**
2. Espera 2-3 minutos mientras Vercel construye tu aplicación
3. ✅ ¡Listo! Tu aplicación estará disponible en una URL como:
   ```
   https://errores-caldea.vercel.app
   ```

---

## 🌐 Paso 3: Configurar Dominio Personalizado (Opcional)

Si quieres que tu aplicación esté en `https://errores.davidzapata.es` o similar:

### 3.1 Añadir dominio en Vercel

1. Ve a tu proyecto en Vercel
2. Haz clic en **Settings** → **Domains**
3. Añade tu dominio: `errores.davidzapata.es`
4. Vercel te dará instrucciones de DNS

### 3.2 Configurar DNS

En tu proveedor de dominio (donde compraste `davidzapata.es`):

1. Ve al panel de DNS
2. Añade un registro **CNAME**:
   - **Name**: `errores`
   - **Value**: `cname.vercel-dns.com`
   - **TTL**: 3600 (o automático)

3. Espera 5-10 minutos para que se propague
4. ✅ Tu aplicación estará en `https://errores.davidzapata.es`

---

## 🔄 Paso 4: Actualizaciones Futuras

### Despliegue Automático

Cada vez que hagas cambios y los subas a GitHub, Vercel desplegará automáticamente:

```powershell
# Haz tus cambios en el código
# Luego:

git add .
git commit -m "Descripción de los cambios"
git push origin main

# Vercel desplegará automáticamente en 2-3 minutos
```

### Ver el progreso del despliegue

1. Ve a [vercel.com/dashboard](https://vercel.com/dashboard)
2. Haz clic en tu proyecto
3. Verás el estado del despliegue en tiempo real

---

## 📊 Paso 5: Monitoreo y Logs

### Ver logs en tiempo real

1. Ve a tu proyecto en Vercel
2. Haz clic en **Deployments**
3. Selecciona el deployment activo
4. Haz clic en **View Function Logs**

### Analytics

Vercel incluye analytics gratis:
- Visitas
- Core Web Vitals
- Rendimiento
- Errores

---

## ✅ Verificación Final

1. **Abre tu aplicación** en la URL de Vercel
2. **Verifica que:**
   - ✅ La página carga correctamente
   - ✅ Los estilos CSS se aplican
   - ✅ Puedes iniciar sesión con Supabase
   - ✅ La navegación funciona
   - ✅ No hay errores en la consola (F12)

---

## 🆘 Solución de Problemas

### Error: "Missing environment variables"

1. Ve a **Settings** → **Environment Variables**
2. Verifica que las variables de Supabase estén configuradas
3. Redeploy: **Deployments** → **...** → **Redeploy**

### Error: "Build failed"

1. Ve a **Deployments** → Haz clic en el deployment fallido
2. Revisa los logs de build
3. Verifica que `package.json` tenga todas las dependencias

### Error: "Authentication failed"

1. Verifica que las credenciales de Supabase sean correctas
2. Ve a Supabase → **Settings** → **API**
3. Copia las credenciales nuevamente
4. Actualiza las variables de entorno en Vercel

---

## 💡 Ventajas de Vercel

✅ **Gratis** para proyectos personales
✅ **SSL/HTTPS** automático
✅ **CDN global** - tu app será rápida en todo el mundo
✅ **Despliegue automático** desde Git
✅ **Preview deployments** - cada PR tiene su propia URL de prueba
✅ **Rollback fácil** - vuelve a versiones anteriores con un clic
✅ **Zero downtime** - sin caídas durante despliegues

---

## 📞 ¿Necesitas Ayuda?

Si tienes problemas en algún paso, dime:
1. ¿En qué paso estás?
2. ¿Qué error ves?
3. Captura de pantalla si es posible

¡Estoy aquí para ayudarte! 🚀
