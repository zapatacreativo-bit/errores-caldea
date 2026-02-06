const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Helper to read .env.local
function loadEnv() {
    try {
        const envPath = path.join(process.cwd(), '.env.local');
        const envFile = fs.readFileSync(envPath, 'utf8');
        envFile.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^['"]|['"]$/g, '');
                if (key && value) {
                    process.env[key] = value;
                }
            }
        });
    } catch (e) {
        // ignore
    }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
    console.log('Verifying connection to Supabase...');
    
    // Attempt to select from categories
    // If table exists but RLS blocks, we get data: [] (success for existence check)
    // If table missing, we get error: 'relation "categories" does not exist'
    
    const { data, error } = await supabase
        .from('categories')
        .select('name')
        .limit(1);

    if (error) {
        // Check if error is about missing table
        if (error.message && error.message.includes('relation') && error.message.includes('does not exist')) {
            console.error('SCHEMA_MISSING: The database tables do not exist.');
            console.error('Details:', error.message);
        } else {
            console.error('CONNECTION_ERROR: Could not connect or other error.');
            console.error('Details:', error.message);
        }
        process.exit(1);
    } else {
        console.log('SCHEMA_EXISTS: Successfully connected to "categories" table.');
        // If we get here, the table exists.
        // It might return empty data if RLS is on and we are anon, but that confirms schema is there.
        console.log('Data received:', data); 
        process.exit(0);
    }
}

verify();
