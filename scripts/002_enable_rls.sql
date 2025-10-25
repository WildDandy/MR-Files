-- Enable Row Level Security on all tables
ALTER TABLE executive_directors ENABLE ROW LEVEL SECURITY;
ALTER TABLE secretaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for executive_directors (read-only for authenticated users)
CREATE POLICY "Allow authenticated users to view executive directors"
  ON executive_directors FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for secretaries (read-only for authenticated users)
CREATE POLICY "Allow authenticated users to view secretaries"
  ON secretaries FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for divisions (read-only for authenticated users)
CREATE POLICY "Allow authenticated users to view divisions"
  ON divisions FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for departments (read-only for authenticated users)
CREATE POLICY "Allow authenticated users to view departments"
  ON departments FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for documents
CREATE POLICY "Allow authenticated users to view all documents"
  ON documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert documents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = classified_by);

CREATE POLICY "Allow users to update their own classified documents"
  ON documents FOR UPDATE
  TO authenticated
  USING (auth.uid() = classified_by)
  WITH CHECK (auth.uid() = classified_by);

CREATE POLICY "Allow users to delete their own classified documents"
  ON documents FOR DELETE
  TO authenticated
  USING (auth.uid() = classified_by);
