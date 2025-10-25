-- Fix permissions for admin tables (divisions, departments, document_types, locations)
-- Allow all authenticated users to manage organizational structure

-- Add INSERT, UPDATE, DELETE policies for divisions
CREATE POLICY "Allow authenticated users to insert divisions"
  ON divisions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update divisions"
  ON divisions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete divisions"
  ON divisions FOR DELETE
  TO authenticated
  USING (true);

-- Add INSERT, UPDATE, DELETE policies for departments
CREATE POLICY "Allow authenticated users to insert departments"
  ON departments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update departments"
  ON departments FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete departments"
  ON departments FOR DELETE
  TO authenticated
  USING (true);

-- Enable RLS and add policies for document_types
ALTER TABLE document_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view document types"
  ON document_types FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert document types"
  ON document_types FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update document types"
  ON document_types FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete document types"
  ON document_types FOR DELETE
  TO authenticated
  USING (true);

-- Enable RLS and add policies for locations (if table exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'locations') THEN
    ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Allow authenticated users to view locations"
      ON locations FOR SELECT
      TO authenticated
      USING (true);

    CREATE POLICY "Allow authenticated users to insert locations"
      ON locations FOR INSERT
      TO authenticated
      WITH CHECK (true);

    CREATE POLICY "Allow authenticated users to update locations"
      ON locations FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);

    CREATE POLICY "Allow authenticated users to delete locations"
      ON locations FOR DELETE
      TO authenticated
      USING (true);
  END IF;
END $$;
