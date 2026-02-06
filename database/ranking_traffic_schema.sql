-- ============================================
-- TABLA DE RANKING & TRAFFIC
-- ============================================

CREATE TABLE IF NOT EXISTS ranking_traffic (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    keyword TEXT NOT NULL,
    position NUMERIC,
    previous_position NUMERIC,
    search_volume NUMERIC,
    keyword_difficulty NUMERIC,
    cpc NUMERIC,
    url TEXT,
    traffic NUMERIC,
    traffic_percentage NUMERIC,
    traffic_cost NUMERIC,
    competition NUMERIC,
    number_of_results BIGINT,
    trends TEXT, -- JSON array stored as text
    timestamp DATE,
    serp_features TEXT,
    keyword_intents TEXT,
    position_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_ranking_keyword ON ranking_traffic(keyword);
CREATE INDEX IF NOT EXISTS idx_ranking_url ON ranking_traffic(url);
CREATE INDEX IF NOT EXISTS idx_ranking_traffic ON ranking_traffic(traffic DESC);
