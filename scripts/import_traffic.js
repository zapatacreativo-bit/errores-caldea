require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const csv = require('csv-parser');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const CSV_FILE_PATH = path.join(__dirname, '../csv/internos_todo_old.csv');

async function importTrafficData() {
    console.log('Starting traffic data import...');

    if (!fs.existsSync(CSV_FILE_PATH)) {
        console.error(`CSV file not found at: ${CSV_FILE_PATH}`);
        process.exit(1);
    }

    const records = [];
    let processedCount = 0;
    let batchSize = 1000;
    let batch = [];

    fs.createReadStream(CSV_FILE_PATH)
        .pipe(csv({ separator: ',' })) // Standard CSV
        .on('headers', (headers) => {
            console.log('CSV Headers found:', headers);
        })
        .on('data', (row) => {
            // Clean up row keys (remove BOM, quotes)
            const cleanRow = {};
            Object.keys(row).forEach(key => {
                const cleanKey = key.replace(/^[\uFEFF"']+|["']+$/g, '').trim();
                cleanRow[cleanKey] = row[key];
            });

            processedCount++;
            if (processedCount < 5) console.log('Row sample:', cleanRow);

            const url = cleanRow['Dirección'];
            let trafficStr = cleanRow['% del total'];

            if (!url) {
                if (processedCount < 5) console.log('Missing URL in row', cleanRow);
            }
            if (!trafficStr) {
                // It might be empty for some rows
                if (processedCount < 5) console.log('Missing % del total in row');
            }

            if (url && trafficStr) {
                // Parse traffic percentage: "93,300" -> 93.300
                // Remove thousands separators if any (though usually comma is decimal in Spanish CSVs, check line 2 of previous view_file)
                // Line 2: "93,300" -> looks like decimal because total is probably 100%. 
                // Wait, line 3 says: "93,300" for Link Score?
                // Let's re-verify the CSV content from previous turns.
                // Line 1 headers: ..., "Link Score", ..., "% del total", ...
                // Line 3 values: ..., "93,300", ..., (Link score value)
                // Wait, looking at the view_file output from step 854:
                // Header: ... "Link Score","Enlaces internos", ... "% del total" ...
                // Line 3: ... "63,690", "Normal", "2,820", "1", "0", "", "13421" ...
                // It seems the columns might shift or I need to be careful.
                // Let's use the exact header name: "% del total".

                // Spanish decimal format: "15,449" -> 15.449
                trafficStr = trafficStr.replace('.', '').replace(',', '.').trim();
                const traffic = parseFloat(trafficStr);

                if (!isNaN(traffic)) {
                    batch.push({
                        url: url,
                        traffic_percentage: traffic
                    });
                }
            }

            if (batch.length >= batchSize) {
                processBatch(batch);
                batch = [];
            }
        })
        .on('end', async () => {
            if (batch.length > 0) {
                await processBatch(batch);
            }
            console.log('CSV Import completed.');
        });
}

async function processBatch(rows) {
    if (rows.length === 0) return;

    try {
        const { error } = await supabase
            .from('audit_urls')
            .upsert(rows, {
                onConflict: 'url',
                ignoreDuplicates: false
            });

        if (error) {
            console.error('Error inserting batch:', error);
        } else {
            console.log(`Updated ${rows.length} rows with traffic data.`);
        }
    } catch (err) {
        console.error('Exception during batch update:', err);
    }
}

importTrafficData();
