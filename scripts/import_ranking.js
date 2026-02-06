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
const CSV_FILE = 'csv/kw_posicion_trafico.csv';

function cleanNumber(value) {
    if (!value) return 0;
    // Replace comma with dot if exists, remove other non-numeric chars except dot
    // But be careful with thousands separators. Usually CSV uses dot or comma.
    // In this CSV: "19.86", "4236.00". It seems standard US format (dot decimal).
    // Let's check line 2: "19.86" (Traffic %).
    // Line 7: "0.15" (CPC).
    // Line 2: "33100" (Search Volume).
    return Number(value) || 0;
}

function parseTrends(trendString) {
    // Input: "[100,81,54,...]"
    try {
        if (!trendString) return [];
        return JSON.parse(trendString);
    } catch (e) {
        return [];
    }
}

async function importRanking() {
    console.log('🚀 Starting Import for Ranking & Traffic...');
    const results = [];

    fs.createReadStream(CSV_FILE)
        .pipe(csv())
        .on('data', (data) => {
            // Map CSV columns to DB columns
            const row = {
                keyword: data['Keyword'],
                position: cleanNumber(data['Position']),
                previous_position: cleanNumber(data['Previous position']),
                search_volume: cleanNumber(data['Search Volume']),
                keyword_difficulty: cleanNumber(data['Keyword Difficulty']),
                cpc: cleanNumber(data['CPC']),
                url: data['URL'],
                traffic: cleanNumber(data['Traffic']),
                traffic_percentage: cleanNumber(data['Traffic (%)']),
                traffic_cost: cleanNumber(data['Traffic Cost']),
                competition: cleanNumber(data['Competition']),
                number_of_results: cleanNumber(data['Number of Results']),
                trends: data['Trends'], // Store raw string or parsed JSON? Schema says TEXT.
                timestamp: data['Timestamp'] ? new Date(data['Timestamp']) : new Date(),
                serp_features: data['SERP Features by Keyword'],
                keyword_intents: data['Keyword Intents'],
                position_type: data['Position Type']
            };
            results.push(row);
        })
        .on('end', async () => {
            console.log(`📊 Parsed ${results.length} rows. Uploading to Supabase...`);

            // Batch upload
            const BATCH_SIZE = 100;
            for (let i = 0; i < results.length; i += BATCH_SIZE) {
                const batch = results.slice(i, i + BATCH_SIZE);
                const { error } = await supabase.from('ranking_traffic').insert(batch);

                if (error) {
                    console.error(`❌ Error importing batch ${i}-${i + BATCH_SIZE}:`, error.message);
                } else {
                    console.log(`✅ Imported batch ${i}-${i + BATCH_SIZE}`);
                }
            }

            console.log('🎉 Import completed!');
        });
}

importRanking();
