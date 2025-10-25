-- Delete all existing departments (they were wrong)
DELETE FROM departments;

-- Get division IDs for inserting correct departments
DO $$
DECLARE
  div7_id UUID;
  div1_id UUID;
  div2_id UUID;
  div3_id UUID;
  div4_id UUID;
  div5_id UUID;
  div6_id UUID;
BEGIN
  -- Get division IDs
  SELECT id INTO div7_id FROM divisions WHERE name = 'Executive Division';
  SELECT id INTO div1_id FROM divisions WHERE name = 'Communications Division';
  SELECT id INTO div2_id FROM divisions WHERE name = 'Dissemination Division';
  SELECT id INTO div3_id FROM divisions WHERE name = 'Treasury Division';
  SELECT id INTO div4_id FROM divisions WHERE name = 'Production Division';
  SELECT id INTO div5_id FROM divisions WHERE name = 'Qualifications Division';
  SELECT id INTO div6_id FROM divisions WHERE name = 'Public Division';

  -- Division 7 (Executive Division) departments
  IF div7_id IS NOT NULL THEN
    INSERT INTO departments (name, division_id) VALUES
      ('Office of Source', div7_id),
      ('Office of External Affairs', div7_id),
      ('Office of the Executive Director', div7_id);
  END IF;

  -- Division 1 (Communications Division) departments
  IF div1_id IS NOT NULL THEN
    INSERT INTO departments (name, division_id) VALUES
      ('Department of Routing and Personnel', div1_id),
      ('Department of Internal Communications', div1_id),
      ('Department of Inspections and Reports', div1_id);
  END IF;

  -- Division 2 (Dissemination Division) departments
  IF div2_id IS NOT NULL THEN
    INSERT INTO departments (name, division_id) VALUES
      ('Department of Promotion and Marketing', div2_id),
      ('Department of Publications', div2_id),
      ('Department of Registration', div2_id);
  END IF;

  -- Division 3 (Treasury Division) departments
  IF div3_id IS NOT NULL THEN
    INSERT INTO departments (name, division_id) VALUES
      ('Department of Income', div3_id),
      ('Department of Disbursements', div3_id),
      ('Department of Records, Assets and Materiel', div3_id);
  END IF;

  -- Division 4 (Production Division) departments
  IF div4_id IS NOT NULL THEN
    INSERT INTO departments (name, division_id) VALUES
      ('Department of Production Services', div4_id),
      ('Department of Activity', div4_id),
      ('Department of Programs', div4_id);
  END IF;

  -- Division 5 (Qualifications Division) departments
  IF div5_id IS NOT NULL THEN
    INSERT INTO departments (name, division_id) VALUES
      ('Department of Examinations', div5_id),
      ('Department of Review', div5_id),
      ('Department of Certifications and Awards', div5_id);
  END IF;

  -- Division 6 (Public Division) departments
  IF div6_id IS NOT NULL THEN
    INSERT INTO departments (name, division_id) VALUES
      ('Department of Public Information', div6_id),
      ('Department of Clearing', div6_id),
      ('Department of Success', div6_id);
  END IF;
END $$;
