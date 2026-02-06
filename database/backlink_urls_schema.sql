-- Create table for Detailed Backlink URLs
CREATE TABLE IF NOT EXISTS backlink_urls (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    source_url text NOT NULL,
    target_url text,
    anchor text,
    page_title text,
    domain_rating int,
    source_domain text, -- Extracted domain for filtering
    created_at timestamp with time zone DEFAULT now()
);

-- Index for searching by domain
CREATE INDEX IF NOT EXISTS idx_backlink_urls_domain ON backlink_urls(source_domain);

-- Enable RLS
ALTER TABLE backlink_urls ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable read access for all users" ON backlink_urls FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON backlink_urls FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable delete for authenticated users only" ON backlink_urls FOR DELETE USING (true);
