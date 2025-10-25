-- Fix RLS policies to allow all authenticated users to update documents
-- This allows multiple users to collaborate on document classification

-- Drop the restrictive update policy
DROP POLICY IF EXISTS "Allow users to update their own classified documents" ON documents;

-- Create a new policy that allows all authenticated users to update any document
CREATE POLICY "Allow authenticated users to update documents"
  ON documents FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Also update the delete policy to allow all authenticated users to delete documents
DROP POLICY IF EXISTS "Allow users to delete their own classified documents" ON documents;

CREATE POLICY "Allow authenticated users to delete documents"
  ON documents FOR DELETE
  TO authenticated
  USING (true);
