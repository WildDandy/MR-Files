-- Create folders table with parent-child relationships for hierarchical folder structure
CREATE TABLE IF NOT EXISTS folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  full_path TEXT NOT NULL UNIQUE,
  level INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_folders_full_path ON folders(full_path);

-- Enable Row Level Security
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read folders
CREATE POLICY "Allow authenticated users to read folders" 
  ON folders 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Add comment to explain the table
COMMENT ON TABLE folders IS 'Hierarchical folder structure for Google Drive documents';
COMMENT ON COLUMN folders.name IS 'Folder name (not full path)';
COMMENT ON COLUMN folders.parent_id IS 'Reference to parent folder (NULL for root folders)';
COMMENT ON COLUMN folders.full_path IS 'Complete path from root to this folder';
COMMENT ON COLUMN folders.level IS 'Depth level in hierarchy (0 for root)';

