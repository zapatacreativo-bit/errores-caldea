const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Cargar variables de entorno desde .env.local manualmente
function loadEnv() {
    try {
        const envPath = path.join(__dirname, '../.env.local');
        const envFile = fs.readFileSync(envPath, 'utf8');
        const envVars = {};
        envFile.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^["']|["']$/g, ''); // Remove quotes
                if (key && value) envVars[key] = value;
            }
        });
        return envVars;
    } catch (error) {
        console.error('Error cargando .env.local:', error.message);
        return {};
    }
}

const env = loadEnv();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
// IMPORTANTE: Necesitamos la Service Role Key para escrituras masivas sin restricciones RLS
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Error: Faltan variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY/ANON_KEY');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// 2. Parser CSV Robusto (maneja comillas)
function parseCSVLine(text) {
    const result = [];
    let cur = '';
    let inQuote = false;
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (inQuote) {
            if (char === '"') {
                if (i + 1 < text.length && text[i + 1] === '"') {
                    cur += '"'; // Comilla escapada
                    i++;
                } else {
                    inQuote = false; // Fin de comilla
                }
            } else {
                cur += char;
            }
        } else {
            if (char === '"') {
                inQuote = true;
            } else if (char === ',') {
                result.push(cur);
                cur = '';
            } else {
                cur += char;
            }
        }
    }
    result.push(cur);
    return result;
}

// 3. Mapeo de columnas (CSV Header -> DB Column)
const COLUMN_MAP = {
    'Dirección': 'url',
    'Código de respuesta': 'status_code',
    'Tipo de contenido': 'content_type',
    'Indexabilidad': 'indexability',
    'Estado de indexabilidad': 'indexability_status',
    'Nivel de profundidad': 'depth_level',
    'Enlaces internos': 'internal_links_count',
    'Enlaces internos únicos': 'unique_internal_links',
    'Enlaces salientes': 'outlinks_count',
    'Recuento de palabras': 'word_count',
    'Tiempo de respuesta': 'response_time',
    'Last Modified': 'last_modified',
    'Elemento de enlace canónico 1': 'canonical_url',
    'Meta robots 1': 'meta_robots',
    'Ancho de píxeles del título 1': 'title_width',
    'Ancho de píxeles de la meta description 1': 'meta_desc_width',

    // Opcionales para enriquecer audit_urls si queremos
    'Título 1': 'page_title',
    'Meta description 1': 'meta_description',
    'H1-1': 'h1'
};

// 4. Función Principal
async function importData() {
    const csvPath = path.join(__dirname, '../csv/internos_todo.csv');
    console.log(`📂 Leyendo archivo: ${csvPath}`);

    if (!fs.existsSync(csvPath)) {
        console.error('❌ Error: No se encuentra el archivo CSV.');
        process.exit(1);
    }

    const fileContent = fs.readFileSync(csvPath, 'utf8');
    const lines = fileContent.split(/\r?\n/);

    // Leer headers
    if (lines.length < 2) {
        console.error('❌ Error: El CSV está vacío o no tiene headers.');
        process.exit(1);
    }

    const headers = parseCSVLine(lines[0]);
    console.log(`📊 Headers detectados: ${headers.length}`);
    console.log('Headers raw:', headers); // DEBUG

    // Identificar índices de columnas
    const colIndices = {};
    for (const [csvCol, dbCol] of Object.entries(COLUMN_MAP)) {
        // Normalizar headers para evitar problemas de encoding/trim
        const index = headers.findIndex(h => h.trim().normalize('NFC') === csvCol.normalize('NFC'));
        // Fallback fuzzy search para "Dirección" si falla por encoding
        if (index === -1 && csvCol === 'Dirección') {
            const fuzzyIndex = headers.findIndex(h => h.includes('Direcci'));
            if (fuzzyIndex !== -1) {
                console.log(`⚠️ Usando fuzzy match para Dirección: ${headers[fuzzyIndex]}`);
                colIndices[dbCol] = fuzzyIndex;
                continue;
            }
        }

        if (index !== -1) {
            colIndices[dbCol] = index;
        } else {
            console.warn(`⚠️ Columna no encontrada en CSV: ${csvCol}`);
        }
    }

    console.log('Indices finales:', colIndices); // DEBUG

    console.log('🔗 Mapeo de columnas configurado.');

    let successCount = 0;
    let errorCount = 0;
    const batchSize = 50;
    let batch = [];

    console.log('🚀 Iniciando importación...');

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = parseCSVLine(line);
        if (values.length !== headers.length) {
            // console.warn(`⚠️ Warning: Línea ${i+1} tiene ${values.length} columnas, se esperaban ${headers.length}`);
            // A veces el parseo falla o la linea está malformada, lo saltamos o intentamos igual
        }

        const url = values[colIndices['url']];
        if (!url) continue;

        const rowData = { url };

        // Mapear valores
        for (const [dbCol, index] of Object.entries(colIndices)) {
            if (dbCol === 'url') continue;
            let val = values[index];

            // Limpieza de datos
            if (val === undefined || val === '') {
                val = null;
            } else {
                // Conversiones numéricas
                if (['status_code', 'depth_level', 'internal_links_count', 'unique_internal_links', 'outlinks_count', 'word_count', 'title_width', 'meta_desc_width'].includes(dbCol)) {
                    val = parseInt(val.replace(/\./g, '').replace(/,/g, ''), 10); // Quitar separadores de miles si los hay? CSV europeo suele usar coma para decimales
                    if (isNaN(val)) val = null;
                } else if (['response_time'].includes(dbCol)) {
                    // 0,339 -> 0.339
                    val = parseFloat(val.replace(',', '.'));
                    if (isNaN(val)) val = null;
                }
            }
            if (val !== null) rowData[dbCol] = val;
        }

        // Añadir a issue_type_id 16 si no tiene issue asignado? O simplemente enrichment.
        // Haremos enrichment: update basado en URL.
        batch.push(rowData);

        if (batch.length >= batchSize) {
            await processBatch(batch);
            successCount += batch.length;
            batch = [];
            process.stdout.write(`\r✅ Procesados: ${successCount} filas...`);
        }
    }

    // Procesar remanente
    if (batch.length > 0) {
        await processBatch(batch);
        successCount += batch.length;
    }

    console.log(`\n\n🏁 Importación finalizada.`);
    console.log(`✅ Total procesados: ${successCount}`);
}

async function processBatch(rows) {
    // Usamos upsert para actualizar datos existentes
    // Importante: status o issue_type_id no se tocan a menos que queramos
    const { error } = await supabase
        .from('audit_urls')
        .upsert(rows, {
            onConflict: 'url',
            ignoreDuplicates: false // Queremos hacer UPDATE
        });

    if (error) {
        console.error('\n❌ Error en batch:', error.message);
    }
}

importData();
