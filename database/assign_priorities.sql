-- ============================================
-- ASIGNACIÓN AUTOMÁTICA DE PRIORIDADES SEO
-- ============================================
-- Ejecutar en SQL Editor de Supabase

-- 1. Primero, resetear todas las prioridades a 'medium'
UPDATE audit_urls SET priority = 'medium';

-- ============================================
-- 🔴 PRIORIDAD CRÍTICA - Páginas esenciales
-- ============================================

-- Home y páginas principales
UPDATE audit_urls SET priority = 'critical'
WHERE url ILIKE '%caldea.com/'
   OR url ILIKE '%caldea.com/es/'
   OR url ILIKE '%caldea.com/fr/'
   OR url ILIKE '%caldea.com/en/'
   OR url ILIKE '%/spa%'
   OR url ILIKE '%/thermoludique%'
   OR url ILIKE '%/inuu%'
   OR url ILIKE '%/origins%'
   OR url ILIKE '%reserva%'
   OR url ILIKE '%booking%'
   OR url ILIKE '%tarifas%'
   OR url ILIKE '%precios%';

-- Backlinks importantes (Issue Type 1 - Enlaces de retroceso)
-- Los primeros 100 son probablemente los más importantes
UPDATE audit_urls SET priority = 'critical'
WHERE issue_type_id = 1 
AND id IN (SELECT id FROM audit_urls WHERE issue_type_id = 1 LIMIT 100);

-- ============================================
-- 🟠 PRIORIDAD ALTA - Páginas de servicios
-- ============================================

-- Errores 4xx (críticos para UX y SEO)
UPDATE audit_urls SET priority = 'high' WHERE issue_type_id = 2;

-- Errores 5xx (críticos para funcionamiento)
UPDATE audit_urls SET priority = 'high' WHERE issue_type_id = 4;

-- Títulos vacíos (impacto SEO directo)
UPDATE audit_urls SET priority = 'high' WHERE issue_type_id = 6;

-- Páginas de servicios y experiencias
UPDATE audit_urls SET priority = 'high'
WHERE priority = 'medium' 
AND (
    url ILIKE '%/servicios%'
    OR url ILIKE '%/tratamientos%'
    OR url ILIKE '%/masajes%'
    OR url ILIKE '%/wellness%'
    OR url ILIKE '%/experiencias%'
    OR url ILIKE '%/horarios%'
    OR url ILIKE '%/contacto%'
);

-- ============================================
-- 🟡 PRIORIDAD MEDIA - Contenido secundario
-- ============================================

-- Títulos/metas duplicados (importante pero no urgente)
UPDATE audit_urls SET priority = 'medium' 
WHERE issue_type_id IN (3, 11) AND priority NOT IN ('critical', 'high');

-- Imágenes rotas
UPDATE audit_urls SET priority = 'medium' 
WHERE issue_type_id = 5 AND priority NOT IN ('critical', 'high');

-- Redirecciones 302 (deberían ser 301)
UPDATE audit_urls SET priority = 'medium'
WHERE issue_type_id = 8 AND priority NOT IN ('critical', 'high');

-- ============================================
-- ⚪ PRIORIDAD BAJA - Contenido antiguo/menor
-- ============================================

-- Blog y noticias antiguas
UPDATE audit_urls SET priority = 'low'
WHERE priority = 'medium'
AND (
    url ILIKE '%/blog/%'
    OR url ILIKE '%/noticias/%'
    OR url ILIKE '%/news/%'
    OR url ILIKE '%/actualidad/%'
    OR url ILIKE '%/2019/%'
    OR url ILIKE '%/2020/%'
    OR url ILIKE '%/2021/%'
    OR url ILIKE '%/2022/%'
);

-- Páginas restringidas (robots/noindex) - menor prioridad
UPDATE audit_urls SET priority = 'low'
WHERE issue_type_id = 7 AND priority = 'medium';

-- ============================================
-- VERIFICACIÓN Y RESUMEN
-- ============================================

-- Ver distribución de prioridades
SELECT 
    priority,
    COUNT(*) AS cantidad,
    ROUND(COUNT(*)::numeric / SUM(COUNT(*)) OVER() * 100, 1) AS porcentaje
FROM audit_urls 
GROUP BY priority 
ORDER BY 
    CASE priority 
        WHEN 'critical' THEN 1 
        WHEN 'high' THEN 2 
        WHEN 'medium' THEN 3 
        WHEN 'low' THEN 4 
    END;

-- Ver ejemplos de cada prioridad
SELECT priority, url 
FROM audit_urls 
WHERE priority = 'critical' 
LIMIT 5;
