-- Test data — only run in development
-- Admin user must be created via Supabase Auth first

-- Update admin role
update public.profiles
set role = 'admin',
    full_name = 'Admin',
    company = 'Velciti Consulting Engineers',
    designation = 'Administrator',
    phone = '0000000000',
    address = 'Velachery, Chennai',
    pincode = '600042'
where email = 'arun1504004@gmail.com';