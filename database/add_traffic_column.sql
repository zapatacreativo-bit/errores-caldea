-- Add traffic_percentage column to audit_urls table
ALTER TABLE audit_urls 
ADD COLUMN IF NOT EXISTS traffic_percentage NUMERIC;

-- Comment on column
COMMENT ON COLUMN audit_urls.traffic_percentage IS 'Percentage of total traffic/link score from audit source';
