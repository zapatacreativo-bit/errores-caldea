require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const csv = require('csv-parser');
const { URL } = require('url');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing credentials. Check .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const CSV_FILE = 'csv/www.caldea.com-backlinks-subdomains.csv';

function getDomain(urlStr) {
    try {
        const url = new URL(urlStr);
        return url.hostname.replace(/^www\./, '');
    } catch (e) {
        return null;
    }
}

async function importBacklinkUrls() {
    console.log('🚀 Starting Import for Detailed Backlink URLs [UTF-16LE]...');

    console.log('   🧹 Clearing existing URL data...');
    await supabase.from('backlink_urls').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    const results = [];

    // Read with explicit UTF-16LE encoding
    fs.createReadStream(CSV_FILE, { encoding: 'utf16le' })
        .pipe(csv({ separator: '\t' }))
        .on('data', (data) => {
            const url = data['Referring page URL'] || data['referring page url'];

            if (url) {
                const domain = getDomain(url);
                if (domain) {
                    results.push({
                        source_url: url,
                        target_url: data['Target URL'],
                        anchor: data['Anchor'],
                        page_title: data['Referring page title'],
                        domain_rating: parseInt(data['Domain rating']) || 0,
                        source_domain: domain
                    });
                }
            }
        })
        .on('end', async () => {
            console.log(`📊 Parsed ${results.length} URLs. Uploading to Supabase...`);

            const BATCH_SIZE = 500;
            for (let i = 0; i < results.length; i += BATCH_SIZE) {
                const batch = results.slice(i, i + BATCH_SIZE);
                const { error } = await supabase.from('backlink_urls').insert(batch);
                if (error) console.error('Error inserting batch:', error.message);
                else process.stdout.write('.');
            }
            console.log('\n🎉 Import detailed URLs completed!');
        });
}

importBacklinkUrls();
