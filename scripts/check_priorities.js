require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPriorities() {
    console.log('--- Checking Priority Distribution ---');

    // Get counts for each priority
    const { data, error } = await supabase
        .from('audit_urls')
        .select('priority, url, traffic_percentage')
        .order('traffic_percentage', { ascending: false, nullsFirst: false })
        .limit(10); // Check top 10 traffic pages

    if (error) {
        console.error('Error:', error.message);
        return;
    }

    console.log('Top 10 High Traffic Pages & Assigned Priorities:');
    console.table(data);

    // Get distribution
    const { count: criticalCount } = await supabase.from('audit_urls').select('*', { count: 'exact', head: true }).eq('priority', 'critical');
    const { count: highCount } = await supabase.from('audit_urls').select('*', { count: 'exact', head: true }).eq('priority', 'high');
    const { count: mediumCount } = await supabase.from('audit_urls').select('*', { count: 'exact', head: true }).eq('priority', 'medium');
    const { count: lowCount } = await supabase.from('audit_urls').select('*', { count: 'exact', head: true }).eq('priority', 'low');

    console.log('\nSummary Distribution:');
    console.log(`Critical: ${criticalCount}`);
    console.log(`High:     ${highCount}`);
    console.log(`Medium:   ${mediumCount}`);
    console.log(`Low:      ${lowCount}`);
}

checkPriorities();
