const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = fs.readFileSync(envPath, 'utf8');
const env = {};
envConfig.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.trim().replace(/"/g, '');
    }
});

const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyCounts() {
    console.log('Verifying toxicity data counts...');

    // Count fields with toxicity
    const { count: toxicCount, error: error1 } = await supabase
        .from('audit_urls')
        .select('*', { count: 'exact', head: true })
        .not('toxicity_score', 'is', null)
        .eq('issue_type_id', 15);

    // Count total fields
    const { count: totalCount, error: error2 } = await supabase
        .from('audit_urls')
        .select('*', { count: 'exact', head: true })
        .eq('issue_type_id', 15);

    if (error1 || error2) {
        console.error('Error:', error1 || error2);
        return;
    }

    console.log('--------------------------------');
    console.log(`Total Rows (ID 15): ${totalCount}`);
    console.log(`Rows with Toxicity: ${toxicCount}`);
    console.log(`Rows WITHOUT Toxicity: ${totalCount - toxicCount}`);
    console.log('--------------------------------');
}

verifyCounts();
