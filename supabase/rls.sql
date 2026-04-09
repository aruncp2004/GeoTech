-- Security definer function to check admin
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- Profiles policies
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.is_admin());

create policy "Admins can update all profiles"
  on public.profiles for update
  using (public.is_admin());

-- Samples policies
create policy "Customers can view own samples"
  on public.samples for select
  using (auth.uid() = customer_id);

create policy "Customers can insert own samples"
  on public.samples for insert
  with check (auth.uid() = customer_id);

create policy "Admins can view all samples"
  on public.samples for select
  using (public.is_admin());

create policy "Admins can update all samples"
  on public.samples for update
  using (public.is_admin());