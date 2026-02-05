# Guía de Importación de Datos Reales a Supabase

Esta guía te explica cómo importar tus datos de auditoría (Screaming Frog, Semrush, etc.) a la base de datos para que aparezcan en la aplicación.

## 1. Preparar tu archivo CSV

Necesitas crear un archivo CSV (Excel: Guardar como > CSV delimitado por comas) con las siguientes **columnas exactas**:

| issue_type_id | url | linked_from |
|---------------|-----|-------------|
| 1             | https://caldea.com/error-404 | https://caldea.com/origen |
| 1             | https://caldea.com/otro-error | https://caldea.com/home |

### ¿Qué ID usar para `issue_type_id`?

Aquí tienes la lista de IDs disponibles en tu base de datos actual. Usa estos números para categorizar cada URL:

**Indexación**
- `1` : Errores 4xx (Enlaces rotos)
- `2` : Errores 5xx (Servidor)
- `3` : Páginas restringidas (Robots/Noindex)

**Técnico**
- `4` : Redirecciones 302 (Temporales)
- `5` : Redirecciones 301 (Permanentes)
- `6` : Cadenas de redirección largas

**Contenido**
- `7` : Títulos duplicados
- `8` : Títulos vacíos
- `9` : Meta descripciones duplicadas
- `10` : Títulos/Metas demasiado largos

**Imágenes**
- `11` : Imágenes rotas
- `12` : Texto ALT vacío

**Localización**
- `13` : Enlaces de retorno perdidos (Hreflang)
- `14` : Falta valor "x-default" (Hreflang)

**Enlaces**
- `15` : Enlaces de retroceso

> **Nota:** Si tienes miles de filas, puedes hacer varios CSVs (uno por cada tipo de error) para que sea más fácil poner el ID, o usar fórmulas en Excel.

---

## 2. Importar en Supabase

### Opción A: Script Automático (Recomendado)

Hemos creado un script para facilitar este proceso.

1. Asegúrate de tener tu archivo `.env.local` configurado con las credenciales de Supabase.
   > **Nota Importante:** Para que el script tenga permisos de escritura, debes añadir tu `SUPABASE_SERVICE_ROLE_KEY` en `.env.local`:
   > `SUPABASE_SERVICE_ROLE_KEY=eyJh...`
   > (Puedes encontrar esta clave en Supabase > Settings > API > service_role)

2. Ejecuta el siguiente comando en la terminal:

```bash
npm run import-data -- "nombre-de-tu-archivo.csv"
```

*Si no especificas archivo, buscará `sample_issues_import.csv` por defecto.*

### Opción B: Importación Manual

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. En el menú lateral, ve a **Table Editor**
3. Haz clic en la tabla `audit_urls`
4. Haz clic en el botón **Insert** (arriba a la derecha) y selecciona **Import data from CSV**
5. Arrastra tu archivo CSV preparado
6. **Importante:** Asegúrate de que las columnas coincidan:
   - Tu columna `issue_type_id` --> Campo `issue_type_id` (number)
   - Tu columna `url` --> Campo `url` (text)
   - Tu columna `linked_from` --> Campo `linked_from` (text)
7. Haz clic en **Import data**

---

## 3. Verificar en la App

1. Ve a tu aplicación desplegada (ej. `https://errores-caldea.vercel.app`)
2. Entra en una categoría (ej. "Errores 4xx")
3. ¡Ya deberían aparecer tus URLs!

---

## 💡 Consejo Pro: SQL para actualizar contadores

Después de importar muchas URLs, los contadores del Dashboard (el número total 2985, etc.) podrían no coincidir si importaste una cantidad diferente.

Para recalcular los totales reales automáticamente, ve al **SQL Editor** en Supabase y ejecuta esto:

```sql
UPDATE issue_types it
SET total_count = (
    SELECT COUNT(*) 
    FROM audit_urls au 
    WHERE au.issue_type_id = it.id
);
```

¡Esto sincronizará los números del dashboard con las URLs reales que acabas de subir!
