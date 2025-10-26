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