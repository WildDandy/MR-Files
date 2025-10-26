-- Enable trigram extension for fast ILIKE and partial text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN trigram indexes for partial match on title/description/path
CREATE INDEX IF NOT EXISTS idx_documents_title_trgm
  ON public.documents USING GIN (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_documents_description_trgm
  ON public.documents USING GIN (description gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_documents_path_trgm
  ON public.documents USING GIN (path gin_trgm_ops);