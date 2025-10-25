-- Add location and access_level fields to documents table
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS access_level TEXT;

-- Add indexes for the new fields
CREATE INDEX IF NOT EXISTS idx_documents_location ON documents(location);
CREATE INDEX IF NOT EXISTS idx_documents_access_level ON documents(access_level);
