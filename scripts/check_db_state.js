require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkState() {
    console.log('--- Checking Migration Checklist ---');
    const { data: checklist, error: checklistError } = await supabase
        .from('migration_checklist')
        .select('*');

    if (checklistError) console.error('Error fetching checklist:', checklistError.message);
    else console.log(`Checklist items count: ${checklist.length}`);
    if (checklist && checklist.length > 0) console.log('Sample item:', checklist[0]);

    console.log('\n--- Checking Audit URLs Priority ---');
    const { data: urls, error: urlsError } = await supabase
        .from('audit_urls')
        .select('url, priority, traffic_percentage')
        .limit(5);

    if (urlsError) console.error('Error fetching URLs:', urlsError.message);
    else console.log('Sample URLs:', urls);
}

checkState();
