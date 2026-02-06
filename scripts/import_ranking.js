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

const FILES = [
    { path: 'csv/kw_posicion_trafico.csv', market: 'es' },
    { path: 'csv/kw_posicion_trafico_francia.csv', market: 'fr' },
    { path: 'csv/kw_posicion_trafico_eeuu.csv', market: 'us' }
];

function cleanNumber(value) {
    if (!value) return 0;
    // Remove currency symbols or non-numeric chars if present, though usually raw CSV is clean.
    // Ensure we parse floats
    return Number(value) || 0;
}

async function importRanking() {
    console.log('🚀 Starting Import for Ranking & Traffic (Multi-Market)...');

    for (const config of FILES) {
        if (!fs.existsSync(config.path)) {
            console.warn(`⚠️ File not found: ${config.path}. Skipping ${config.market.toUpperCase()}...`);
            continue;
        }

        console.log(`\n🌍 Processing Market: ${config.market.toUpperCase()} (${config.path})`);

        // 1. Clear existing data for this market to avoid duplicates
        console.log(`   🧹 Clearing existing data for '${config.market}'...`);
        const { error: deleteError } = await supabase
            .from('ranking_traffic')
            .delete()
            .eq('market', config.market);

        if (deleteError) {
            console.error(`   ❌ Error clearing data: ${deleteError.message}`);
            continue;
        }

        const results = [];
        await new Promise((resolve) => {
            fs.createReadStream(config.path)
                .pipe(csv())
                .on('data', (data) => {
                    const row = {
                        market: config.market,
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
                        trends: data['Trends'],
                        timestamp: data['Timestamp'] ? new Date(data['Timestamp']) : new Date(),
                        serp_features: data['SERP Features by Keyword'],
                        keyword_intents: data['Keyword Intents'],
                        position_type: data['Position Type']
                    };
                    results.push(row);
                })
                .on('end', () => {
                    resolve();
                });
        });

        console.log(`   📊 Parsed ${results.length} rows. Uploading...`);

        const BATCH_SIZE = 100;
        for (let i = 0; i < results.length; i += BATCH_SIZE) {
            const batch = results.slice(i, i + BATCH_SIZE);
            const { error } = await supabase.from('ranking_traffic').insert(batch);

            if (error) {
                console.error(`   ❌ Error importing batch ${i}-${i + BATCH_SIZE}:`, error.message);
            }
        }
        console.log(`   ✅ Market ${config.market.toUpperCase()} completed!`);
    }

    console.log('\n🎉 All Imports completed!');
}

importRanking();
