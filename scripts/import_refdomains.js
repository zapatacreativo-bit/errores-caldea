require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const csv = require('csv-parser');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing credentials. Check .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const CSV_FILE = 'csv/www.caldea.com-backlinks_refdomains.csv';

function cleanNumber(value) {
    if (!value) return 0;
    return Number(value) || 0;
}

function parseDate(value) {
    if (!value) return null;
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
}

async function importRefDomains() {
    console.log('🚀 Starting Import for Referencing Domains...');
    const results = [];

    // Clear existing data to avoid stale entries/duplicates (optional, but clean)
    // console.log('   🧹 Clearing existing data...');
    // await supabase.from('ref_domains').delete().neq('id', '00000000-0000-0000-0000-000000000000'); 
    // Actually, let's Upsert based on domain index if possible, or just insert efficiently. 
    // Since unique constraint is on domain, upsert is best.

    fs.createReadStream(CSV_FILE)
        .pipe(csv())
        .on('data', (data) => {
            const row = {
                domain: data['Domain'],
                authority_score: cleanNumber(data['Domain ascore']),
                backlinks: cleanNumber(data['Backlinks']),
                ip_address: data['IP Address'],
                country: data['Country'],
                first_seen: parseDate(data['First seen']),
                last_seen: parseDate(data['Last seen'])
            };
            if (row.domain) {
                results.push(row);
            }
        })
        .on('end', async () => {
            console.log(`📊 Parsed ${results.length} domains. Uploading to Supabase...`);

            const BATCH_SIZE = 100;
            for (let i = 0; i < results.length; i += BATCH_SIZE) {
                const batch = results.slice(i, i + BATCH_SIZE);

                // Using upsert to handle duplicates on 'domain'
                const { error } = await supabase
                    .from('ref_domains')
                    .upsert(batch, { onConflict: 'domain' });

                if (error) {
                    console.error(`❌ Error importing batch ${i}-${i + BATCH_SIZE}:`, error.message);
                } else {
                    // console.log(`✅ Imported batch ${i}-${i + BATCH_SIZE}`);
                }
            }

            console.log('🎉 Import completed!');
        });
}

importRefDomains();
