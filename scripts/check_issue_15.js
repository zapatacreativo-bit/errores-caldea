
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function getIssueType() {
    const { data, error } = await supabase
        .from('issue_types')
        .select('*')
        .eq('id', 15)
        .single();

    if (error) {
        console.error('Error fetching issue type:', error);
        return;
    }

    console.log('Issue Type 15:', data);
}

getIssueType();
