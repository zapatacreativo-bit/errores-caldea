-- Ejecutar en SQL Editor de Supabase
ALTER TABLE audit_urls ADD COLUMN toxicity_score INTEGER;

-- Comentario: 
-- 0-29: Seguro (Verde)
-- 30-59: Precaución (Amarillo)
-- 60-100: Tóxico (Rojo)
