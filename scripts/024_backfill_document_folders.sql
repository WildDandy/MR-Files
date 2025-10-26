-- Backfill documents.folder_id values by matching document paths to the longest folder path prefix
BEGIN;

CREATE OR REPLACE FUNCTION public.normalize_drive_path(input_path TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  cleaned TEXT;
BEGIN
  IF input_path IS NULL THEN
    RETURN NULL;
  END IF;

  cleaned := lower(trim(input_path));
  cleaned := replace(cleaned, '\\', '/');
  cleaned := replace(cleaned, '%2f', '/');
  cleaned := replace(cleaned, '%20', ' ');
  cleaned := replace(cleaned, '+', ' ');
  cleaned := regexp_replace(cleaned, '[?#].*$', '', 'g');

  cleaned := regexp_replace(cleaned, '^https?://drive\.google\.com/drive/(?:u/\d+/)?folders/', '', 'g');
  cleaned := regexp_replace(cleaned, '^https?://drive\.google\.com/file/d/', '', 'g');
  cleaned := regexp_replace(cleaned, '^https?://drive\.google\.com/open\?id=', '', 'g');
  cleaned := regexp_replace(cleaned, '^https?://drive\.google\.com/uc\?id=', '', 'g');

  cleaned := regexp_replace(cleaned, '^drive/', '', 'g');
  cleaned := regexp_replace(cleaned, '^my drive/', '', 'g');
  cleaned := regexp_replace(cleaned, '^shared drives?/', '', 'g');
  cleaned := regexp_replace(cleaned, '^shared with me/', '', 'g');
  cleaned := regexp_replace(cleaned, '^team drives?/', '', 'g');

  cleaned := regexp_replace(cleaned, '^/+', '', 'g');
  cleaned := regexp_replace(cleaned, '/+', '/', 'g');
  cleaned := regexp_replace(cleaned, '/+$', '', 'g');

  RETURN cleaned;
END;
$$;

WITH folder_paths AS (
  SELECT id, normalize_drive_path(full_path) AS normalized_path
  FROM folders
  WHERE full_path IS NOT NULL
),
document_paths AS (
  SELECT id, normalize_drive_path(path) AS normalized_path
  FROM documents
  WHERE folder_id IS NULL
    AND path IS NOT NULL
),
ranked_matches AS (
  SELECT
    d.id AS document_id,
    f.id AS folder_id,
    ROW_NUMBER() OVER (PARTITION BY d.id ORDER BY LENGTH(f.normalized_path) DESC) AS match_rank
  FROM document_paths d
  JOIN folder_paths f
    ON d.normalized_path IS NOT NULL
   AND f.normalized_path IS NOT NULL
   AND d.normalized_path <> ''
   AND f.normalized_path <> ''
   AND (d.normalized_path = f.normalized_path OR d.normalized_path LIKE f.normalized_path || '/%')
)
UPDATE documents AS d
SET folder_id = rm.folder_id
FROM ranked_matches AS rm
WHERE d.id = rm.document_id
  AND rm.match_rank = 1;

REFRESH MATERIALIZED VIEW public.folder_document_counts;

DROP FUNCTION IF EXISTS public.normalize_drive_path(TEXT);

COMMIT;
