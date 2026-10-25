-- ====================================================================
-- TRACK YOUR MOVEMENT SAFE JMETER CLEANUP SCRIPT
-- TARGET: Load-test staging database
--
-- SAFETY CONTRACT:
-- This script contains STRICT WHERE-clauses that match ONLY load-test IDs
-- and load-test emails. It CANNOT touch any real athlete's data.
-- ====================================================================

BEGIN;

-- 1. Delete comments on test activities
DELETE FROM public.activity_comments
WHERE activity_id LIKE '00000000-a000-4000-%'
   OR user_id LIKE '00000000-0000-4000-a000-%';

-- 2. Delete kudos on test activities
DELETE FROM public.activity_kudos
WHERE activity_id LIKE '00000000-a000-4000-%'
   OR user_id LIKE '00000000-0000-4000-a000-%';

-- 3. Delete GPS route points for test activities
DELETE FROM public.activity_points
WHERE activity_id LIKE '00000000-a000-4000-%';

-- 4. Delete test activities
DELETE FROM public.activities
WHERE id LIKE '00000000-a000-4000-%'
   OR user_id LIKE '00000000-0000-4000-a000-%';

-- 5. Delete test follow relationships
DELETE FROM public.follows
WHERE follower_id LIKE '00000000-0000-4000-a000-%'
   OR following_id LIKE '00000000-0000-4000-a000-%';

-- 6. Delete test profiles
DELETE FROM public.profiles
WHERE id LIKE '00000000-0000-4000-a000-%';

COMMIT;

-- Verification query
SELECT count(*) AS remaining_load_test_profiles
FROM public.profiles
WHERE id LIKE '00000000-0000-4000-a000-%';
