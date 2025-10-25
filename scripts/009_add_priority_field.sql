-- Add priority field to documents table
ALTER TABLE documents
ADD COLUMN priority TEXT CHECK (priority IN ('red', 'green', 'yellow'));

-- Add index for priority sorting
CREATE INDEX idx_documents_priority ON documents(priority);
