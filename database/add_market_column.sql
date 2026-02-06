-- Add market column to ranking_traffic table
ALTER TABLE ranking_traffic 
ADD COLUMN IF NOT EXISTS market text DEFAULT 'es';

-- Index for faster filtering by market
CREATE INDEX IF NOT EXISTS idx_ranking_traffic_market ON ranking_traffic(market);

-- Safe consistency check: Ensure all existing rows are 'es'
UPDATE ranking_traffic SET market = 'es' WHERE market IS NULL;
