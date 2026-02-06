
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role to bypass RLS if needed, or anon

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    console.log('Checking ref_domains table...');
    const { data, error } = await supabase
        .from('ref_domains')
        .select('domain, authority_score, backlinks')
        .limit(10);

    if (error) {
        console.error('Error fetching data:', error);
        return;
    }

    console.log('Sample data:', data);

    const { count, error: countError } = await supabase
        .from('ref_domains')
        .select('*', { count: 'exact', head: true })
        .not('authority_score', 'is', null);

    if (countError) {
        console.error('Error counting:', countError);
    } else {
        console.log('Rows with non-null authority_score:', count);
    }
}

checkData();
