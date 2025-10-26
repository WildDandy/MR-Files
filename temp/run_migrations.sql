-- ========================================
-- 017_create_folders_table.sql
-- ========================================

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
DROP POLICY IF EXISTS "Allow authenticated users to read folders" ON folders;
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



-- ========================================
-- 018_add_folder_id_to_documents.sql
-- ========================================

-- Add folder_id column to documents table to link documents with folders
ALTER TABLE documents ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES folders(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_documents_folder_id ON documents(folder_id);

-- Add comment to explain the column
COMMENT ON COLUMN documents.folder_id IS 'Reference to the folder containing this document';



-- ========================================
-- 019_add_core_indexes.sql
-- ========================================

-- Add core btree indexes to speed common filters and sorts

-- Filter by status and order by created_at (composite index)
CREATE INDEX IF NOT EXISTS idx_documents_status_created_at
  ON public.documents (status, created_at);

-- Foreign key lookups used in classification and filters
CREATE INDEX IF NOT EXISTS idx_documents_folder_id
  ON public.documents (folder_id);

CREATE INDEX IF NOT EXISTS idx_documents_division_id
  ON public.documents (division_id);

CREATE INDEX IF NOT EXISTS idx_documents_department_id
  ON public.documents (department_id);

-- ========================================
-- 020_enable_trgm_and_add_text_indexes.sql
-- ========================================

-- Enable trigram extension for fast ILIKE and partial text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN trigram indexes for partial match on title/description/path
CREATE INDEX IF NOT EXISTS idx_documents_title_trgm
  ON public.documents USING GIN (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_documents_description_trgm
  ON public.documents USING GIN (description gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_documents_path_trgm
  ON public.documents USING GIN (path gin_trgm_ops);

-- ========================================
-- 021_add_ltree_optimization.sql
-- ========================================

-- Enable ltree extension for efficient hierarchical queries
CREATE EXTENSION IF NOT EXISTS ltree;

-- Add ltree column to folders table for efficient ancestor/descendant queries
ALTER TABLE folders ADD COLUMN IF NOT EXISTS path_ltree ltree;

-- Create GiST index for fast ancestor/descendant queries
CREATE INDEX IF NOT EXISTS idx_folders_path_ltree_gist 
  ON public.folders USING GIST (path_ltree);

-- Add comment explaining the optimization
COMMENT ON COLUMN folders.path_ltree IS 'Ltree representation of folder path for efficient hierarchical queries (e.g., "Root.Subfolder.Document")';


-- ========================================
-- 022_create_folder_counts_view.sql
-- ========================================

-- Create materialized view for folder document counts to avoid expensive COUNT() queries
DROP MATERIALIZED VIEW IF EXISTS public.folder_document_counts CASCADE;
CREATE MATERIALIZED VIEW public.folder_document_counts AS
SELECT 
  f.id as folder_id,
  COUNT(d.id) as document_count
FROM public.folders f
LEFT JOIN public.documents d ON d.folder_id = f.id
GROUP BY f.id;

-- Create unique index for efficient joins and refreshes
CREATE UNIQUE INDEX IF NOT EXISTS idx_folder_document_counts_folder_id 
  ON public.folder_document_counts (folder_id);

-- Add comment
COMMENT ON MATERIALIZED VIEW public.folder_document_counts IS 'Cached document counts per folder for performance. Refresh after bulk document operations.';


-- ========================================
-- 023_add_folder_count_refresh_trigger.sql
-- ========================================

-- Create function to refresh folder document counts materialized view
DROP TRIGGER IF EXISTS trigger_refresh_folder_counts_on_document_change ON public.documents;
DROP FUNCTION IF EXISTS public.refresh_folder_document_counts();
CREATE OR REPLACE FUNCTION public.refresh_folder_document_counts()
RETURNS trigger AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.folder_document_counts;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to refresh counts when documents are inserted/updated/deleted
CREATE TRIGGER trigger_refresh_folder_counts_on_document_change
AFTER INSERT OR UPDATE OR DELETE ON public.documents
FOR EACH STATEMENT
EXECUTE FUNCTION public.refresh_folder_document_counts();

-- Add comment
COMMENT ON FUNCTION public.refresh_folder_document_counts() IS 'Refreshes the materialized view of folder document counts. Called automatically on document changes.';
