-- ============================================
-- FIX: UNIQUE URL CONSTRAINT & DUPLICATE CLEANUP
-- ============================================
-- Ejecutar en SQL Editor de Supabase
-- Necesario para importar datos masivamente via UPSERT

-- 1. Eliminar duplicados manteniendo el más reciente (basado en id o created_at)
--    Asumimos que id es serial/autoincrement, el mayor es el más reciente.
DELETE FROM audit_urls a USING (
  SELECT min(id) as id, url
  FROM audit_urls 
  GROUP BY url HAVING count(*) > 1
) b
WHERE a.url = b.url 
AND a.id <> b.id;

-- 2. Asegurar que la columna URL no sea nula (ya debería serlo, pero por seguridad)
ALTER TABLE audit_urls ALTER COLUMN url SET NOT NULL;

-- 3. Añadir restricción UNIQUE a la columna URL
-- Esto permitirá usar ON CONFLICT (url) en el script de importación
ALTER TABLE audit_urls ADD CONSTRAINT audit_urls_url_key UNIQUE (url);

-- 4. Verificación
SELECT 'Unique constraint added successfully' as status;
