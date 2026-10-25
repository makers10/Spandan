-- ====================================================================
-- Track your movement High-Performance Fitness & Social Tracking Schema
-- Production Hybrid Architecture: PostgreSQL + JSONB + PostGIS (SRID 4326)
--
-- Replaces row-by-row 'activity_points' table bloat with:
--   1. gps_telemetry JSONB: Raw compressed time-series sensor array
--   2. route_path geometry(LineString, 4326): PostGIS spatial column
-- ====================================================================

-- 1. Enable required PostgreSQL extensions
create extension if not exists "postgis";
create extension if not exists "pgcrypto";

-- 2. Cleanly retire and drop deprecated high-bloat activity_points table if present
drop table if exists public.activity_points cascade;

-- ====================================================================
-- ENTITY 1: PROFILES (Athlete Identity & Metric Goals)
-- ====================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  username text unique,
  avatar_text text,
  bio text default 'Track your movement Athlete. Tracking the athletic pulse.',
  city text default 'Athlete City',
  weekly_distance_goal_km numeric(6, 2) default 50.0 check (weekly_distance_goal_km >= 0),
  unit_preference text default 'metric' check (unit_preference in ('metric', 'imperial')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ====================================================================
-- ENTITY 2: ACTIVITIES (Workouts with Hybrid JSONB + PostGIS Route)
-- ====================================================================
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
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
  
  -- HYBRID STORAGE LAYER:
  -- A. Raw compressed time-series telemetry array: [{ lat, lng, alt, acc, spd, t }]
  gps_telemetry jsonb not null default '[]'::jsonb,
  -- B. Auto-computed PostGIS 2D LineString for geospatial analysis & proximity queries
  route_path geometry(LineString, 4326),

  created_at timestamptz default now() not null
);

-- ====================================================================
-- ENTITY 3: FOLLOWS (Athlete Social Graph)
-- ====================================================================
create table if not exists public.follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id != following_id)
);

-- ====================================================================
-- ENTITY 4: ACTIVITY_KUDOS (Social Affirmations / Likes)
-- ====================================================================
create table if not exists public.activity_kudos (
  activity_id uuid not null references public.activities(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (activity_id, user_id)
);

-- ====================================================================
-- ENTITY 5: ACTIVITY_COMMENTS (Interactive Workout Discussions)
-- ====================================================================
create table if not exists public.activity_comments (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  comment_text text not null check (length(trim(comment_text)) > 0 and length(comment_text) <= 500),
  created_at timestamptz not null default now()
);

-- ====================================================================
-- ENTITY 6: USER_BLOCKS (Athlete Privacy, Safety & Harassment Shield)
-- ====================================================================
create table if not exists public.user_blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id != blocked_id)
);

-- ====================================================================
-- AUTOMATED POSTGIS ROUTE GENERATION TRIGGER
-- Derives geometry(LineString, 4326) directly from gps_telemetry JSONB
-- ====================================================================

create or replace function public.generate_route_path_from_telemetry()
returns trigger as $$
declare
  point_count integer;
  new_geom geometry;
begin
  -- If telemetry is empty or not a valid JSON array, clear route_path
  if NEW.gps_telemetry is null or jsonb_typeof(NEW.gps_telemetry) <> 'array' then
    NEW.route_path := null;
    return NEW;
  end if;

  point_count := jsonb_array_length(NEW.gps_telemetry);

  -- A valid 2D LineString requires at least 2 distinct coordinate points
  if point_count < 2 then
    NEW.route_path := null;
    return NEW;
  end if;

  -- Build PostGIS LineString with SRID 4326 from JSONB elements
  -- ST_MakePoint requires (longitude, latitude) -> Longitude is X, Latitude is Y
  -- Flexibly parses both compressed keys ('lat', 'lng'/'lon') and full keys ('latitude', 'longitude')
  select ST_SetSRID(ST_MakeLine(pts.geom), 4326)
  into new_geom
  from (
    select ST_MakePoint(
      coalesce(
        (elem->>'lng')::double precision,
        (elem->>'lon')::double precision,
        (elem->>'longitude')::double precision
      ),
      coalesce(
        (elem->>'lat')::double precision,
        (elem->>'latitude')::double precision
      )
    ) as geom
    from jsonb_array_elements(NEW.gps_telemetry) with ordinality as arr(elem, idx)
    where (
      (elem ? 'lat' or elem ? 'latitude') and
      (elem ? 'lng' or elem ? 'lon' or elem ? 'longitude') and
      coalesce((elem->>'lat'), (elem->>'latitude')) is not null and
      coalesce((elem->>'lng'), (elem->>'lon'), (elem->>'longitude')) is not null and
      coalesce((elem->>'lat'), (elem->>'latitude')) ~ '^-?[0-9]+(\.[0-9]+)?$' and
      coalesce((elem->>'lng'), (elem->>'lon'), (elem->>'longitude')) ~ '^-?[0-9]+(\.[0-9]+)?$' and
      coalesce((elem->>'lat')::double precision, (elem->>'latitude')::double precision) between -90 and 90 and
      coalesce((elem->>'lng')::double precision, (elem->>'lon')::double precision, (elem->>'longitude')::double precision) between -180 and 180
    )
    order by idx
  ) pts;

  -- Validate geometry vertex count
  if new_geom is not null and ST_NPoints(new_geom) >= 2 then
    NEW.route_path := new_geom;
  else
    NEW.route_path := null;
  end if;

  return NEW;
