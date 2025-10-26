-- Create function to refresh folder document counts materialized view
CREATE OR REPLACE FUNCTION public.refresh_folder_document_counts()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.folder_document_counts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to refresh counts when documents are inserted/updated/deleted
CREATE OR REPLACE TRIGGER trigger_refresh_folder_counts_on_document_change
AFTER INSERT OR UPDATE OR DELETE ON public.documents
FOR EACH STATEMENT
EXECUTE FUNCTION public.refresh_folder_document_counts();

-- Add comment
COMMENT ON FUNCTION public.refresh_folder_document_counts() IS 'Refreshes the materialized view of folder document counts. Called automatically on document changes.';
