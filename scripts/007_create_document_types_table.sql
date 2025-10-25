-- Create document_types table for reusable document classifications
CREATE TABLE IF NOT EXISTS document_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add document_type_id to documents table
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS document_type_id UUID REFERENCES document_types(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_documents_document_type ON documents(document_type_id);

-- Insert some common document types as examples
INSERT INTO document_types (name) VALUES 
  ('Saint Hill'),
  ('LRH Materials'),
  ('Policy Letters'),
  ('Technical Bulletins'),
  ('Course Materials')
ON CONFLICT (name) DO NOTHING;
