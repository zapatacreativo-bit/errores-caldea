require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('--- REF DOMAINS (Top 5) ---');
    const { data: refs } = await supabase.from('ref_domains').select('domain').limit(5);
    console.log(refs);

    console.log('\n--- BACKLINK URLS (Top 5 Source Domains) ---');
    const { data: urls } = await supabase.from('backlink_urls').select('source_domain, source_url').limit(5);
    console.log(urls);

    console.log('\n--- CHECKING SPECIFIC DOMAIN: wikipedia.org ---');
    const { data: wikiRefs } = await supabase.from('ref_domains').select('*').ilike('domain', '%wikipedia%').limit(5);
    console.log('Ref Domains matches:', wikiRefs);

    const { data: wikiUrls } = await supabase.from('backlink_urls').select('source_domain').ilike('source_domain', '%wikipedia%').limit(5);
    console.log('Backlink URLs matches:', wikiUrls);
}

check();
