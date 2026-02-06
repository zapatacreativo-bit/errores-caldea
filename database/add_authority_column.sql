-- Add authority_score column to audit_urls table
ALTER TABLE audit_urls 
ADD COLUMN IF NOT EXISTS authority_score INTEGER;

-- Add index for performance if we filter/sort by authority
CREATE INDEX IF NOT EXISTS idx_audit_urls_authority_score ON audit_urls(authority_score);
