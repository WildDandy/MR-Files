-- Delete ALL incorrect divisions and departments
DELETE FROM departments;
DELETE FROM divisions;
DELETE FROM secretaries;
DELETE FROM executive_directors;

-- Add the correct Executive Directors from the organizational chart
INSERT INTO executive_directors (id, name) VALUES
  (gen_random_uuid(), 'Communications Executive Secretary'),
  (gen_random_uuid(), 'Organization Executive Secretary');

-- Get the executive director IDs for reference
DO $$
DECLARE
  comm_exec_id uuid;
  org_exec_id uuid;
BEGIN
  SELECT id INTO comm_exec_id FROM executive_directors WHERE name = 'Communications Executive Secretary';
  SELECT id INTO org_exec_id FROM executive_directors WHERE name = 'Organization Executive Secretary';

  -- Add secretaries
  INSERT INTO secretaries (id, name, executive_director_id) VALUES
    (gen_random_uuid(), 'Division 7 Secretary', comm_exec_id),
    (gen_random_uuid(), 'Communications Secretary', comm_exec_id),
    (gen_random_uuid(), 'Dissemination Secretary', comm_exec_id),
    (gen_random_uuid(), 'Treasury Secretary', org_exec_id),
    (gen_random_uuid(), 'Production Secretary', org_exec_id),
    (gen_random_uuid(), 'Qualifications Secretary', org_exec_id),
    (gen_random_uuid(), 'Public Secretary', org_exec_id);
END $$;

-- Add the 7 divisions from the organizational chart with correct colors
INSERT INTO divisions (id, name, color, secretary_id) VALUES
  (gen_random_uuid(), 'Executive Division', '#8FC6FF', (SELECT id FROM secretaries WHERE name = 'Division 7 Secretary')),
  (gen_random_uuid(), 'Communications Division', '#FFE576', (SELECT id FROM secretaries WHERE name = 'Communications Secretary')),
  (gen_random_uuid(), 'Dissemination Division', '#D59DFE', (SELECT id FROM secretaries WHERE name = 'Dissemination Secretary')),
  (gen_random_uuid(), 'Treasury Division', '#F7CBE8', (SELECT id FROM secretaries WHERE name = 'Treasury Secretary')),
  (gen_random_uuid(), 'Production Division', '#73F03A', (SELECT id FROM secretaries WHERE name = 'Production Secretary')),
  (gen_random_uuid(), 'Qualifications Division', '#CACECF', (SELECT id FROM secretaries WHERE name = 'Qualifications Secretary')),
  (gen_random_uuid(), 'Public Division', '#F0C464', (SELECT id FROM secretaries WHERE name = 'Public Secretary'));

-- Add departments for Division 7 (Executive Division)
INSERT INTO departments (id, name, division_id) VALUES
  (gen_random_uuid(), 'Office of Source', (SELECT id FROM divisions WHERE name = 'Executive Division')),
  (gen_random_uuid(), 'Office of External Affairs', (SELECT id FROM divisions WHERE name = 'Executive Division')),
  (gen_random_uuid(), 'Office of the Executive Director', (SELECT id FROM divisions WHERE name = 'Executive Division'));

-- Add departments for Division 1 (Communications Division)
INSERT INTO departments (id, name, division_id) VALUES
  (gen_random_uuid(), 'Department of Routing and Personnel', (SELECT id FROM divisions WHERE name = 'Communications Division')),
  (gen_random_uuid(), 'Department of Internal Communications', (SELECT id FROM divisions WHERE name = 'Communications Division')),
  (gen_random_uuid(), 'Department of Inspections and Reports', (SELECT id FROM divisions WHERE name = 'Communications Division'));

-- Add departments for Division 2 (Dissemination Division)
INSERT INTO departments (id, name, division_id) VALUES
  (gen_random_uuid(), 'Department of Promotion and Marketing', (SELECT id FROM divisions WHERE name = 'Dissemination Division')),
  (gen_random_uuid(), 'Department of Publications', (SELECT id FROM divisions WHERE name = 'Dissemination Division')),
  (gen_random_uuid(), 'Department of Registration', (SELECT id FROM divisions WHERE name = 'Dissemination Division'));

-- Add departments for Division 3 (Treasury Division)
INSERT INTO departments (id, name, division_id) VALUES
  (gen_random_uuid(), 'Department of Income', (SELECT id FROM divisions WHERE name = 'Treasury Division')),
  (gen_random_uuid(), 'Department of Disbursements', (SELECT id FROM divisions WHERE name = 'Treasury Division')),
  (gen_random_uuid(), 'Department of Records, Assets and Materiel', (SELECT id FROM divisions WHERE name = 'Treasury Division'));

-- Add departments for Division 4 (Production Division)
INSERT INTO departments (id, name, division_id) VALUES
  (gen_random_uuid(), 'Department of Production Services', (SELECT id FROM divisions WHERE name = 'Production Division')),
  (gen_random_uuid(), 'Department of Activity', (SELECT id FROM divisions WHERE name = 'Production Division')),
  (gen_random_uuid(), 'Department of Programs', (SELECT id FROM divisions WHERE name = 'Production Division'));

-- Add departments for Division 5 (Qualifications Division)
INSERT INTO departments (id, name, division_id) VALUES
  (gen_random_uuid(), 'Department of Examinations', (SELECT id FROM divisions WHERE name = 'Qualifications Division')),
  (gen_random_uuid(), 'Department of Review', (SELECT id FROM divisions WHERE name = 'Qualifications Division')),
  (gen_random_uuid(), 'Department of Certifications and Awards', (SELECT id FROM divisions WHERE name = 'Qualifications Division'));

-- Add departments for Division 6 (Public Division)
INSERT INTO departments (id, name, division_id) VALUES
  (gen_random_uuid(), 'Department of Public Information', (SELECT id FROM divisions WHERE name = 'Public Division')),
  (gen_random_uuid(), 'Department of Clearing', (SELECT id FROM divisions WHERE name = 'Public Division')),
  (gen_random_uuid(), 'Department of Success', (SELECT id FROM divisions WHERE name = 'Public Division'));