exception
  when others then
    -- Fail safe: preserve activity insert even if telemetry has corrupted coordinates
    NEW.route_path := null;
    return NEW;
end;
$$ language plpgsql;

drop trigger if exists trg_generate_route_path on public.activities;
create trigger trg_generate_route_path
  before insert or update of gps_telemetry on public.activities
  for each row
  execute function public.generate_route_path_from_telemetry();

-- ====================================================================
-- PERFORMANCE INDEXING (Spatial GiST, JSONB GIN, and Relational B-Trees)
-- ====================================================================

-- 1. Spatial GiST Index on PostGIS route_path (Ultra-fast spatial bounding, ST_DWithin & proximity queries)
create index if not exists idx_activities_route_path on public.activities using gist (route_path);

-- 2. GIN Index on gps_telemetry JSONB (Enables fast internal telemetry element matching)
create index if not exists idx_activities_gps_telemetry on public.activities using gin (gps_telemetry);

-- 3. Core Relational B-Tree Indexes
create index if not exists idx_activities_user_id on public.activities(user_id);
create index if not exists idx_activities_created_at on public.activities(created_at desc);
create index if not exists idx_activities_type on public.activities(type);
create index if not exists idx_activities_visibility on public.activities(visibility);

create index if not exists idx_follows_follower on public.follows(follower_id);
create index if not exists idx_follows_following on public.follows(following_id);

create index if not exists idx_activity_kudos_activity on public.activity_kudos(activity_id);
create index if not exists idx_activity_kudos_user on public.activity_kudos(user_id);

create index if not exists idx_activity_comments_activity on public.activity_comments(activity_id, created_at asc);
create index if not exists idx_activity_comments_user on public.activity_comments(user_id);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

alter table public.profiles enable row level security;
alter table public.activities enable row level security;
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

-- ACTIVITIES POLICIES (Enforces Public, Followers-Only, and Private with Block Safeguards)
create policy "Users can view authorized activities"
  on public.activities
  for select
  using (
    -- 1. Activity owner can always view own workouts
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
-- ENTITY 7: CHALLENGES (Community & Private Fitness Challenges)
-- ====================================================================
create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (length(trim(title)) > 0 and length(title) <= 120),
  description text,
  sport_type text not null check (sport_type in ('run', 'ride', 'walk', 'all')),
  target_distance_km numeric(8, 2) not null check (target_distance_km > 0),
  start_date timestamptz not null,
  end_date timestamptz not null check (end_date > start_date),
  is_private boolean not null default false,
  invite_code text unique,
  created_at timestamptz default now() not null
);

-- ====================================================================
-- ENTITY 8: CHALLENGE_PARTICIPANTS (Athlete Challenge Progress)
-- ====================================================================
create table if not exists public.challenge_participants (
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz default now() not null,
  current_distance_km numeric(8, 2) not null default 0.0 check (current_distance_km >= 0),
  completed boolean not null default false,
  completed_at timestamptz,
  primary key (challenge_id, user_id)
);

create index if not exists idx_challenges_creator on public.challenges(creator_id);
create index if not exists idx_challenges_dates on public.challenges(start_date, end_date);
create index if not exists idx_challenge_participants_user on public.challenge_participants(user_id);

alter table public.challenges enable row level security;
alter table public.challenge_participants enable row level security;

-- CHALLENGES POLICIES
create policy "Users can view authorized challenges"
  on public.challenges
  for select
  using (
    -- Public challenges are visible to non-blocked users
    (not is_private and not exists (
      select 1 from public.user_blocks
      where blocker_id = challenges.creator_id and blocked_id = auth.uid()
    ))
    -- Private challenges only visible to creator or joined participants
    or (creator_id = auth.uid())
    or (is_private and exists (
      select 1 from public.challenge_participants
      where challenge_id = challenges.id and user_id = auth.uid()
    ))
  );

create policy "Users can create challenges"
  on public.challenges
  for insert
  with check (auth.uid() = creator_id);

create policy "Creators can update challenges"
  on public.challenges
  for update
  using (auth.uid() = creator_id)
  with check (auth.uid() = creator_id);

create policy "Creators can delete challenges"
  on public.challenges
  for delete
  using (auth.uid() = creator_id);

-- CHALLENGE_PARTICIPANTS POLICIES
create policy "Users can view challenge participants on authorized challenges"
  on public.challenge_participants
  for select
  using (
    exists (
      select 1 from public.challenges c
      where c.id = challenge_participants.challenge_id
      and (
        not c.is_private
        or c.creator_id = auth.uid()
        or exists (
          select 1 from public.challenge_participants cp
          where cp.challenge_id = c.id and cp.user_id = auth.uid()
        )
      )
    )
  );

create policy "Users can join challenges"
  on public.challenge_participants
  for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.challenges c
      where c.id = challenge_participants.challenge_id
      and (
        not c.is_private
        or c.creator_id = auth.uid()
        or c.invite_code is not null
      )
    )
  );

create policy "Users can update own challenge progress"
  on public.challenge_participants
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can leave challenges"
  on public.challenge_participants
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
    lower(regexp_replace(raw_name, '[^a-zA-Z0-9]', '_', 'g')) || '_' || substring(replace(new.id::text, '-', '') from 1 for 6),
    avatar
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
