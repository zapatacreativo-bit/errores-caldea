-- Arreglar la categoría faltante para "Enlaces de retroceso"

-- 1. Insertar la categoría 'Enlaces' si no existe
INSERT INTO categories (name, slug)
SELECT 'Enlaces', 'links'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'links');

-- 2. Vincular el Error 15 a la categoría 'Enlaces'
UPDATE issue_types
SET category_id = (SELECT id FROM categories WHERE slug = 'links')
WHERE id = 15;
