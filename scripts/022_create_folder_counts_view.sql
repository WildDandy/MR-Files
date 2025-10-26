-- Create materialized view for folder document counts to avoid expensive COUNT() queries
CREATE MATERIALIZED VIEW IF NOT EXISTS public.folder_document_counts AS
SELECT 
  f.id as folder_id,
  COUNT(d.id) as document_count
FROM public.folders f
LEFT JOIN public.documents d ON d.folder_id = f.id
GROUP BY f.id;

-- Create unique index for efficient joins and refreshes
CREATE UNIQUE INDEX IF NOT EXISTS idx_folder_document_counts_folder_id 
  ON public.folder_document_counts (folder_id);

-- Grant access to authenticated users
ALTER MATERIALIZED VIEW public.folder_document_counts OWNER TO authenticated;

-- Add comment
COMMENT ON MATERIALIZED VIEW public.folder_document_counts IS 'Cached document counts per folder for performance. Refresh after bulk document operations.';
