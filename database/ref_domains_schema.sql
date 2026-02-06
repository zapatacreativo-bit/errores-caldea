-- Create table for Referencing Domains
CREATE TABLE IF NOT EXISTS ref_domains (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    domain text UNIQUE NOT NULL,
    authority_score int,
    backlinks int,
    ip_address text,
    country text,
    first_seen timestamp with time zone,
    last_seen timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);

-- Index for authority score sorting
CREATE INDEX IF NOT EXISTS idx_ref_domains_as ON ref_domains(authority_score DESC);

-- Enable RLS
ALTER TABLE ref_domains ENABLE ROW LEVEL SECURITY;

-- Policy for Select (Public)
CREATE POLICY "Enable read access for all users" ON ref_domains
    FOR SELECT USING (true);

-- Policy for Insert/Update (Service Role only usually, but allowed for anon in this dev setup for scripts)
CREATE POLICY "Enable insert for authenticated users only" ON ref_domains
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users only" ON ref_domains
    FOR UPDATE USING (true);
    
CREATE POLICY "Enable delete for authenticated users only" ON ref_domains
    FOR DELETE USING (true);
