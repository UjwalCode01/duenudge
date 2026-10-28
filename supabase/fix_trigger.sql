-- ==============================================================================
-- DueNudge - SAFE TRIGGER FIX
-- Run this in Supabase SQL Editor FIRST before running the full schema
-- Project: https://supabase.com/dashboard/project/pecdzfkbhvicejwpzjsq/sql/new
-- ==============================================================================

-- This replaces the handle_new_user() trigger with a safe version that
-- uses exception handlers so auth signup NEVER fails due to DB issues.

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

  -- Insert into public.users (safe - non-blocking on conflict)
  begin
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
  exception when others then
    -- Log and continue; never block auth signup
    raise warning 'handle_new_user: users insert failed: %', sqlerrm;
  end;

  -- Insert into public.profiles (safe - non-blocking on conflict)
  begin
    insert into public.profiles (
      id,
      user_id,
      business_name,
      currency,
      default_due_days,
      invoice_prefix,
      timezone
    )
    values (
      new.id,
      new.id,
      v_name || '''s Business',
      'USD',
      14,
      'INV-',
      'UTC'
    )
    on conflict (id) do nothing;
  exception when others then
    raise warning 'handle_new_user: profiles insert failed: %', sqlerrm;
  end;

  -- Insert into public.business_profiles (safe - non-blocking on conflict)
  begin
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
  exception when others then
    raise warning 'handle_new_user: business_profiles insert failed: %', sqlerrm;
  end;

  return new;
end;
$$ language plpgsql security definer;

-- Re-attach the trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
