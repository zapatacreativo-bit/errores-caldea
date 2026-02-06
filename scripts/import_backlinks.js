const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
// const csv = require('csv-parser'); // Removed to avoid dependency issues

// Helper to read .env.local
function loadEnv() {
    try {
        const envPath = path.join(process.cwd(), '.env.local');
        if (fs.existsSync(envPath)) {
            const envFile = fs.readFileSync(envPath, 'utf8');
            envFile.split('\n').forEach(line => {
                const match = line.match(/^([^=]+)=(.*)$/);
                if (match) {
                    const key = match[1].trim();
                    const value = match[2].trim().replace(/^['"]|['"]$/g, '');
                    if (key && value) process.env[key] = value;
                }
            });
            console.log('Environment variables loaded from .env.local');
        }
    } catch (e) {
        console.warn('Could not read .env.local');
    }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Supabase credentials missing.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function importBacklinks(filePath) {
    console.log(`Reading CSV from ${filePath}...`);

    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const lines = fileContent.split(/\r?\n/).filter(line => line.trim() !== '');

        // Parse headers (CSV is comma separated)
        const headers = lines.shift().split(',').map(h => h.trim().replace(/^['"]|['"]$/g, ''));

        // Find indices
        const idxSourceUrl = headers.indexOf('Source URL');
        const idxToxic = headers.indexOf('Toxic Score');
        const idxAuth = headers.indexOf('Domain Authority Score');

        if (idxSourceUrl === -1 || idxToxic === -1 || idxAuth === -1) {
            console.error('Error: Required columns not found. Headers:', headers);
            return;
        }

        console.log('Parsing records...');
        const updates = [];

        // Manual CSV parsing (handling simple cases, assuming standard format)
        // Note: Real CSV parsing is complex with quoted fields containing commas.
        // Assuming SEMrush export doesn't have commas in URLs or scores usually.
        // If it does, simplistic split(',') will fail. 
        // Let's try to be slightly smarter or warn. 
        // The lines viewed earlier show standard CSV format.

        for (const line of lines) {
            // Basic split - beware of commas in titles! 
            // "Domain Authority Score,Page Authority Score,Source URL,Source Page Title,Source Domain,Target URL,Anchor,Anchor Type,Link Type,No Follow,Toxic Score,First Seen,Last Seen,Comment"
            // Titles CAN have commas.
            // We need a regex or a better parser. 
            // Since we can't install packages easily, let's use a regex for CSV splitting.

            const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
            // Actually, simpler: regex to match CSV fields with quotes support
            const parts = [];
            let inQuote = false;
            let current = '';
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"') {
                    inQuote = !inQuote;
                } else if (char === ',' && !inQuote) {
                    parts.push(current);
                    current = '';
                } else {
                    current += char;
                }
            }
            parts.push(current);

            // Clean quotes from values
            const cleanParts = parts.map(p => p.trim().replace(/^"|"$/g, ''));

            const sourceUrl = cleanParts[idxSourceUrl];
            const toxicScore = parseInt(cleanParts[idxToxic]);
            const authScore = parseInt(cleanParts[idxAuth]);

            if (sourceUrl && !isNaN(toxicScore)) {
                updates.push({
                    url: sourceUrl,
                    toxicity_score: toxicScore,
                    authority_score: !isNaN(authScore) ? authScore : null
                });
            }
        }

        console.log(`Found ${updates.length} potential updates.`);
        console.log('Starting batch update (this may take a while)...');

        // We need to UPDATE existing records where issue_type_id = 15 AND url = sourceUrl
        // Supabase doesn't support bulk update with different values easily in one query without upsert?
        // Upsert requires primary key. We don't have the ID of the audit_urls rows here.
        // Strategy: 
        // 1. Fetch all audit_urls with issue_type_id = 15.
        // 2. Map them by URL.
        // 3. Prepare Upsert payload with ID.

        // Fetch existing - Handle pagination to get ALL rows
        let allExistingRows = [];
        let page = 0;
        const PAGE_SIZE = 1000;
        let hasMore = true;

        console.log('Fetching existing rows from database...');

        while (hasMore) {
            const { data, error } = await supabase
                .from('audit_urls')
                .select('id, url')
                .eq('issue_type_id', 15)
                .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

            if (error) {
                console.error('Error fetching rows:', error);
                hasMore = false;
            } else {
                if (data.length > 0) {
                    allExistingRows = allExistingRows.concat(data);
                    if (data.length < PAGE_SIZE) hasMore = false;
                    page++;
                    console.log(`Fetched ${allExistingRows.length} rows so far...`);
                } else {
                    hasMore = false;
                }
            }
        }

        console.log(`Finished fetching. Total existing rows: ${allExistingRows.length}`);

        // Create map for fast lookup
        const urlMap = new Map();
        allExistingRows.forEach(row => {
            // Normalize URL? Remove trailing slash?
            // Let's assume exact match first, maybe trim.
            urlMap.set(row.url.trim(), row.id);
            // Also try with/without trailing slash just in case
            if (row.url.endsWith('/')) urlMap.set(row.url.slice(0, -1), row.id);
            else urlMap.set(row.url + '/', row.id);
        });

        const toUpsert = [];
        let matchedCount = 0;

        updates.forEach(update => {
            const dbId = urlMap.get(update.url.trim());
            if (dbId) {
                matchedCount++;
                toUpsert.push({
                    id: dbId,
                    url: update.url, // Include URL to satisfy potential NOT NULL constraints
                    issue_type_id: 15,
                    toxicity_score: update.toxicity_score,
                    authority_score: update.authority_score,
                    updated_at: new Date().toISOString()
                });
            }
        });

        console.log(`Matched ${matchedCount} records to update.`);

        if (toUpsert.length === 0) {
            console.log('No matching records found to update.');
            return;
        }

        // Batch upsert
        const CHUNK_SIZE = 1000;
        for (let i = 0; i < toUpsert.length; i += CHUNK_SIZE) {
            const chunk = toUpsert.slice(i, i + CHUNK_SIZE);
            const { error: upsertError } = await supabase
                .from('audit_urls')
                .upsert(chunk, { onConflict: 'id' }); // Upsert by ID to update

            if (upsertError) {
                console.error(`Error updating batch ${i}:`, upsertError.message);
            } else {
                console.log(`Updated batch ${i} - ${i + chunk.length}`);
            }
        }

        console.log('Update complete!');

    } catch (err) {
        console.error('Error:', err);
    }
}

// Check for file argument or default
// Hardcoding the known file for now as per task
const targetFile = 'public/backlink_audit_domains_27811604_2026-02-06.csv';
importBacklinks(path.join(process.cwd(), targetFile));
