-- Add color column to divisions table
ALTER TABLE divisions ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#CACECF';

-- Update existing divisions with their correct colors
UPDATE divisions SET color = '#8FC6FF' WHERE name = 'Executive Division';
UPDATE divisions SET color = '#FFE576' WHERE name = 'Communications Division';
UPDATE divisions SET color = '#D59DFE' WHERE name = 'Dissemination Division';
UPDATE divisions SET color = '#F7CBE8' WHERE name = 'Treasury Division';
UPDATE divisions SET color = '#73F03A' WHERE name = 'Production Division';
UPDATE divisions SET color = '#CACECF' WHERE name = 'Qualifications Division';
UPDATE divisions SET color = '#F0C464' WHERE name = 'Public Division';
