-- Create organizational hierarchy tables
CREATE TABLE IF NOT EXISTS executive_directors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS secretaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  executive_director_id UUID NOT NULL REFERENCES executive_directors(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, executive_director_id)
);

CREATE TABLE IF NOT EXISTS divisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  secretary_id UUID NOT NULL REFERENCES secretaries(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, secretary_id)
);

CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  division_id UUID NOT NULL REFERENCES divisions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, division_id)
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT,
  executive_director_id UUID NOT NULL REFERENCES executive_directors(id) ON DELETE CASCADE,
  secretary_id UUID NOT NULL REFERENCES secretaries(id) ON DELETE CASCADE,
  division_id UUID NOT NULL REFERENCES divisions(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  classified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  classified_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_documents_executive_director ON documents(executive_director_id);
CREATE INDEX IF NOT EXISTS idx_documents_secretary ON documents(secretary_id);
CREATE INDEX IF NOT EXISTS idx_documents_division ON documents(division_id);
CREATE INDEX IF NOT EXISTS idx_documents_department ON documents(department_id);
CREATE INDEX IF NOT EXISTS idx_documents_classified_by ON documents(classified_by);
CREATE INDEX IF NOT EXISTS idx_secretaries_executive_director ON secretaries(executive_director_id);
CREATE INDEX IF NOT EXISTS idx_divisions_secretary ON divisions(secretary_id);
CREATE INDEX IF NOT EXISTS idx_departments_division ON departments(division_id);
