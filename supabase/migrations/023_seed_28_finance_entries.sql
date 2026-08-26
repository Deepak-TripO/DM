-- 023_seed_28_finance_entries.sql
-- Populate 28 official Finance entries into public.finance_entries with deduplication check

INSERT INTO public.finance_entries (id, date, item, category, description, person, amount, elumugam_amount, deepak_amount, created_at, updated_at)
SELECT * FROM (VALUES
  ('f1000000-0000-4000-8000-000000000001'::uuid, '2026-03-02'::date, 'Domain name', 'Software', 'Domain name for hosting', 'Elumugam', 650.00, NULL::numeric, NULL::numeric, NOW(), NOW()),
  ('f1000000-0000-4000-8000-000000000002'::uuid, '2026-03-02'::date, 'VPS (KVM 1)', 'Software', 'Server for hosting', 'Jana', 567.00, NULL::numeric, NULL::numeric, NOW(), NOW()),
  ('f1000000-0000-4000-8000-000000000003'::uuid, '2026-03-08'::date, 'Claude', 'Software', 'Coding assistant AI tool', 'Elumugam, Jana, Deepak', 2000.00, NULL::numeric, NULL::numeric, NOW(), NOW()),
  ('f1000000-0000-4000-8000-000000000004'::uuid, '2026-03-19'::date, 'Partnership firm', 'Document', 'Document printing for partnership firm', 'Deepak, Elumugam', 650.00, NULL::numeric, NULL::numeric, NOW(), NOW()),
  ('f1000000-0000-4000-8000-000000000005'::uuid, '2026-04-01'::date, 'Renewal (KVM1) VPS', 'Software', 'Server for hosting', 'Elumugam', 1651.00, NULL::numeric, NULL::numeric, NOW(), NOW()),
  ('f1000000-0000-4000-8000-000000000006'::uuid, '2026-04-12'::date, 'Claude', 'Software', 'Coding assistant AI tool', 'Deepak', 2000.00, NULL::numeric, NULL::numeric, NOW(), NOW()),
  ('f1000000-0000-4000-8000-000000000007'::uuid, '2026-04-13'::date, 'ID Card pre cost', 'ID Card', 'TripO ID Card for 3', 'Deepak', 500.00, NULL::numeric, NULL::numeric, NOW(), NOW()),
  ('f1000000-0000-4000-8000-000000000008'::uuid, '2026-04-16'::date, 'ID Card pending payment', 'ID Card', 'Pending ID card payment', 'Elumugam', 220.00, NULL::numeric, NULL::numeric, NOW(), NOW()),
  ('f1000000-0000-4000-8000-000000000009'::uuid, '2026-04-17'::date, 'Playstore developer account', 'Software', 'Developer account for Playstore', 'Deepak', 2500.00, NULL::numeric, NULL::numeric, NOW(), NOW()),
  ('f1000000-0000-4000-8000-000000000010'::uuid, '2026-04-25'::date, 'Supabase', 'Software', 'Renewal of Supabase storage', 'Deepak', 2500.00, NULL::numeric, NULL::numeric, NOW(), NOW()),
  ('f1000000-0000-4000-8000-000000000011'::uuid, '2026-05-01'::date, 'Partnership firm', 'Document', 'Partnership firm registration', 'Elumugam', 200.00, NULL::numeric, NULL::numeric, NOW(), NOW()),
  ('f1000000-0000-4000-8000-000000000012'::uuid, '2026-05-02'::date, 'Renewal (KVM1) VPS', 'Software', 'Server for hosting', 'Elumugam', 1651.00, NULL::numeric, NULL::numeric, NOW(), NOW()),
  ('f1000000-0000-4000-8000-000000000013'::uuid, '2026-05-16'::date, 'Organisation Gmail', 'Software', 'Gmail for Organisation', 'Elumugam', 500.00, NULL::numeric, NULL::numeric, NOW(), NOW()),
  ('f1000000-0000-4000-8000-000000000014'::uuid, '2026-05-25'::date, 'Supabase', 'Software', 'Renewal of Supabase storage', 'Elumugam, Deepak', 2500.00, 1500.00, 1000.00, NOW(), NOW()),
  ('f1000000-0000-4000-8000-000000000015'::uuid, '2026-06-02'::date, 'Renewal (KVM1) VPS', 'Software', 'Server for hosting', 'Elumugam, Deepak', 1651.00, 851.00, 800.00, NOW(), NOW()),
  ('f1000000-0000-4000-8000-000000000016'::uuid, '2026-06-05'::date, 'Organisation Gmail', 'Software', 'Organisation Gmail renewal', 'Elumugam', 140.00, NULL::numeric, NULL::numeric, NOW(), NOW()),
  ('f1000000-0000-4000-8000-000000000017'::uuid, '2026-06-16'::date, 'Claude', 'Software', 'Coding assistant AI tool', 'Elumugam, Deepak', 2000.00, 900.00, 1100.00, NOW(), NOW()),
  ('f1000000-0000-4000-8000-000000000018'::uuid, '2026-06-26'::date, 'Supabase', 'Software', 'Renewal of Supabase storage', 'Elumugam, Deepak', 2500.00, 1500.00, 1000.00, NOW(), NOW()),
  ('f1000000-0000-4000-8000-000000000019'::uuid, '2026-07-01'::date, 'Organisation Gmail', 'Software', 'Organisation Gmail renewal', 'Elumugam', 524.00, NULL::numeric, NULL::numeric, NOW(), NOW()),
  ('f1000000-0000-4000-8000-000000000020'::uuid, '2026-07-04'::date, 'Renewal (KVM1) VPS', 'Software', 'Server for hosting', 'Deepak', 1651.00, NULL::numeric, NULL::numeric, NOW(), NOW()),
  ('f1000000-0000-4000-8000-000000000021'::uuid, '2026-07-26'::date, 'Supabase', 'Software', 'Renewal of Supabase storage', 'Elumugam, Deepak', 2527.00, 1500.00, 1027.00, NOW(), NOW()),
  ('f1000000-0000-4000-8000-000000000022'::uuid, '2026-08-03'::date, 'Organisation Gmail', 'Software', 'Organisation Gmail renewal', 'Elumugam', 850.00, NULL::numeric, NULL::numeric, NOW(), NOW()),
  ('f1000000-0000-4000-8000-000000000023'::uuid, '2026-08-04'::date, 'Renewal (KVM1) VPS', 'Software', 'Server for hosting', 'Elumugam, Deepak', 1850.00, 1550.00, 300.00, NOW(), NOW()),
  ('f1000000-0000-4000-8000-000000000024'::uuid, '2026-08-10'::date, 'Claude', 'Software', 'Coding assistant AI tool', 'Elumugam', 2000.00, NULL::numeric, NULL::numeric, NOW(), NOW()),
  ('f1000000-0000-4000-8000-000000000025'::uuid, '2026-08-17'::date, 'Company Seal', 'Seal', 'Authorized signature seal', 'Deepak', 185.00, NULL::numeric, NULL::numeric, NOW(), NOW()),
  ('f1000000-0000-4000-8000-000000000026'::uuid, '2026-08-17'::date, 'Company PAN card', 'PAN', 'Company PAN apply', 'Deepak', 250.00, NULL::numeric, NULL::numeric, NOW(), NOW()),
  ('f1000000-0000-4000-8000-000000000027'::uuid, '2026-08-23'::date, 'Workshop Expense', 'Workshop', 'EgaleAI Workshop', 'Deepak', 100.00, NULL::numeric, NULL::numeric, NOW(), NOW()),
  ('f1000000-0000-4000-8000-000000000028'::uuid, '2026-08-25'::date, 'Supabase', 'Software', 'Renewal of Supabase storage', 'Elumugam, Deepak', 2950.00, 2300.00, 650.00, NOW(), NOW())
) AS v(id, date, item, category, description, person, amount, elumugam_amount, deepak_amount, created_at, updated_at)
ON CONFLICT (id) DO NOTHING;
