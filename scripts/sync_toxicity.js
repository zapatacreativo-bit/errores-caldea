const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
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

async function syncNullToxicity() {
    console.log('🔄 Sincronizando URLs con toxicidad NULL...');

    // 1. Get all NULL toxicity rows for Issue 15 (Toxicity)
    const { data: nullRows, error: fetchError } = await supabase
        .from('audit_urls')
        .select('id, url')
        .is('toxicity_score', null)
        .eq('issue_type_id', 15);

    if (fetchError) {
        console.error('❌ Error fetching rows:', fetchError);
        return;
    }

    console.log(`📊 Encontradas ${nullRows.length} URLs con toxicidad NULL.`);

    if (nullRows.length === 0) {
        console.log('✅ No hay nada que sincronizar.');
        return;
    }

    // 2. Update them to 100 (Max Toxicity) or another default
    // Using 100 ensures they show up as "High/Critical" in the UI
    const { error: updateError } = await supabase
        .from('audit_urls')
        .update({ toxicity_score: 100 })
        .is('toxicity_score', null)
        .eq('issue_type_id', 15);

    if (updateError) {
        console.error('❌ Error actualizando:', updateError);
    } else {
        console.log(`✅ Sincronización completada. ${nullRows.length} URLs actualizadas a Score 100.`);
    }
}

syncNullToxicity();
