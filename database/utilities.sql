-- ============================================
-- SCRIPT DE IMPORTACIÓN MASIVA DE URLs
-- ============================================
-- Este script es un ejemplo de cómo importar URLs desde un CSV

-- PASO 1: Preparar tu archivo CSV con el siguiente formato:
-- issue_type_id,url,linked_from
-- 1,https://caldea.com/pagina-rota-1,https://caldea.com/origen-1
-- 1,https://caldea.com/pagina-rota-2,https://caldea.com/origen-2

-- PASO 2: Usar la interfaz de Supabase para importar el CSV
-- Dashboard > Table Editor > audit_urls > Import data from CSV

-- PASO 3: O usar este script SQL para insertar datos de ejemplo

-- Ejemplo: Insertar URLs de error 404 (issue_type_id = 1)
INSERT INTO audit_urls (issue_type_id, url, linked_from, status) VALUES
(1, 'https://caldea.com/video-vimeo-eliminado-1', 'https://caldea.com/blog/articulo-1', 'pending'),
(1, 'https://caldea.com/video-vimeo-eliminado-2', 'https://caldea.com/blog/articulo-2', 'pending'),
(1, 'https://facebook.com/caldea/video-no-disponible', 'https://caldea.com/redes-sociales', 'pending');

-- Ejemplo: Insertar imágenes sin ALT (issue_type_id = 12)
INSERT INTO audit_urls (issue_type_id, url, linked_from, status) VALUES
(12, 'https://caldea.com/images/spa-1.jpg', 'https://caldea.com/servicios/spa', 'pending'),
(12, 'https://caldea.com/images/piscina-2.jpg', 'https://caldea.com/instalaciones', 'pending');

-- ============================================
-- CONSULTAS ÚTILES PARA ANÁLISIS
-- ============================================

-- Ver progreso por categoría
SELECT * FROM v_category_progress;

-- Ver estadísticas de todos los tipos de error
SELECT * FROM v_issue_stats;

-- URLs pendientes de alta prioridad
SELECT 
  au.url,
  au.linked_from,
  it.title AS issue_type,
  it.priority
FROM audit_urls au
JOIN issue_types it ON au.issue_type_id = it.id
WHERE au.status = 'pending' 
  AND it.priority = 'High'
ORDER BY it.id;

-- Usuarios más activos (quién ha corregido más errores)
SELECT 
  u.email,
  COUNT(*) AS fixes_count
FROM audit_urls au
JOIN auth.users u ON au.fixed_by = u.id
WHERE au.status = 'fixed'
GROUP BY u.email
ORDER BY fixes_count DESC;

-- Progreso diario de correcciones
SELECT 
  DATE(fixed_at) AS date,
  COUNT(*) AS fixes_count
FROM audit_urls
WHERE status = 'fixed'
  AND fixed_at IS NOT NULL
GROUP BY DATE(fixed_at)
ORDER BY date DESC;
