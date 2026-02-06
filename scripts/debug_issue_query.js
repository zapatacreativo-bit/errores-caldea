
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugQuery() {
    console.log('Testing query for Issue ID 15...');

    try {
        const { data, error } = await supabase
            .from('issue_types')
            .select(`*, categories (name)`)
            .eq('id', 15)
            .single();

        if (error) {
            console.error('❌ Query Error:', error);
        } else {
            console.log('✅ Query Success:', data);
        }
    } catch (err) {
        console.error('❌ Exception:', err);
    }
}

debugQuery();
