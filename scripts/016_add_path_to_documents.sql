-- Add path column to documents table for storing Google Drive links
ALTER TABLE documents ADD COLUMN IF NOT EXISTS path TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN documents.path IS 'Google Drive or external link to the document';
