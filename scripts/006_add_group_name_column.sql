-- Add group_name column to documents table
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS group_name TEXT;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_documents_group_name ON documents(group_name);
