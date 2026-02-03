# Dashboard de Gestión de Auditoría SEO - Caldea.com

Sistema web interactivo para gestionar y corregir los más de 131,000 problemas detectados en la auditoría SEO de Caldea.com.

## 🚀 Características

- **Dashboard Interactivo**: Visualización de errores por categoría y prioridad
- **Gestión de Tareas**: Marcar URLs como corregidas, pendientes o ignoradas
- **Filtros Avanzados**: Filtrar por prioridad, estado y categoría
- **Progreso en Tiempo Real**: Seguimiento del porcentaje de corrección
- **Autenticación Segura**: Sistema de login con Supabase Auth
- **Base de Datos Relacional**: PostgreSQL con Row Level Security (RLS)

## 📊 Estadísticas de la Auditoría

- **Total de Problemas**: 131,023
- **Errores Críticos (Alta)**: 4,050
- **Alertas (Media)**: 16,431
- **Información (Baja)**: 110,542

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 14 + React
- **Estilos**: Tailwind CSS
- **Backend/Base de Datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **Estado**: TanStack Query (React Query)

## 📁 Estructura del Proyecto

```
errores_caldea/
├── components/
│   ├── AuditDashboard.js      # Dashboard principal con KPIs
│   └── URLFixer.js             # Componente para marcar URLs como corregidas
├── database/
│   └── schema.sql              # Esquema completo de la base de datos
├── lib/
│   └── supabaseClient.js       # Cliente de Supabase
├── pages/
│   ├── _app.js                 # App wrapper con providers
│   ├── index.js                # Página principal con auth
│   └── fix/
│       └── [id].js             # Página de corrección por tipo de error
├── styles/
│   └── globals.css             # Estilos globales
├── .env.local.example          # Template de variables de entorno
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── next.config.js
└── tsconfig.json
```

## 🚦 Instalación y Configuración

### 1. Clonar el repositorio

```bash
cd errores_caldea
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar Supabase

1. Crea una cuenta en [Supabase](https://supabase.com)
2. Crea un nuevo proyecto
3. Ve al **SQL Editor** y ejecuta el script `database/schema.sql`
4. Copia las credenciales de tu proyecto

### 4. Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```bash
cp .env.local.example .env.local
```

Edita `.env.local` y añade tus credenciales de Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima-aqui
```

### 5. Ejecutar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📝 Uso

### Autenticación

1. Regístrate con tu email y contraseña
2. Confirma tu email (revisa tu bandeja de entrada)
3. Inicia sesión

### Dashboard

- **Vista General**: Visualiza KPIs de errores por prioridad
- **Filtros**: Filtra errores por prioridad (Alta, Media, Baja)
- **Tabla de Errores**: Lista completa de tipos de error con estadísticas

### Corrección de Errores

1. Haz clic en "Reparar" en cualquier tipo de error
2. Verás la lista de URLs afectadas
3. Marca el checkbox para marcar como **CORREGIDO**
4. Usa "Ignorar" para URLs que no requieren acción
5. Filtra por estado: Todos, Pendientes, Corregidos, Ignorados

## 🗄️ Base de Datos

### Tablas Principales

- **`categories`**: Categorías de errores (Indexación, Técnico, Contenido, etc.)
- **`issue_types`**: Tipos de problemas específicos
- **`audit_urls`**: URLs individuales con errores

### Vistas

- **`v_category_progress`**: Progreso por categoría
- **`v_issue_stats`**: Estadísticas por tipo de error

## 🔒 Seguridad

- **Row Level Security (RLS)** habilitado en todas las tablas
- Solo usuarios autenticados pueden ver y editar datos
- Políticas de acceso configuradas en Supabase

## 📦 Scripts Disponibles

```bash
npm run dev      # Ejecutar en modo desarrollo
npm run build    # Compilar para producción
npm start        # Ejecutar en producción
npm run lint     # Ejecutar linter
```

## 🎨 Componentes Principales

### AuditDashboard

Dashboard principal con:
- KPIs de prioridad (Alta, Media, Baja)
- Progreso global de corrección
- Tabla filtrable de tipos de error
- Navegación a páginas de corrección

### URLFixer

Componente de gestión de URLs con:
- Lista de URLs afectadas
- Checkbox para marcar como corregido
- Botón para ignorar URLs
- Filtros por estado
- Estadísticas en tiempo real

## 🚀 Despliegue

### Vercel (Recomendado)

1. Sube el proyecto a GitHub
2. Conecta tu repositorio en [Vercel](https://vercel.com)
3. Añade las variables de entorno en Vercel
4. Despliega

### Otros Proveedores

Compatible con cualquier plataforma que soporte Next.js:
- Netlify
- Railway
- AWS Amplify
- Google Cloud Run

## 📚 Recursos

- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de Supabase](https://supabase.com/docs)
- [Documentación de Tailwind CSS](https://tailwindcss.com/docs)
- [TanStack Query](https://tanstack.com/query/latest)

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es privado y está diseñado específicamente para Caldea.com.

## 📧 Contacto

Para soporte o consultas sobre el proyecto, contacta al equipo de desarrollo.

---

**Desarrollado con ❤️ para Caldea.com**
