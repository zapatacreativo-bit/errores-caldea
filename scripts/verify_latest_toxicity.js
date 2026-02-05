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
        env[key.trim()] = value.trim().replace(/"/g, ''); // Remove quotes if present
    }
});

const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyLatest() {
    console.log('Verifying latest rows for Issue ID 15...');

    const { data, error } = await supabase
        .from('audit_urls')
        .select('id, url, toxicity_score, created_at')
        .eq('issue_type_id', 15)
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Latest 10 rows:');
    data.forEach(row => {
        console.log(`ID: ${row.id}, Score: ${row.toxicity_score}, URL: ${row.url.substring(0, 50)}...`);
    });
}

verifyLatest();
