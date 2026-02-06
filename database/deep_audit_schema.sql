-- ============================================
-- DEEP AUDIT SCHEMA EXTENSION
-- ============================================
-- Ejecutar en SQL Editor de Supabase

-- 1. Añadir columnas de auditoría profunda a audit_urls
ALTER TABLE audit_urls 
ADD COLUMN IF NOT EXISTS status_code INTEGER,
ADD COLUMN IF NOT EXISTS content_type TEXT,
ADD COLUMN IF NOT EXISTS indexability TEXT,
ADD COLUMN IF NOT EXISTS indexability_status TEXT,
ADD COLUMN IF NOT EXISTS depth_level INTEGER,
ADD COLUMN IF NOT EXISTS internal_links_count INTEGER,
ADD COLUMN IF NOT EXISTS unique_internal_links INTEGER,
ADD COLUMN IF NOT EXISTS outlinks_count INTEGER,
ADD COLUMN IF NOT EXISTS word_count INTEGER,
ADD COLUMN IF NOT EXISTS response_time FLOAT,
ADD COLUMN IF NOT EXISTS last_modified TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS canonical_url TEXT,
ADD COLUMN IF NOT EXISTS meta_robots TEXT,
ADD COLUMN IF NOT EXISTS title_width INTEGER,
ADD COLUMN IF NOT EXISTS meta_desc_width INTEGER;

-- 2. Crear índices para filtros rápidos
CREATE INDEX IF NOT EXISTS idx_audit_urls_depth ON audit_urls(depth_level);
CREATE INDEX IF NOT EXISTS idx_audit_urls_internal_links ON audit_urls(internal_links_count);
CREATE INDEX IF NOT EXISTS idx_audit_urls_word_count ON audit_urls(word_count);
CREATE INDEX IF NOT EXISTS idx_audit_urls_status_code ON audit_urls(status_code);

-- 3. Vista de análisis de calidad de contenido
CREATE OR REPLACE VIEW v_content_quality AS
SELECT 
  COUNT(*) as total_pages,
  COUNT(*) FILTER (WHERE word_count < 300) as thin_content_pages,
  COUNT(*) FILTER (WHERE depth_level > 3) as deep_pages,
  AVG(word_count)::numeric(10,2) as avg_word_count,
  AVG(internal_links_count)::numeric(10,2) as avg_internal_links,
  COUNT(*) FILTER (WHERE indexability = 'No indexable') as non_indexable_pages
FROM audit_urls
WHERE issue_type_id = 16 OR issue_type_id = 1; -- Filtramos por tipos relevantes si es necesario

-- 4. Actualizar prioridades basado en nuevos datos (Algoritmo V2)
-- Esto se ejecutará manualmente o por trigger, aquí dejamos la consulta preparada
-- UPDATE audit_urls SET priority = 'critical' WHERE internal_links_count > 50 AND depth_level <= 2;
-- UPDATE audit_urls SET priority = 'high' WHERE internal_links_count BETWEEN 20 AND 50;
-- UPDATE audit_urls SET priority = 'low' WHERE word_count < 100 AND status_code = 200;

SELECT 'Deep Audit columns added successfully' as status;
