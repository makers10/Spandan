-- ====================================================================
-- Spandan Fitness Tracking Database Schema
-- Supabase PostgreSQL with Strict Row Level Security (RLS)
-- ====================================================================

-- 1. Enable necessary extensions
create extension if not exists "pgcrypto";

-- 2. Create PROFILES table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  username text unique,
  avatar_text text,
  bio text default 'Spandan Athlete. Tracking the athletic pulse.',
  city text default 'Athlete City',
  weekly_distance_goal_km numeric(6, 2) default 50.0,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 3. Create ACTIVITIES table
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  type text not null check (type in ('run', 'ride', 'walk')),
  distance_km numeric(8, 2) not null check (distance_km >= 0),
  duration_formatted text not null,
  duration_seconds integer not null check (duration_seconds >= 0),
  pace_or_speed_formatted text not null,
  pace_or_speed_label text not null default 'Avg Pace',
  elevation_meters integer default 0 check (elevation_meters >= 0),
  calories integer default 0 check (calories >= 0),
  avg_heart_rate integer check (avg_heart_rate >= 0),
  max_heart_rate integer check (max_heart_rate >= 0),
  cadence_or_steps text,
  location text default 'Outdoor GPS Session',
  gear_name text,
  polyline_preview text,
  created_at timestamptz default now() not null
);

-- 4. Create Indexes for query performance
create index if not exists idx_activities_user_id on public.activities(user_id);
create index if not exists idx_activities_created_at on public.activities(created_at desc);
create index if not exists idx_activities_type on public.activities(type);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- Enable RLS on both tables
alter table public.profiles enable row level security;
alter table public.activities enable row level security;

-- PROFILES POLICIES
-- Anyone authenticated can view public athlete profiles
create policy "Allow read access to profiles"
  on public.profiles
  for select
  using (true);

-- Users can insert their own profile matching auth.uid()
create policy "Users can insert own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

-- Users can only update their own profile
create policy "Users can update own profile"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ACTIVITIES POLICIES
-- Users can only view their own activities (private data isolation)
create policy "Users can view own activities"
  on public.activities
  for select
  using (auth.uid() = user_id);

-- Users can only insert activities with their own user_id
create policy "Users can insert own activities"
  on public.activities
  for insert
  with check (auth.uid() = user_id);

-- Users can only update their own activities
create policy "Users can update own activities"
  on public.activities
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can only delete their own activities
create policy "Users can delete own activities"
  on public.activities
  for delete
  using (auth.uid() = user_id);

-- ====================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER
-- ====================================================================

create or replace function public.handle_new_user()
returns trigger as $$
declare
  raw_name text;
  avatar text;
begin
  raw_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
  avatar := upper(substring(raw_name from 1 for 2));

  insert into public.profiles (id, email, full_name, username, avatar_text)
  values (
    new.id,
    new.email,
    raw_name,
    lower(replace(raw_name, ' ', '_')) || '_' || substring(new.id::text from 1 for 4),
    avatar
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to execute on user signup in auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
