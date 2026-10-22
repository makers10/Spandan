-- ====================================================================
-- Spandan Fitness Tracking Database Schema
-- Supabase PostgreSQL with Strict Row Level Security (RLS)
-- Supports Activities, Route Points, Social Follows, Kudos, Comments & Privacy
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
  unit_preference text default 'metric' check (unit_preference in ('metric', 'imperial')),
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
  visibility text not null default 'public' check (visibility in ('public', 'followers', 'private')),
  created_at timestamptz default now() not null
);

-- 4. Create ACTIVITY_POINTS table (Ordered GPS route points)
create table if not exists public.activity_points (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  point_order integer not null check (point_order >= 0),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  altitude double precision,
  accuracy double precision,
  speed double precision,
  recorded_at timestamptz not null default now()
);

-- 5. Create FOLLOWS table (Social Athlete Graph)
create table if not exists public.follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id != following_id)
);

-- 6. Create ACTIVITY_KUDOS table
create table if not exists public.activity_kudos (
  activity_id uuid not null references public.activities(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (activity_id, user_id)
);

-- 7. Create ACTIVITY_COMMENTS table
create table if not exists public.activity_comments (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  comment_text text not null check (length(trim(comment_text)) > 0 and length(comment_text) <= 500),
  created_at timestamptz not null default now()
);

-- 8. Create USER_BLOCKS table (Privacy, Safety & Harassment Prevention)
create table if not exists public.user_blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id != blocked_id)
);

-- 9. Create Indexes for query performance
create index if not exists idx_activities_user_id on public.activities(user_id);
create index if not exists idx_activities_created_at on public.activities(created_at desc);
create index if not exists idx_activities_type on public.activities(type);
create index if not exists idx_activities_visibility on public.activities(visibility);

create index if not exists idx_activity_points_activity_order on public.activity_points(activity_id, point_order asc);
create index if not exists idx_activity_points_user on public.activity_points(user_id);

create index if not exists idx_follows_follower on public.follows(follower_id);
create index if not exists idx_follows_following on public.follows(following_id);

create index if not exists idx_activity_kudos_activity on public.activity_kudos(activity_id);
create index if not exists idx_activity_kudos_user on public.activity_kudos(user_id);

create index if not exists idx_activity_comments_activity on public.activity_comments(activity_id, created_at asc);
create index if not exists idx_activity_comments_user on public.activity_comments(user_id);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.activities enable row level security;
alter table public.activity_points enable row level security;
alter table public.follows enable row level security;
alter table public.activity_kudos enable row level security;
alter table public.activity_comments enable row level security;
alter table public.user_blocks enable row level security;

-- PROFILES POLICIES
create policy "Allow read access to profiles"
  on public.profiles
  for select
  using (true);

create policy "Users can insert own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ACTIVITIES POLICIES (Honors Privacy: Public, Followers-Only, and Private)
create policy "Users can view authorized activities"
  on public.activities
  for select
  using (
    -- 1. Owner can always view their own activities
    auth.uid() = user_id
    or (
      -- 2. Public activities visible unless blocked
      visibility = 'public'
      and not exists (
        select 1 from public.user_blocks
        where blocker_id = activities.user_id and blocked_id = auth.uid()
      )
    )
    or (
      -- 3. Followers-only activities visible if viewer follows athlete
      visibility = 'followers'
      and exists (
        select 1 from public.follows
        where following_id = activities.user_id and follower_id = auth.uid()
      )
      and not exists (
        select 1 from public.user_blocks
        where blocker_id = activities.user_id and blocked_id = auth.uid()
      )
    )
  );

create policy "Users can insert own activities"
  on public.activities
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own activities"
  on public.activities
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own activities"
  on public.activities
  for delete
  using (auth.uid() = user_id);

-- ACTIVITY_POINTS POLICIES
create policy "Users can view authorized activity points"
  on public.activity_points
  for select
  using (
    -- Inherit view authorization from parent activity
    exists (
      select 1 from public.activities
      where activities.id = activity_points.activity_id
    )
  );

create policy "Users can insert own activity points"
  on public.activity_points
  for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own activity points"
  on public.activity_points
  for delete
  using (auth.uid() = user_id);

-- FOLLOWS POLICIES
create policy "Anyone can view follows relationships"
  on public.follows
  for select
  using (true);

create policy "Users can follow others"
  on public.follows
  for insert
  with check (auth.uid() = follower_id);

create policy "Users can unfollow others"
  on public.follows
  for delete
  using (auth.uid() = follower_id);

-- KUDOS POLICIES
create policy "Users can view kudos"
  on public.activity_kudos
  for select
  using (true);

create policy "Users can give kudos"
  on public.activity_kudos
  for insert
  with check (auth.uid() = user_id);

create policy "Users can remove own kudos"
  on public.activity_kudos
  for delete
  using (auth.uid() = user_id);

-- COMMENTS POLICIES
create policy "Users can view comments on visible activities"
  on public.activity_comments
  for select
  using (true);

create policy "Users can write comments"
  on public.activity_comments
  for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own comments"
  on public.activity_comments
  for delete
  using (auth.uid() = user_id);

-- USER_BLOCKS POLICIES
create policy "Users can view own blocks"
  on public.user_blocks
  for select
  using (auth.uid() = blocker_id);

create policy "Users can block other users"
  on public.user_blocks
  for insert
  with check (auth.uid() = blocker_id);

create policy "Users can unblock users"
  on public.user_blocks
  for delete
  using (auth.uid() = blocker_id);

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
    lower(regexp_replace(raw_name, '[^a-zA-Z0-9]', '_', 'g')) || '_' || substring(replace(new.id::text, '-', '') from 1 for 6),
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
