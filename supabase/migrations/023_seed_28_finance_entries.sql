-- 023_seed_28_finance_entries.sql
-- Seed the 28 Finance Entries into public.finance_entries with duplicate prevention

DO $$
BEGIN
    -- 1. Domain name
    IF NOT EXISTS (SELECT 1 FROM public.finance_entries WHERE date = '2026-03-02' AND item = 'Domain name' AND amount = 650) THEN
        INSERT INTO public.finance_entries (date, item, category, description, person, amount, elumugam_amount, deepak_amount)
        VALUES ('2026-03-02', 'Domain name', 'Software', 'Domain name for hosting', 'Elumugam', 650.00, NULL, NULL);
    END IF;

    -- 2. VPS (KVM 1)
    IF NOT EXISTS (SELECT 1 FROM public.finance_entries WHERE date = '2026-03-02' AND item = 'VPS (KVM 1)' AND amount = 567) THEN
        INSERT INTO public.finance_entries (date, item, category, description, person, amount, elumugam_amount, deepak_amount)
        VALUES ('2026-03-02', 'VPS (KVM 1)', 'Software', 'Server for hosting', 'Elumugam + Deepak', 567.00, 283.00, 283.00);
    END IF;

    -- 3. Claude
    IF NOT EXISTS (SELECT 1 FROM public.finance_entries WHERE date = '2026-03-08' AND item = 'Claude' AND amount = 2000) THEN
        INSERT INTO public.finance_entries (date, item, category, description, person, amount, elumugam_amount, deepak_amount)
        VALUES ('2026-03-08', 'Claude', 'Software', 'Coding assistant AI tool', 'Elumugam + Deepak', 2000.00, 1000.00, 1000.00);
    END IF;

    -- 4. Partnership firm
    IF NOT EXISTS (SELECT 1 FROM public.finance_entries WHERE date = '2026-03-19' AND item = 'Partnership firm' AND amount = 650) THEN
        INSERT INTO public.finance_entries (date, item, category, description, person, amount, elumugam_amount, deepak_amount)
        VALUES ('2026-03-19', 'Partnership firm', 'Document', 'Document printing for partnership firm', 'Elumugam + Deepak', 650.00, 325.00, 325.00);
    END IF;

    -- 5. Renewal (KVM1) VPS
    IF NOT EXISTS (SELECT 1 FROM public.finance_entries WHERE date = '2026-04-01' AND item = 'Renewal (KVM1) VPS' AND amount = 1651) THEN
        INSERT INTO public.finance_entries (date, item, category, description, person, amount, elumugam_amount, deepak_amount)
        VALUES ('2026-04-01', 'Renewal (KVM1) VPS', 'Software', 'Server for hosting', 'Elumugam', 1651.00, NULL, NULL);
    END IF;

    -- 6. Claude
    IF NOT EXISTS (SELECT 1 FROM public.finance_entries WHERE date = '2026-04-12' AND item = 'Claude' AND amount = 2000) THEN
        INSERT INTO public.finance_entries (date, item, category, description, person, amount, elumugam_amount, deepak_amount)
        VALUES ('2026-04-12', 'Claude', 'Software', 'Coding assistant AI tool', 'Deepak', 2000.00, NULL, NULL);
    END IF;

    -- 7. ID Card pre cost
    IF NOT EXISTS (SELECT 1 FROM public.finance_entries WHERE date = '2026-04-13' AND item = 'ID Card pre cost' AND amount = 500) THEN
        INSERT INTO public.finance_entries (date, item, category, description, person, amount, elumugam_amount, deepak_amount)
        VALUES ('2026-04-13', 'ID Card pre cost', 'ID Card', 'TripO ID Card for 3', 'Deepak', 500.00, NULL, NULL);
    END IF;

    -- 8. ID Card pending payment
    IF NOT EXISTS (SELECT 1 FROM public.finance_entries WHERE date = '2026-04-16' AND item = 'ID Card pending payment' AND amount = 220) THEN
        INSERT INTO public.finance_entries (date, item, category, description, person, amount, elumugam_amount, deepak_amount)
        VALUES ('2026-04-16', 'ID Card pending payment', 'ID Card', 'Pending ID card payment', 'Elumugam', 220.00, NULL, NULL);
    END IF;

    -- 9. playstore developer account
    IF NOT EXISTS (SELECT 1 FROM public.finance_entries WHERE date = '2026-04-17' AND item = 'playstore developer account' AND amount = 2500) THEN
        INSERT INTO public.finance_entries (date, item, category, description, person, amount, elumugam_amount, deepak_amount)
        VALUES ('2026-04-17', 'playstore developer account', 'Software', 'Devoper account for playstore', 'Deepak', 2500.00, NULL, NULL);
    END IF;

    -- 10. supabase
    IF NOT EXISTS (SELECT 1 FROM public.finance_entries WHERE date = '2026-04-25' AND item = 'supabase' AND amount = 2500) THEN
        INSERT INTO public.finance_entries (date, item, category, description, person, amount, elumugam_amount, deepak_amount)
        VALUES ('2026-04-25', 'supabase', 'Software', 'Renewal of supabase storage', 'Deepak', 2500.00, NULL, NULL);
    END IF;

    -- 11. Partnership firm
    IF NOT EXISTS (SELECT 1 FROM public.finance_entries WHERE date = '2026-05-01' AND item = 'Partnership firm' AND amount = 200) THEN
        INSERT INTO public.finance_entries (date, item, category, description, person, amount, elumugam_amount, deepak_amount)
        VALUES ('2026-05-01', 'Partnership firm', 'Document', 'Partnership firm registration', 'Elumugam', 200.00, NULL, NULL);
    END IF;

    -- 12. Renewal (KVM1) VPS
    IF NOT EXISTS (SELECT 1 FROM public.finance_entries WHERE date = '2026-05-02' AND item = 'Renewal (KVM1) VPS' AND amount = 1651) THEN
        INSERT INTO public.finance_entries (date, item, category, description, person, amount, elumugam_amount, deepak_amount)
        VALUES ('2026-05-02', 'Renewal (KVM1) VPS', 'Software', 'Server for hosting', 'Elumugam', 1651.00, NULL, NULL);
    END IF;

    -- 13. Organisation Gmail
    IF NOT EXISTS (SELECT 1 FROM public.finance_entries WHERE date = '2026-05-16' AND item = 'Organisation Gmail' AND amount = 500) THEN
        INSERT INTO public.finance_entries (date, item, category, description, person, amount, elumugam_amount, deepak_amount)
        VALUES ('2026-05-16', 'Organisation Gmail', 'Software', 'Gmail for Organaisation', 'Elumugam', 500.00, NULL, NULL);
    END IF;

    -- 14. supabase
    IF NOT EXISTS (SELECT 1 FROM public.finance_entries WHERE date = '2026-05-25' AND item = 'supabase' AND amount = 2500) THEN
        INSERT INTO public.finance_entries (date, item, category, description, person, amount, elumugam_amount, deepak_amount)
        VALUES ('2026-05-25', 'supabase', 'Software', 'Renewal of supabase storage', 'Elumugam + Deepak', 2500.00, 1500.00, 1000.00);
    END IF;

    -- 15. Renewal (KVM1) VPS
    IF NOT EXISTS (SELECT 1 FROM public.finance_entries WHERE date = '2026-06-02' AND item = 'Renewal (KVM1) VPS' AND amount = 1651) THEN
        INSERT INTO public.finance_entries (date, item, category, description, person, amount, elumugam_amount, deepak_amount)
        VALUES ('2026-06-02', 'Renewal (KVM1) VPS', 'Software', 'Server for hosting', 'Elumugam + Deepak', 1651.00, 851.00, 800.00);
    END IF;

    -- 16. Organisation Gmail
    IF NOT EXISTS (SELECT 1 FROM public.finance_entries WHERE date = '2026-06-05' AND item = 'Organisation Gmail' AND amount = 140) THEN
        INSERT INTO public.finance_entries (date, item, category, description, person, amount, elumugam_amount, deepak_amount)
        VALUES ('2026-06-05', 'Organisation Gmail', 'Software', 'Organaisation Gmail renewal', 'Elumugam', 140.00, NULL, NULL);
    END IF;

    -- 17. Claude
    IF NOT EXISTS (SELECT 1 FROM public.finance_entries WHERE date = '2026-06-16' AND item = 'Claude' AND amount = 2000) THEN
        INSERT INTO public.finance_entries (date, item, category, description, person, amount, elumugam_amount, deepak_amount)
        VALUES ('2026-06-16', 'Claude', 'Software', 'Coding assistant AI tool', 'Elumugam + Deepak', 2000.00, 900.00, 1100.00);
    END IF;

    -- 18. supabase
    IF NOT EXISTS (SELECT 1 FROM public.finance_entries WHERE date = '2026-06-26' AND item = 'supabase' AND amount = 2500) THEN
        INSERT INTO public.finance_entries (date, item, category, description, person, amount, elumugam_amount, deepak_amount)
        VALUES ('2026-06-26', 'supabase', 'Software', 'Renewal of supabase storage', 'Elumugam + Deepak', 2500.00, 1500.00, 1000.00);
    END IF;

    -- 19. Organisation Gmail
    IF NOT EXISTS (SELECT 1 FROM public.finance_entries WHERE date = '2026-07-01' AND item = 'Organisation Gmail' AND amount = 524) THEN
        INSERT INTO public.finance_entries (date, item, category, description, person, amount, elumugam_amount, deepak_amount)
        VALUES ('2026-07-01', 'Organisation Gmail', 'Software', 'Organaisation Gmail renewal', 'Elumugam', 524.00, NULL, NULL);
    END IF;

    -- 20. Renewal (KVM1) VPS
    IF NOT EXISTS (SELECT 1 FROM public.finance_entries WHERE date = '2026-07-04' AND item = 'Renewal (KVM1) VPS' AND amount = 1651) THEN
        INSERT INTO public.finance_entries (date, item, category, description, person, amount, elumugam_amount, deepak_amount)
        VALUES ('2026-07-04', 'Renewal (KVM1) VPS', 'Software', 'Server for hosting', 'Deepak', 1651.00, NULL, NULL);
    END IF;

    -- 21. supabase
    IF NOT EXISTS (SELECT 1 FROM public.finance_entries WHERE date = '2026-07-26' AND item = 'supabase' AND amount = 2527) THEN
        INSERT INTO public.finance_entries (date, item, category, description, person, amount, elumugam_amount, deepak_amount)
        VALUES ('2026-07-26', 'supabase', 'Software', 'Renewal of supabase storage', 'Elumugam + Deepak', 2527.00, 1500.00, 1027.00);
    END IF;

    -- 22. Organisation Gmail
    IF NOT EXISTS (SELECT 1 FROM public.finance_entries WHERE date = '2026-08-03' AND item = 'Organisation Gmail' AND amount = 850) THEN
        INSERT INTO public.finance_entries (date, item, category, description, person, amount, elumugam_amount, deepak_amount)
        VALUES ('2026-08-03', 'Organisation Gmail', 'Software', 'Organaisation Gmail renewal', 'Elumugam', 850.00, NULL, NULL);
    END IF;

    -- 23. Renewal (KVM1) VPS
    IF NOT EXISTS (SELECT 1 FROM public.finance_entries WHERE date = '2026-08-04' AND item = 'Renewal (KVM1) VPS' AND amount = 1850) THEN
        INSERT INTO public.finance_entries (date, item, category, description, person, amount, elumugam_amount, deepak_amount)
        VALUES ('2026-08-04', 'Renewal (KVM1) VPS', 'Software', 'Server for hosting', 'Elumugam + Deepak', 1850.00, 1550.00, 300.00);
    END IF;

    -- 24. Claude
    IF NOT EXISTS (SELECT 1 FROM public.finance_entries WHERE date = '2026-08-10' AND item = 'Claude' AND amount = 2000) THEN
        INSERT INTO public.finance_entries (date, item, category, description, person, amount, elumugam_amount, deepak_amount)
        VALUES ('2026-08-10', 'Claude', 'Software', 'Coding assistant AI tool', 'Elumugam', 2000.00, NULL, NULL);
    END IF;

    -- 25. Company Seal
    IF NOT EXISTS (SELECT 1 FROM public.finance_entries WHERE date = '2026-08-17' AND item = 'Company Seal' AND amount = 185) THEN
        INSERT INTO public.finance_entries (date, item, category, description, person, amount, elumugam_amount, deepak_amount)
        VALUES ('2026-08-17', 'Company Seal', 'Seal', 'Authorized signature seal', 'Deepak', 185.00, NULL, NULL);
    END IF;

    -- 26. Company PAN card
    IF NOT EXISTS (SELECT 1 FROM public.finance_entries WHERE date = '2026-08-17' AND item = 'Company PAN card' AND amount = 250) THEN
        INSERT INTO public.finance_entries (date, item, category, description, person, amount, elumugam_amount, deepak_amount)
        VALUES ('2026-08-17', 'Company PAN card', 'PAN', 'Company PAN apply', 'Deepak', 250.00, NULL, NULL);
    END IF;

    -- 27. Workshop Expense
    IF NOT EXISTS (SELECT 1 FROM public.finance_entries WHERE date = '2026-08-23' AND item = 'Workshop Expense' AND amount = 100) THEN
        INSERT INTO public.finance_entries (date, item, category, description, person, amount, elumugam_amount, deepak_amount)
        VALUES ('2026-08-23', 'Workshop Expense', 'Workshop', 'EgaleAI Workshop', 'Deepak', 100.00, NULL, NULL);
    END IF;

    -- 28. supabase
    IF NOT EXISTS (SELECT 1 FROM public.finance_entries WHERE date = '2026-08-25' AND item = 'supabase' AND amount = 2950) THEN
        INSERT INTO public.finance_entries (date, item, category, description, person, amount, elumugam_amount, deepak_amount)
        VALUES ('2026-08-25', 'supabase', 'Software', 'Renewal of supabase storage', 'Elumugam + Deepak', 2950.00, 2300.00, 650.00);
    END IF;
END $$;
