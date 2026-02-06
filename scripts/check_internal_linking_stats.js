require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing credentials.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStats() {
    console.log('🔍 Checking Internal Linking Stats...');

    // 1. Total 404s
    const { count: total404s, error: error1 } = await supabase
        .from('audit_urls')
        .select('*', { count: 'exact', head: true })
        .eq('status_code', 404);

    if (error1) console.error('Error counting 404s:', error1);

    // 2. 404s with Internal Links > 0
    const { data: brokenWithLinks, error: error2 } = await supabase
        .from('audit_urls')
        .select('url, internal_links_count')
        .eq('status_code', 404)
        .gt('internal_links_count', 0);

    if (error2) console.error('Error counting broken with links:', error2);

    const countBrokenWithLinks = brokenWithLinks?.length || 0;
    const totalLinksToBroken = brokenWithLinks?.reduce((sum, url) => sum + (url.internal_links_count || 0), 0) || 0;

    // 3. Top 5 offenders
    const topOffenders = brokenWithLinks?.sort((a, b) => b.internal_links_count - a.internal_links_count).slice(0, 5) || [];

    console.log('\n📊 REPORT:');
    console.log(`- Total URLs returning 404: ${total404s}`);
    console.log(`- URLs returning 404 but HAVE internal links: ${countBrokenWithLinks}`);
    console.log(`- Total Wasted Internal Links (pointing to 404s): ${totalLinksToBroken}`);

    console.log('\n🚨 Top 5 Broken URLs with most inlinks:');
    topOffenders.forEach(url => {
        console.log(`  - ${url.url} (${url.internal_links_count} links)`);
    });
}

checkStats();
