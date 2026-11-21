# Database Documentation — Supabase / PostgreSQL

## 1. Schema Entities & Tables
- **`profiles`:** User profile information (`id UUID REFERENCES auth.users`, `full_name`, `handle`, `avatar_text`, `city`, `weekly_distance_goal_km`).
- **`activities`:** Recorded workouts (`id UUID PRIMARY KEY`, `user_id UUID REFERENCES auth.users`, `title`, `type` [run/ride/walk], `distance_km`, `duration_seconds`, `elevation_meters`, `floors_climbed`, `calories`, `visibility` [public/followers/private], `created_at`).
- **`activity_points`:** Raw GPS breadcrumbs (`id UUID`, `activity_id UUID REFERENCES activities ON DELETE CASCADE`, `latitude`, `longitude`, `altitude`, `speed`, `timestamp`).
- **`follows`:** Social graph (`follower_id UUID`, `following_id UUID`).
- **`kudos`:** Workout likes (`user_id UUID`, `activity_id UUID`).
- **`comments`:** Discussion threads (`id UUID`, `activity_id UUID`, `user_id UUID`, `comment_text`).

## 2. Row Level Security (RLS) Rules
- `profiles`: All authenticated users can read public profiles; only profile owner can update (`auth.uid() = id`).
- `activities`: Owners can CRUD their own activities (`auth.uid() = user_id`). Non-owners can only read if `visibility = 'public'` or follower relationship exists.
- `activity_points`: Inherits visibility from parent activity; only creator can insert points.

## 3. Migration Strategy
Migrations live in `supabase/migrations/` as timestamped idempotent SQL scripts.
Executed automatically via Supabase CLI or cloud deployment pipeline.
