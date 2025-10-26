-- Seed sample folders structure
-- This creates a basic folder hierarchy for testing the filter functionality

-- Root folders
INSERT INTO folders (name, full_path, level, parent_id) VALUES
('Documents', 'Documents', 0, NULL),
('Archives', 'Archives', 0, NULL),
('Scans', 'Scans', 0, NULL)
ON CONFLICT (full_path) DO NOTHING;

-- Get folder IDs for next level
WITH root_folders AS (
  SELECT id, name FROM folders WHERE level = 0 AND parent_id IS NULL
)
INSERT INTO folders (name, full_path, level, parent_id) VALUES
('2024', 'Documents/2024', 1, (SELECT id FROM folders WHERE name = 'Documents')),
('2023', 'Documents/2023', 1, (SELECT id FROM folders WHERE name = 'Documents')),
('Important', 'Archives/Important', 1, (SELECT id FROM folders WHERE name = 'Archives')),
('Miscellaneous', 'Scans/Miscellaneous', 1, (SELECT id FROM folders WHERE name = 'Scans'))
ON CONFLICT (full_path) DO NOTHING;

-- Third level folders
INSERT INTO folders (name, full_path, level, parent_id) VALUES
('January', 'Documents/2024/January', 2, (SELECT id FROM folders WHERE name = '2024')),
('February', 'Documents/2024/February', 2, (SELECT id FROM folders WHERE name = '2024')),
('Q1', 'Documents/2023/Q1', 2, (SELECT id FROM folders WHERE name = '2023'))
ON CONFLICT (full_path) DO NOTHING;

-- Link first 10 unclassified documents to Documents/2024/January folder
UPDATE documents 
SET folder_id = (SELECT id FROM folders WHERE full_path = 'Documents/2024/January')
WHERE id IN (
  SELECT id FROM documents 
  WHERE status = 'unclassified' 
  LIMIT 5
);

-- Link next 5 unclassified documents to Documents/2023/Q1 folder
UPDATE documents 
SET folder_id = (SELECT id FROM folders WHERE full_path = 'Documents/2023/Q1')
WHERE id IN (
  SELECT id FROM documents 
  WHERE status = 'unclassified' AND folder_id IS NULL
  LIMIT 5
);

-- Link first 3 classified documents to Archives/Important folder
UPDATE documents 
SET folder_id = (SELECT id FROM folders WHERE full_path = 'Archives/Important')
WHERE id IN (
  SELECT id FROM documents 
  WHERE status = 'classified'
  LIMIT 3
);

-- Refresh the materialized view to update document counts
REFRESH MATERIALIZED VIEW CONCURRENTLY public.folder_document_counts;

SELECT 'Folders seeded successfully!' as message;
