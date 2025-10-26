-- Add folder_id column to documents table to link documents with folders
ALTER TABLE documents ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES folders(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_documents_folder_id ON documents(folder_id);

-- Add comment to explain the column
COMMENT ON COLUMN documents.folder_id IS 'Reference to the folder containing this document';

