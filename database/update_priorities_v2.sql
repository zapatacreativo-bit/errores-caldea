-- ============================================
-- IMPORTACIÓN DE DATOS CSV (Instrucciones)
-- ============================================

-- Como Supabase no permite importar CSV arbitrarios directamente via SQL sin acceso a FS,
-- recomendamos usar el importador de tabla de Supabase o un script PGADMIN.
-- Pero para simular/cargar datos masivamente en las nuevas columnas, usamos este formato:

-- Ejemplo de update masivo (esto es una plantilla para el usuario)
/*
UPDATE audit_urls SET 
    status_code = 200,
    indexability = 'Indexable',
    word_count = 1042,
    internal_links_count = 160,
    depth_level = 0,
    response_time = 0.339
WHERE url = 'https://www.caldea.com/';

UPDATE audit_urls SET 
    status_code = 200,
    indexability = 'Indexable',
    word_count = 989,
    internal_links_count = 155,
    depth_level = 1,
    response_time = 0.348
WHERE url = 'https://www.caldea.com/reserva-ahora';
*/

-- 🚀 MEJORA DEL ALGORITMO DE PRIORIDADES (Ejecutar después de cargar datos)
-- ========================================================================

-- 1. CRÍTICO: Páginas con alto tráfico o estructura core
UPDATE audit_urls SET priority = 'critical'
WHERE traffic_percentage > 5 
   OR internal_links_count >= 100 
   OR depth_level = 0;

-- 2. ALTO: Páginas con tráfico moderado o buen enlazado
UPDATE audit_urls SET priority = 'high'
WHERE (traffic_percentage BETWEEN 1 AND 5
   OR internal_links_count BETWEEN 50 AND 99 
   OR depth_level = 1)
AND priority != 'critical';

-- 3. BAJO: Thin content o muy profundas
UPDATE audit_urls SET priority = 'low'
WHERE (word_count < 200 OR depth_level > 3)
AND priority NOT IN ('critical', 'high');

-- 4. Resumen
SELECT priority, COUNT(*) FROM audit_urls GROUP BY priority;
