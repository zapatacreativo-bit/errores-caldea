-- ============================================
-- MIGRATION DASHBOARD SCHEMA
-- ============================================
-- Ejecutar en SQL Editor de Supabase

-- 1. Añadir columnas de migración a audit_urls
ALTER TABLE audit_urls 
ADD COLUMN IF NOT EXISTS redirect_destination TEXT,
ADD COLUMN IF NOT EXISTS redirect_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low'));

-- 2. Crear índice para prioridad
CREATE INDEX IF NOT EXISTS idx_audit_urls_priority ON audit_urls(priority);

-- 3. Tabla de checklist técnico de migración
CREATE TABLE IF NOT EXISTS migration_checklist (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL,
  item_name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'verified', 'error')),
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Insertar items de checklist por defecto
INSERT INTO migration_checklist (category, item_name, description) VALUES
-- Técnico
('technical', 'robots.txt', 'Verificar que robots.txt permite indexación correcta'),
('technical', 'sitemap.xml', 'Generar y verificar sitemap.xml actualizado'),
('technical', 'SSL/HTTPS', 'Verificar certificado SSL y redirección HTTP→HTTPS'),
('technical', 'Canonical URLs', 'Verificar etiquetas canonical en todas las páginas'),
('technical', 'Meta Robots', 'Revisar meta robots (noindex, nofollow)'),
('technical', 'hreflang Tags', 'Configurar hreflang para idiomas (ES, FR, CA, EN)'),
('technical', 'Schema Markup', 'Preservar/actualizar datos estructurados'),
('technical', 'Core Web Vitals', 'Medir LCP, FID, CLS baseline'),
-- Contenido
('content', 'Page Titles', 'Verificar títulos únicos y optimizados'),
('content', 'Meta Descriptions', 'Verificar meta descriptions únicas'),
('content', 'H1 Tags', 'Un H1 único por página'),
('content', 'Image Alt Text', 'Alt text descriptivo en imágenes'),
('content', 'Internal Links', 'Actualizar enlaces internos'),
-- Redirecciones
('redirects', 'Mapa 301', 'Crear mapa completo de redirecciones'),
('redirects', 'Verificar 301s', 'Probar todas las redirecciones'),
('redirects', 'Cadenas 301', 'Eliminar cadenas de redirección'),
('redirects', 'Backlinks', 'Verificar backlinks principales')
ON CONFLICT DO NOTHING;

-- 5. Vista de progreso de migración
CREATE OR REPLACE VIEW v_migration_progress AS
WITH url_stats AS (
  SELECT 
    priority,
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE status = 'fixed') AS fixed,
    COUNT(*) FILTER (WHERE redirect_destination IS NOT NULL) AS with_redirect,
    COUNT(*) FILTER (WHERE redirect_verified = true) AS verified_redirects
  FROM audit_urls
  GROUP BY priority
),
checklist_stats AS (
  SELECT
    category,
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE status = 'verified') AS verified,
    COUNT(*) FILTER (WHERE status = 'error') AS errors
  FROM migration_checklist
  GROUP BY category
)
SELECT 
  'urls' AS section,
  priority AS category,
  total,
  fixed AS completed,
  ROUND((fixed::numeric / NULLIF(total, 0)) * 100, 1) AS percentage
FROM url_stats
UNION ALL
SELECT 
  'checklist' AS section,
  category,
  total,
  verified AS completed,
  ROUND((verified::numeric / NULLIF(total, 0)) * 100, 1) AS percentage
FROM checklist_stats;

-- 6. Vista resumen general
CREATE OR REPLACE VIEW v_migration_summary AS
SELECT
  (SELECT COUNT(*) FROM audit_urls) AS total_urls,
  (SELECT COUNT(*) FROM audit_urls WHERE status = 'fixed') AS urls_fixed,
  (SELECT COUNT(*) FROM audit_urls WHERE redirect_destination IS NOT NULL) AS urls_with_redirect,
  (SELECT COUNT(*) FROM audit_urls WHERE redirect_verified = true) AS redirects_verified,
  (SELECT COUNT(*) FROM audit_urls WHERE priority = 'critical') AS critical_urls,
  (SELECT COUNT(*) FROM audit_urls WHERE priority = 'critical' AND status = 'fixed') AS critical_fixed,
  (SELECT COUNT(*) FROM migration_checklist) AS total_checklist,
  (SELECT COUNT(*) FROM migration_checklist WHERE status = 'verified') AS checklist_verified;

-- 7. Habilitar RLS en migration_checklist
ALTER TABLE migration_checklist ENABLE ROW LEVEL SECURITY;

-- 8. Políticas para migration_checklist
CREATE POLICY "Authenticated users can view checklist" ON migration_checklist
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can update checklist" ON migration_checklist
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('superadmin', 'admin'))
  );

-- 9. Verificación
SELECT 'Migration schema created successfully!' AS status;
SELECT * FROM migration_checklist LIMIT 5;
