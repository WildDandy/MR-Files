-- Seed Executive Directors
INSERT INTO executive_directors (name) VALUES
  ('Executive Director')
ON CONFLICT (name) DO NOTHING;

-- Get the Executive Director ID
DO $$
DECLARE
  exec_dir_id UUID;
  sec_admin_id UUID;
  sec_operations_id UUID;
BEGIN
  -- Get Executive Director ID
  SELECT id INTO exec_dir_id FROM executive_directors WHERE name = 'Executive Director';

  -- Insert Secretaries
  INSERT INTO secretaries (name, executive_director_id) VALUES
    ('Secretary for Administration', exec_dir_id),
    ('Secretary for Operations', exec_dir_id)
  ON CONFLICT (name, executive_director_id) DO NOTHING;

  -- Get Secretary IDs
  SELECT id INTO sec_admin_id FROM secretaries WHERE name = 'Secretary for Administration' AND executive_director_id = exec_dir_id;
  SELECT id INTO sec_operations_id FROM secretaries WHERE name = 'Secretary for Operations' AND executive_director_id = exec_dir_id;

  -- Insert Divisions under Secretary for Administration
  INSERT INTO divisions (name, secretary_id) VALUES
    ('Human Resources Division', sec_admin_id),
    ('Finance Division', sec_admin_id),
    ('Legal Division', sec_admin_id),
    ('Information Technology Division', sec_admin_id)
  ON CONFLICT (name, secretary_id) DO NOTHING;

  -- Insert Divisions under Secretary for Operations
  INSERT INTO divisions (name, secretary_id) VALUES
    ('Operations Division', sec_operations_id),
    ('Planning Division', sec_operations_id),
    ('Quality Assurance Division', sec_operations_id)
  ON CONFLICT (name, secretary_id) DO NOTHING;

  -- Insert sample departments for each division
  -- HR Division Departments
  INSERT INTO departments (name, division_id)
  SELECT 'Recruitment Department', id FROM divisions WHERE name = 'Human Resources Division' AND secretary_id = sec_admin_id
  ON CONFLICT (name, division_id) DO NOTHING;
  
  INSERT INTO departments (name, division_id)
  SELECT 'Employee Relations Department', id FROM divisions WHERE name = 'Human Resources Division' AND secretary_id = sec_admin_id
  ON CONFLICT (name, division_id) DO NOTHING;

  -- Finance Division Departments
  INSERT INTO departments (name, division_id)
  SELECT 'Accounting Department', id FROM divisions WHERE name = 'Finance Division' AND secretary_id = sec_admin_id
  ON CONFLICT (name, division_id) DO NOTHING;
  
  INSERT INTO departments (name, division_id)
  SELECT 'Budget Department', id FROM divisions WHERE name = 'Finance Division' AND secretary_id = sec_admin_id
  ON CONFLICT (name, division_id) DO NOTHING;

  -- Legal Division Departments
  INSERT INTO departments (name, division_id)
  SELECT 'Contracts Department', id FROM divisions WHERE name = 'Legal Division' AND secretary_id = sec_admin_id
  ON CONFLICT (name, division_id) DO NOTHING;
  
  INSERT INTO departments (name, division_id)
  SELECT 'Compliance Department', id FROM divisions WHERE name = 'Legal Division' AND secretary_id = sec_admin_id
  ON CONFLICT (name, division_id) DO NOTHING;

  -- IT Division Departments
  INSERT INTO departments (name, division_id)
  SELECT 'Systems Department', id FROM divisions WHERE name = 'Information Technology Division' AND secretary_id = sec_admin_id
  ON CONFLICT (name, division_id) DO NOTHING;
  
  INSERT INTO departments (name, division_id)
  SELECT 'Support Department', id FROM divisions WHERE name = 'Information Technology Division' AND secretary_id = sec_admin_id
  ON CONFLICT (name, division_id) DO NOTHING;

  -- Operations Division Departments
  INSERT INTO departments (name, division_id)
  SELECT 'Field Operations Department', id FROM divisions WHERE name = 'Operations Division' AND secretary_id = sec_operations_id
  ON CONFLICT (name, division_id) DO NOTHING;
  
  INSERT INTO departments (name, division_id)
  SELECT 'Logistics Department', id FROM divisions WHERE name = 'Operations Division' AND secretary_id = sec_operations_id
  ON CONFLICT (name, division_id) DO NOTHING;

  -- Planning Division Departments
  INSERT INTO departments (name, division_id)
  SELECT 'Strategic Planning Department', id FROM divisions WHERE name = 'Planning Division' AND secretary_id = sec_operations_id
  ON CONFLICT (name, division_id) DO NOTHING;
  
  INSERT INTO departments (name, division_id)
  SELECT 'Project Management Department', id FROM divisions WHERE name = 'Planning Division' AND secretary_id = sec_operations_id
  ON CONFLICT (name, division_id) DO NOTHING;

  -- QA Division Departments
  INSERT INTO departments (name, division_id)
  SELECT 'Quality Control Department', id FROM divisions WHERE name = 'Quality Assurance Division' AND secretary_id = sec_operations_id
  ON CONFLICT (name, division_id) DO NOTHING;
  
  INSERT INTO departments (name, division_id)
  SELECT 'Audit Department', id FROM divisions WHERE name = 'Quality Assurance Division' AND secretary_id = sec_operations_id
  ON CONFLICT (name, division_id) DO NOTHING;

END $$;
