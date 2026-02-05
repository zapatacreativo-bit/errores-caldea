const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Helper to read .env.local
function loadEnv() {
    try {
        const envPath = path.join(process.cwd(), '.env.local');
        const envFile = fs.readFileSync(envPath, 'utf8');
        const env = {};
        envFile.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^['"]|['"]$/g, ''); // Remove quotes
                if (key && value) {
                    process.env[key] = value;
                }
            }
        });
        console.log('Environment variables loaded from .env.local');
    } catch (e) {
        console.warn('Could not read .env.local, checking process.env');
    }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Prefer Service Role Key for admin scripts to bypass RLS
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY not found in environment.');
    console.error('Hint: For write access, ensure SUPABASE_SERVICE_ROLE_KEY is in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function importCsv(filePath) {
    const isServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    console.log(`Reading CSV from ${filePath}...`);
    console.log(`Using Key Type: ${isServiceRole ? 'SERVICE_ROLE (Admin)' : 'ANON (Public)'}`);

    if (!isServiceRole) {
        console.warn('WARNING: Running without SUPABASE_SERVICE_ROLE_KEY. Insert operations may fail if RLS policies do not allow anonymous inserts.');
    }

    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const lines = fileContent.split(/\r?\n/).filter(line => line.trim() !== '');

        // Remove header
        const headers = lines.shift().split(','); // issue_type_id,url,linked_from
        console.log('Headers:', headers);

        const records = lines.map(line => {
            // Handle simple CSV: Assuming no commas in URLs for this simple script, 
            // but if there are, we'd need better parsing.
            // For URLs, commas are rare but possible in query params.
            // A robust regex or library is better, but this suffices for "sample_issues_import.csv"
            const parts = line.split(',');
            return {
                issue_type_id: parseInt(parts[0]),
                url: parts[1],
                linked_from: parts[2]
            };
        });

        console.log(`Parsed ${records.length} records. Uploading to Supabase...`);

        // Batch upload in chunks of 1000
        const CHUNK_SIZE = 1000;
        let insertedCount = 0;

        for (let i = 0; i < records.length; i += CHUNK_SIZE) {
            const chunk = records.slice(i, i + CHUNK_SIZE);
            const { error } = await supabase
                .from('audit_urls')
                .insert(chunk);

            if (error) {
                console.error(`Error uploading chunk ${i / CHUNK_SIZE + 1}:`, error.message);
                // Continue or break? For bulk import, maybe breaking is safer to avoid partial mess, 
                // but let's log and continue to try to get as much as possible.
            } else {
                insertedCount += chunk.length;
                console.log(`Uploaded batch ${i} - ${i + chunk.length} (${Math.round((i + chunk.length) / records.length * 100)}%)`);
            }
        }

        console.log(`Success! Imported rows: ${insertedCount}/${records.length}`);
        return; // Skip the single select in the original code

        if (error) {
            console.error('Error uploading data:', error.message);
            if (error.code === '42501') {
                console.error('\nPOSSIBLE FIX: This is a Row Level Security (RLS) violation.');
                console.error('You are likely using the ANON key which does not have permission to insert.');
                console.error('-> Add SUPABASE_SERVICE_ROLE_KEY=your_service_role_key to .env.local');
            }
            process.exit(1);
        }

        console.log('Success! Imported rows:', data.length);

        // Trigger Stats Update via SQL if needed (optional, or rely on view)
        // The View v_issue_stats is usually live, but the "total_count" on issue_types might be a cached column.
        // The guide mentioned "SQL for updating counters". We should run that if possible.
        // But we can't run RAW SQL via client library easily without RPC or RLS permissions for raw sql.
        // So we'll skip that and just tell the user.

    } catch (err) {
        console.error('Error reading or parsing file:', err);
        process.exit(1);
    }
}

const csvFile = process.argv[2] || 'sample_issues_import.csv';
importCsv(path.join(process.cwd(), csvFile));
