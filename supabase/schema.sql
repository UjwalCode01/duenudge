-- ==============================================================================
-- DueNudge - Full Database Schema, RLS, and Storage Configuration
-- Includes Phase 1 (Users, Business Profiles, Storage)
-- and Phase 2 (Clients, Invoices, Invoice Items)
-- ==============================================================================

-- 1. Enable UUID generator extension
create extension if not exists "uuid-ossp";

-- ==============================================================================
-- PHASE 1 TABLES: USERS & BUSINESS PROFILES
-- ==============================================================================

-- Create public.users table
create table if not exists public.users (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.users enable row level security;

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

-- Create public.business_profiles table
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

alter table public.business_profiles enable row level security;

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

-- Automatic User & Profile Creation Trigger
create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_name text;
begin
  v_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );

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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Storage Bucket for Business Logos
insert into storage.buckets (id, name, public)
values ('business-logos', 'business-logos', true)
on conflict (id) do nothing;

drop policy if exists "Public Access to Business Logos" on storage.objects;
create policy "Public Access to Business Logos"
  on storage.objects for select
  using (bucket_id = 'business-logos');

drop policy if exists "Authenticated users can upload business logo" on storage.objects;
create policy "Authenticated users can upload business logo"
  on storage.objects for insert
  with check (
    bucket_id = 'business-logos'
    and auth.role() = 'authenticated'
  );

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

-- ==============================================================================
-- PHASE 2 TABLES: CLIENTS, INVOICES & INVOICE ITEMS
-- ==============================================================================

-- 1. Clients Table
create table if not exists public.clients (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  email text not null,
  company text default '',
  currency varchar(10) default 'USD',
  default_payment_terms integer default 14,
  address text default '',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.clients enable row level security;

drop policy if exists "Users can view their own clients" on public.clients;
create policy "Users can view their own clients"
  on public.clients for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own clients" on public.clients;
create policy "Users can insert their own clients"
  on public.clients for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own clients" on public.clients;
create policy "Users can update their own clients"
  on public.clients for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their own clients" on public.clients;
create policy "Users can delete their own clients"
  on public.clients for delete
  using (auth.uid() = user_id);

-- 2. Invoices Table
create table if not exists public.invoices (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  client_id uuid references public.clients(id) on delete set null,
  invoice_number text not null,
  issue_date date not null default current_date,
  due_date date not null,
  status text not null default 'draft' check (status in ('draft', 'sent', 'overdue', 'paid')),
  currency varchar(10) default 'USD',
  subtotal numeric(12,2) not null default 0.00,
  tax_percentage numeric(5,2) not null default 0.00,
  tax_amount numeric(12,2) not null default 0.00,
  total_amount numeric(12,2) not null default 0.00,
  notes text default '',
  payment_instructions text default '',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.invoices enable row level security;

drop policy if exists "Users can view their own invoices" on public.invoices;
create policy "Users can view their own invoices"
  on public.invoices for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own invoices" on public.invoices;
create policy "Users can insert their own invoices"
  on public.invoices for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own invoices" on public.invoices;
create policy "Users can update their own invoices"
  on public.invoices for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their own invoices" on public.invoices;
create policy "Users can delete their own invoices"
  on public.invoices for delete
  using (auth.uid() = user_id);

-- 3. Invoice Items Table
create table if not exists public.invoice_items (
  id uuid default gen_random_uuid() primary key,
  invoice_id uuid references public.invoices(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  description text not null default '',
  quantity numeric(10,2) not null default 1,
  rate numeric(12,2) not null default 0.00,
  amount numeric(12,2) not null default 0.00,
  order_index integer not null default 0,
  created_at timestamptz default now() not null
);

alter table public.invoice_items enable row level security;

drop policy if exists "Users can view their own invoice items" on public.invoice_items;
create policy "Users can view their own invoice items"
  on public.invoice_items for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own invoice items" on public.invoice_items;
create policy "Users can insert their own invoice items"
  on public.invoice_items for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own invoice items" on public.invoice_items;
create policy "Users can update their own invoice items"
  on public.invoice_items for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their own invoice items" on public.invoice_items;
create policy "Users can delete their own invoice items"
  on public.invoice_items for delete
  using (auth.uid() = user_id);

-- Indexes for performance
create index if not exists idx_clients_user_id on public.clients(user_id);
create index if not exists idx_invoices_user_id on public.invoices(user_id);
create index if not exists idx_invoices_client_id on public.invoices(client_id);
create index if not exists idx_invoices_status on public.invoices(status);
create index if not exists idx_invoice_items_invoice_id on public.invoice_items(invoice_id);
create index if not exists idx_invoice_items_user_id on public.invoice_items(user_id);
