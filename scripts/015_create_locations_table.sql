-- Create locations table to persist location data
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
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

-- Insert default locations
INSERT INTO locations (name) VALUES
  ('Google Drive'),
  ('Sent by Email'),
  ('Maria''s Computer'),
  ('Local Server'),
  ('Cloud Storage')
ON CONFLICT (name) DO NOTHING;
