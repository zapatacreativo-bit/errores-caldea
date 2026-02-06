
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAuditUrlData() {
    const { data, error } = await supabase
        .from('audit_urls')
        .select('*')
        .eq('issue_type_id', 15)
        .limit(1);

    if (error) {
        console.error('Error fetching audit_urls:', error);
        return;
    }

    console.log('Sample Audit URL (Issue 15):', data);
}

checkAuditUrlData();
