-- Make classification fields nullable to support unclassified documents
ALTER TABLE documents 
  ALTER COLUMN executive_director_id DROP NOT NULL,
  ALTER COLUMN secretary_id DROP NOT NULL,
  ALTER COLUMN division_id DROP NOT NULL,
  ALTER COLUMN department_id DROP NOT NULL,
  ALTER COLUMN file_url DROP NOT NULL;

-- Add a status field to track classification progress
ALTER TABLE documents 
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'unclassified' CHECK (status IN ('unclassified', 'classified'));

-- Add an index for filtering by status
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);

-- Update existing documents to be marked as classified
UPDATE documents SET status = 'classified' WHERE department_id IS NOT NULL;
