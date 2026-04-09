-- Profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  company text not null,
  designation text not null,
  email text not null,
  phone text not null,
  address text not null,
  pincode text not null,
  role text not null default 'customer',
  tracking_access boolean not null default false,
  created_at timestamptz not null default now()
);

-- Samples table
create table public.samples (
  id uuid primary key default gen_random_uuid(),
  sample_id text not null unique,
  customer_id uuid references public.profiles(id) on delete cascade not null,
  sample_type text not null,
  test_required text not null,
  num_parcels integer not null default 1,
  weight_kg numeric not null,
  pickup_address text not null,
  pickup_date text not null,
  pickup_time text not null,
  courier_name text not null,
  awb_number text,
  status text not null default 'booked',
  condition text,
  notes text,
  received_at timestamptz,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.samples enable row level security;

-- Auto create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, company, designation, email, phone, address, pincode, role, tracking_access)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'company', ''),
    coalesce(new.raw_user_meta_data->>'designation', ''),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(new.raw_user_meta_data->>'address', ''),
    coalesce(new.raw_user_meta_data->>'pincode', ''),
    'customer',
    false
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();