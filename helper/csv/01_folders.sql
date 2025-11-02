-- Folder Structure for Import
-- Step 1: Run this SQL in Supabase SQL Editor

INSERT INTO folders (name, full_path) VALUES
  ('Executive Strata Org Board', 'scientology/Executive Strata Org Board'),
  ('COMMUNICATIONS EXECUTIVE SECRETARY', 'scientology/Executive Strata Org Board/COMMUNICATIONS EXECUTIVE SECRETARY'),
  ('ORGANIZATION EXECUTIVE SECRETARY', 'scientology/Executive Strata Org Board/ORGANIZATION EXECUTIVE SECRETARY'),
  ('Dissemination Division', 'scientology/Executive Strata Org Board/COMMUNICATIONS EXECUTIVE SECRETARY/Dissemination Division'),
  ('Communications Division', 'scientology/Executive Strata Org Board/COMMUNICATIONS EXECUTIVE SECRETARY/Communications Division'),
  ('Executive Division', 'scientology/Executive Strata Org Board/COMMUNICATIONS EXECUTIVE SECRETARY/Executive Division'),
  ('Treasury Division', 'scientology/Executive Strata Org Board/ORGANIZATION EXECUTIVE SECRETARY/Treasury Division'),
  ('Production Division', 'scientology/Executive Strata Org Board/ORGANIZATION EXECUTIVE SECRETARY/Production Division'),
  ('Public Division', 'scientology/Executive Strata Org Board/ORGANIZATION EXECUTIVE SECRETARY/Public Division'),
  ('Qualifications Division', 'scientology/Executive Strata Org Board/ORGANIZATION EXECUTIVE SECRETARY/Qualifications Division'),
  ('DEPARTMENT ROUTING AND PERSONNEL', 'scientology/Executive Strata Org Board/COMMUNICATIONS EXECUTIVE SECRETARY/Communications Division/DEPARTMENT ROUTING AND PERSONNEL'),
  ('DEPARTMENT OF COMMUNICATIONS', 'scientology/Executive Strata Org Board/COMMUNICATIONS EXECUTIVE SECRETARY/Communications Division/DEPARTMENT OF COMMUNICATIONS'),
  ('DEPARTMENT INSPECTIONS AND REPORTS', 'scientology/Executive Strata Org Board/COMMUNICATIONS EXECUTIVE SECRETARY/Communications Division/DEPARTMENT INSPECTIONS AND REPORTS'),
  ('OFFICE OF SOURCE', 'scientology/Executive Strata Org Board/COMMUNICATIONS EXECUTIVE SECRETARY/Executive Division/OFFICE OF SOURCE'),
  ('OFFICE OF EXTERNAL AFFAIRS', 'scientology/Executive Strata Org Board/COMMUNICATIONS EXECUTIVE SECRETARY/Executive Division/OFFICE OF EXTERNAL AFFAIRS'),
  ('OFFICE OF THE EXECUTIVE DIRECTOR', 'scientology/Executive Strata Org Board/COMMUNICATIONS EXECUTIVE SECRETARY/Executive Division/OFFICE OF THE EXECUTIVE DIRECTOR'),
  ('DEPARTMENT INCOME', 'scientology/Executive Strata Org Board/ORGANIZATION EXECUTIVE SECRETARY/Treasury Division/DEPARTMENT INCOME'),
  ('DEPARTMENT DISBURSEMENTS', 'scientology/Executive Strata Org Board/ORGANIZATION EXECUTIVE SECRETARY/Treasury Division/DEPARTMENT DISBURSEMENTS'),
  ('DEPARTMENT OF RECORDS, ASSETS AND MATERIEL', 'scientology/Executive Strata Org Board/ORGANIZATION EXECUTIVE SECRETARY/Treasury Division/DEPARTMENT OF RECORDS, ASSETS AND MATERIEL'),
  ('DEPARTMENT PRODUCTION SERVICES', 'scientology/Executive Strata Org Board/ORGANIZATION EXECUTIVE SECRETARY/Production Division/DEPARTMENT PRODUCTION SERVICES'),
  ('DEPARTMENT OF ACTIVITY', 'scientology/Executive Strata Org Board/ORGANIZATION EXECUTIVE SECRETARY/Production Division/DEPARTMENT OF ACTIVITY'),
  ('DEPARTMENT PRODUCTION', 'scientology/Executive Strata Org Board/ORGANIZATION EXECUTIVE SECRETARY/Production Division/DEPARTMENT PRODUCTION'),
  ('DEPARTMENT PUBLIC INFORMATION', 'scientology/Executive Strata Org Board/ORGANIZATION EXECUTIVE SECRETARY/Public Division/DEPARTMENT PUBLIC INFORMATION'),
  ('DEPARTMENT OF CLEARING', 'scientology/Executive Strata Org Board/ORGANIZATION EXECUTIVE SECRETARY/Public Division/DEPARTMENT OF CLEARING'),
  ('DEPARTMENT OF SUCCESS', 'scientology/Executive Strata Org Board/ORGANIZATION EXECUTIVE SECRETARY/Public Division/DEPARTMENT OF SUCCESS'),
  ('DEPARTMENT EXAMINATIONS', 'scientology/Executive Strata Org Board/ORGANIZATION EXECUTIVE SECRETARY/Qualifications Division/DEPARTMENT EXAMINATIONS'),
  ('DEPARTMENT REVIEW', 'scientology/Executive Strata Org Board/ORGANIZATION EXECUTIVE SECRETARY/Qualifications Division/DEPARTMENT REVIEW'),
  ('DEPARTMENT OF CERTIFICATIONS AND AWARDS', 'scientology/Executive Strata Org Board/ORGANIZATION EXECUTIVE SECRETARY/Qualifications Division/DEPARTMENT OF CERTIFICATIONS AND AWARDS')
ON CONFLICT (full_path) DO NOTHING;

-- Verify:
SELECT COUNT(*) as folders_created FROM folders 
WHERE full_path LIKE 'scientology/%';
