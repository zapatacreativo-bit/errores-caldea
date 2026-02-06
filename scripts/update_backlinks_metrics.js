
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const CSV_FILE = path.join(__dirname, '../csv/enlaces_toxicos_TS_AS.csv');

async function processCsv() {
    console.log('🚀 Starting Backlink Metrics Update...');

    if (!fs.existsSync(CSV_FILE)) {
        console.error('❌ CSV file not found:', CSV_FILE);
        return;
    }

    const fileStream = fs.createReadStream(CSV_FILE);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let headers = [];
    let processed = 0;
    let updated = 0;
    let errors = 0;

    // Batch processing
    let batch = [];
    const BATCH_SIZE = 50;

    for await (const line of rl) {
        if (!line.trim()) continue;

        // Parse CSV line (handling quotes simply for now, assuming standard format)
        // This regex splits by comma but respects quotes
        const match = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        // Fallback split if regex fails or for simple lines
        const fields = line.split(',').map(f => f.replace(/^"|"$/g, '').trim());

        if (headers.length === 0) {
            headers = fields;
            console.log('Headers detected:', headers);
            continue;
        }

        const row = {};
        headers.forEach((h, i) => {
            row[h] = fields[i];
        });

        // Map CSV columns to DB columns
        const sourceUrl = row['Source URL'];
        const authorityScore = parseInt(row['Domain Authority Score']) || 0;
        const toxicityScore = parseInt(row['Toxic Score']) || 0;

        if (sourceUrl) {
            batch.push({ sourceUrl, authorityScore, toxicityScore });
        }

        if (batch.length >= BATCH_SIZE) {
            await processBatch(batch);
            updated += batch.length; // Approximate
            batch = [];
            process.stdout.write(`\rProcessed: ${updated} links...`);
        }
    }

    // Process remaining
    if (batch.length > 0) {
        await processBatch(batch);
        updated += batch.length;
    }

    console.log(`\n\n✅ Update Complete!`);
    console.log(`Matched & Updated (approx): ${updated}`);
}

async function processBatch(batch) {
    try {
        // We have to update one by one or using a stored procedure/upsert.
        // For audit_urls, we want to update WHERE url = sourceUrl AND issue_type_id = 15

        // Parallelize the batch updates for speed
        const updates = batch.map(async (item) => {
            const { error } = await supabase
                .from('audit_urls')
                .update({
                    authority_score: item.authorityScore,
                    toxicity_score: item.toxicityScore
                })
                .eq('url', item.sourceUrl)
                .eq('issue_type_id', 15); // Strict safety check

            if (error) console.error(`Error updating ${item.sourceUrl}:`, error.message);
        });

        await Promise.all(updates);

    } catch (err) {
        console.error('Batch Error:', err);
    }
}

processCsv();
