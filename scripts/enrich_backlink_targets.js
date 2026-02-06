
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function enrichTargets() {
    console.log('🚀 Starting Traffic Enrichment for Backlink Targets...');

    // 1. Get unique target URLs from Issue 15
    const { data: targets, error } = await supabase
        .from('audit_urls')
        .select('linked_from')
        .eq('issue_type_id', 15);

    if (error) {
        console.error('Error fetching targets:', error);
        return;
    }

    // Unique URLs
    const uniqueTargets = [...new Set(targets.map(t => t.linked_from).filter(u => u))];
    console.log(`Found ${uniqueTargets.length} unique target URLs to analyze.`);

    let processed = 0;
    let updated = 0;

    for (const url of uniqueTargets) {
        // Normalize URL for matching (remove trailing slash logic if needed, but strict match is safer first)
        // Search in ranking_traffic
        const { data: keywords, error: kError } = await supabase
            .from('ranking_traffic')
            .select('*')
            .eq('url', url);

        if (!keywords || keywords.length === 0) {
            processed++;
            if (processed % 50 === 0) process.stdout.write(`\rProcessed: ${processed}/${uniqueTargets.length}`);
            continue;
        }

        // Calculate Metrics
        // traffic_percentage is per keyword in ranking_traffic. Summing it gives share of domain traffic (approx)
        const totalTrafficPercent = keywords.reduce((sum, k) => sum + (Number(k.traffic_percentage) || 0), 0);

        // Top 3 Keywords by Traffic Volume generated
        const topKw = keywords
            .sort((a, b) => (Number(b.traffic) || 0) - (Number(a.traffic) || 0))
            .slice(0, 3)
            .map(k => `${k.keyword} (#${k.position})`);

        // Update Audit URLs (All instances of this target)
        // We update where linked_from = url AND issue_type_id = 15
        const { error: uError } = await supabase
            .from('audit_urls')
            .update({
                traffic_percentage: totalTrafficPercent,
                target_keywords: JSON.stringify(topKw) // Store as JSON string
            })
            .eq('linked_from', url)
            .eq('issue_type_id', 15);

        if (uError) {
            console.error(`\nFailed to update ${url}:`, uError.message);
        } else {
            updated++;
        }

        processed++;
        if (processed % 10 === 0) process.stdout.write(`\rProcessed: ${processed}/${uniqueTargets.length} | Updated: ${updated}`);
    }

    console.log(`\n\n✅ Enrichment Complete!`);
    console.log(`Targets Updated: ${updated} / ${uniqueTargets.length}`);
}

enrichTargets();
