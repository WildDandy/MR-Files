-- Enable ltree extension for efficient hierarchical queries
CREATE EXTENSION IF NOT EXISTS ltree;

-- Add ltree column to folders table for efficient ancestor/descendant queries
ALTER TABLE folders ADD COLUMN IF NOT EXISTS path_ltree ltree;

-- Populate path_ltree from full_path (replace / with . for ltree format)
UPDATE folders 
SET path_ltree = text2ltree(replace(replace(full_path, '\', '/'), '/', '.'))
WHERE path_ltree IS NULL;

-- Create GiST index for fast ancestor/descendant queries
CREATE INDEX IF NOT EXISTS idx_folders_path_ltree_gist 
  ON public.folders USING GIST (path_ltree);

-- Add comment explaining the optimization
COMMENT ON COLUMN folders.path_ltree IS 'Ltree representation of folder path for efficient hierarchical queries (e.g., "Root.Subfolder.Document")';
