-- ============================================
-- MIGRACIÓN: TIPO DE ERROR ID 16 - AUDITORÍA ON-PAGE SEO
-- ============================================
-- Ejecutar en SQL Editor de Supabase

-- 1. Añadir columnas adicionales a audit_urls para datos On-Page
ALTER TABLE audit_urls ADD COLUMN IF NOT EXISTS page_title TEXT;
ALTER TABLE audit_urls ADD COLUMN IF NOT EXISTS meta_description TEXT;
ALTER TABLE audit_urls ADD COLUMN IF NOT EXISTS h1 TEXT;

-- 2. Insertar el nuevo tipo de error con ID 16 explícito
-- Primero, ajustar la secuencia si es necesario
SELECT setval('issue_types_id_seq', GREATEST((SELECT MAX(id) FROM issue_types), 16));

-- Insertar con ID forzado
INSERT INTO issue_types (id, category_id, title, priority, description, total_count) 
VALUES (
  16, -- ID forzado
  3,  -- Categoría: Contenido
  'Auditoría On-Page SEO', 
  'Medium', 
  'Revisión de títulos, meta descripciones y H1 de las páginas principales.',
  0
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- 3. Verificar que se creó correctamente
SELECT id, title, priority FROM issue_types WHERE title LIKE '%On-Page%';

-- ============================================
-- EJEMPLO DE INSERCIÓN DE DATOS
-- ============================================
-- INSERT INTO audit_urls (issue_type_id, url, page_title, meta_description, h1, status) VALUES
-- (16, 'https://caldea.com/spa', 'Spa Caldea - Relax Total', 'Descubre nuestro spa...', 'Bienvenido al Spa', 'pending'),
-- (16, 'https://caldea.com/tarifas', 'Precios y Tarifas', 'Consulta nuestros precios...', 'Tarifas 2026', 'pending');
