-- ==============================================================================
-- DueNudge - Phase 1 Supabase Database Schema, RLS, and Storage Configuration
-- ==============================================================================

-- 1. Enable UUID generator extension if not already enabled
create extension if not exists "uuid-ossp";

-- 2. Create public.users table (mirrors auth.users with public profile attributes)
create table if not exists public.users (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable RLS on public.users
alter table public.users enable row level security;

-- Policies for public.users
drop policy if exists "Users can view their own profile" on public.users;
create policy "Users can view their own profile"
  on public.users for select
  using (auth.uid() = id);

drop policy if exists "Users can insert their own profile" on public.users;
create policy "Users can insert their own profile"
  on public.users for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.users;
create policy "Users can update their own profile"
  on public.users for update
  using (auth.uid() = id);

-- 3. Create public.business_profiles table
create table if not exists public.business_profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  business_name text not null default '',
  logo_url text default '',
  address text default '',
  currency varchar(10) not null default 'USD',
  payment_instructions text default '',
  default_due_days integer not null default 14,
  invoice_prefix varchar(20) not null default 'INV-',
  timezone varchar(100) not null default 'UTC',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable RLS on public.business_profiles
alter table public.business_profiles enable row level security;

-- Policies for public.business_profiles
drop policy if exists "Users can view their own business profile" on public.business_profiles;
create policy "Users can view their own business profile"
  on public.business_profiles for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own business profile" on public.business_profiles;
create policy "Users can insert their own business profile"
  on public.business_profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own business profile" on public.business_profiles;
create policy "Users can update their own business profile"
  on public.business_profiles for update
  using (auth.uid() = user_id);

-- 4. Automatic User & Business Profile Creation Trigger
create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_name text;
begin
  -- Resolve display name from OAuth provider metadata if present
  v_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );

  -- Insert profile into public.users
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    v_name,
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', '')
  )
  on conflict (id) do update set
    email = excluded.email,
    updated_at = now();

  -- Provision initial default business profile
  insert into public.business_profiles (
    user_id,
    business_name,
    currency,
    default_due_days,
    invoice_prefix,
    timezone
  )
  values (
    new.id,
    v_name || '''s Business',
    'USD',
    14,
    'INV-',
    'UTC'
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$ language plpgsql security definer;

-- Trigger firing on every new user signup in auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. Supabase Storage Bucket for Business Logos
insert into storage.buckets (id, name, public)
values ('business-logos', 'business-logos', true)
on conflict (id) do nothing;

-- Storage RLS: Public read for invoice rendering
drop policy if exists "Public Access to Business Logos" on storage.objects;
create policy "Public Access to Business Logos"
  on storage.objects for select
  using (bucket_id = 'business-logos');

-- Storage RLS: Authenticated users can upload logos
drop policy if exists "Authenticated users can upload business logo" on storage.objects;
create policy "Authenticated users can upload business logo"
  on storage.objects for insert
  with check (
    bucket_id = 'business-logos'
    and auth.role() = 'authenticated'
  );

-- Storage RLS: Users can update/delete their own uploaded logos
drop policy if exists "Users can update their uploaded logos" on storage.objects;
create policy "Users can update their uploaded logos"
  on storage.objects for update
  using (
    bucket_id = 'business-logos'
    and auth.role() = 'authenticated'
  );

drop policy if exists "Users can delete their uploaded logos" on storage.objects;
create policy "Users can delete their uploaded logos"
  on storage.objects for delete
  using (
    bucket_id = 'business-logos'
    and auth.role() = 'authenticated'
  );
