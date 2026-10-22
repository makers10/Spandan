/**
 * Spandan Social & Community Service
 * Manages athlete follows, kudos, activity comments, profile updates, and privacy controls.
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { ActivityComment } from '@/data/mock-fitness-data';

export const socialService = {
  /**
   * Check if followerId is actively following followingId.
   */
  async isFollowingAthlete(followerId: string, followingId: string): Promise<boolean> {
    if (!isSupabaseConfigured() || !followerId || !followingId) return false;

    const { data, error } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .maybeSingle();

    if (error || !data) return false;
    return true;
  },

  /**
   * Follow an athlete.
   */
  async followAthlete(followerId: string, followingId: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    if (followerId === followingId) return false;

    const { error } = await supabase
      .from('follows')
      .insert({ follower_id: followerId, following_id: followingId });

    if (error && error.code !== '23505') {
      // 23505 = unique violation (already following)
      console.warn('Error following athlete:', error.message);
      return false;
    }
    return true;
  },

  /**
   * Unfollow an athlete.
   */
  async unfollowAthlete(followerId: string, followingId: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);

    if (error) {
      console.warn('Error unfollowing athlete:', error.message);
      return false;
    }
    return true;
  },

  /**
   * Get follower and following counts for a profile.
   */
  async getFollowCounts(userId: string): Promise<{ followers: number; following: number }> {
    if (!isSupabaseConfigured()) return { followers: 142, following: 89 };

    try {
      const [followersRes, followingRes] = await Promise.all([
        supabase
          .from('follows')
          .select('follower_id', { count: 'exact', head: true })
          .eq('following_id', userId),
        supabase
          .from('follows')
          .select('following_id', { count: 'exact', head: true })
          .eq('follower_id', userId),
      ]);

      return {
        followers: followersRes.count || 0,
        following: followingRes.count || 0,
      };
    } catch {
      return { followers: 0, following: 0 };
    }
  },

  /**
   * Give or remove kudos on an activity.
   */
  async toggleKudos(activityId: string, userId: string, nextState: boolean): Promise<boolean> {
    if (!isSupabaseConfigured()) return true;

    if (nextState) {
      const { error } = await supabase
        .from('activity_kudos')
        .insert({ activity_id: activityId, user_id: userId });

      if (error && error.code !== '23505') {
        console.warn('Error giving kudos:', error.message);
        return false;
      }
    } else {
      const { error } = await supabase
        .from('activity_kudos')
        .delete()
        .eq('activity_id', activityId)
        .eq('user_id', userId);

      if (error) {
        console.warn('Error removing kudos:', error.message);
        return false;
      }
    }
    return true;
  },

  /**
   * Fetch total kudos and check if currentUser has kudoed this activity.
   */
  async fetchActivityKudos(
    activityId: string,
    currentUserId?: string
  ): Promise<{ count: number; hasKudoed: boolean }> {
    if (!isSupabaseConfigured()) return { count: 12, hasKudoed: false };

    try {
      const countRes = await supabase
        .from('activity_kudos')
        .select('user_id', { count: 'exact', head: true })
        .eq('activity_id', activityId);

      let hasKudoed = false;
      if (currentUserId) {
        const userRes = await supabase
          .from('activity_kudos')
          .select('user_id')
          .eq('activity_id', activityId)
          .eq('user_id', currentUserId)
          .maybeSingle();

        hasKudoed = Boolean(userRes.data);
      }

      return {
        count: countRes.count || 0,
        hasKudoed,
      };
    } catch {
      return { count: 0, hasKudoed: false };
    }
  },

  /**
   * Fetch comments on an activity ordered chronologically.
   */
  async fetchActivityComments(activityId: string): Promise<ActivityComment[]> {
    if (!isSupabaseConfigured()) {
      return [
        {
          id: 'mock-c-1',
          activityId,
          userId: 'mock-user-1',
          userName: 'Priya Sharma',
          userAvatar: 'PS',
          commentText: 'Incredible split times on this route! Solid training run.',
          createdAtIso: new Date(Date.now() - 3600000).toISOString(),
          timeAgo: '1h ago',
        },
      ];
    }

    const { data, error } = await supabase
      .from('activity_comments')
      .select('*, profiles(full_name, avatar_text)')
      .eq('activity_id', activityId)
      .order('created_at', { ascending: true });

    if (error || !data) {
      console.warn('Error fetching comments:', error?.message);
      return [];
    }

    const now = new Date();
    return data.map((item) => {
      const created = new Date(item.created_at);
      const diffMins = Math.max(1, Math.round((now.getTime() - created.getTime()) / 60000));
      const timeAgo =
        diffMins < 60
          ? `${diffMins}m ago`
          : diffMins < 1440
          ? `${Math.floor(diffMins / 60)}h ago`
          : `${Math.floor(diffMins / 1440)}d ago`;

      const userName = item.profiles?.full_name || 'Athlete';
      const userAvatar = item.profiles?.avatar_text || userName.substring(0, 2).toUpperCase();

      return {
        id: item.id,
        activityId: item.activity_id,
        userId: item.user_id,
        userName,
        userAvatar,
        commentText: item.comment_text,
        createdAtIso: item.created_at,
        timeAgo,
      };
    });
  },

  /**
   * Post a new comment on an activity.
   */
  async addComment(
    activityId: string,
    userId: string,
    commentText: string
  ): Promise<ActivityComment> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured.');
    }

    const trimmed = commentText.trim();
    if (!trimmed) {
      throw new Error('Comment cannot be empty.');
    }
    if (trimmed.length > 500) {
      throw new Error('Comment exceeds 500 character limit.');
    }

    const { data, error } = await supabase
      .from('activity_comments')
      .insert({
        activity_id: activityId,
        user_id: userId,
        comment_text: trimmed,
      })
      .select('*, profiles(full_name, avatar_text)')
      .single();

    if (error) {
      console.error('Error posting comment:', error.message);
      throw error;
    }

    const userName = data.profiles?.full_name || 'You';
    const userAvatar = data.profiles?.avatar_text || 'ME';

    return {
      id: data.id,
      activityId: data.activity_id,
      userId: data.user_id,
      userName,
      userAvatar,
      commentText: data.comment_text,
      createdAtIso: data.created_at,
      timeAgo: 'Just now',
    };
  },

  /**
   * Delete a comment (ownership enforced by RLS).
   */
  async deleteComment(commentId: string, userId: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const { error } = await supabase
      .from('activity_comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', userId);

    if (error) {
      console.warn('Error deleting comment:', error.message);
      return false;
    }
    return true;
  },

  /**
   * Update athlete profile details.
   */
  async updateProfile(
    userId: string,
    updates: {
      fullName?: string;
      username?: string;
      bio?: string;
      city?: string;
      weeklyDistanceGoalKm?: number;
      unitPreference?: 'metric' | 'imperial';
      avatarText?: string;
    }
  ): Promise<boolean> {
    if (!isSupabaseConfigured()) return true;

    const payload: any = { updated_at: new Date().toISOString() };
    if (updates.fullName !== undefined) payload.full_name = updates.fullName.trim();
    if (updates.username !== undefined) {
      payload.username = updates.username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    }
    if (updates.bio !== undefined) payload.bio = updates.bio.trim();
    if (updates.city !== undefined) payload.city = updates.city.trim();
    if (updates.weeklyDistanceGoalKm !== undefined) {
      payload.weekly_distance_goal_km = Math.max(1, updates.weeklyDistanceGoalKm);
    }
    if (updates.unitPreference !== undefined) payload.unit_preference = updates.unitPreference;
    if (updates.avatarText !== undefined) payload.avatar_text = updates.avatarText.trim().toUpperCase();

    const { error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId);

    if (error) {
      console.error('Error updating athlete profile:', error.message);
      throw error;
    }
    return true;
  },

  /**
   * Search community athletes.
   */
  async searchAthletes(query: string = '', currentUserId?: string): Promise<any[]> {
    if (!isSupabaseConfigured()) {
      return [
        {
          id: 'ath-1',
          name: 'Priya Sharma',
          handle: '@priya_run',
          city: 'Bangalore, India',
          avatarText: 'PS',
          isFollowing: true,
        },
        {
          id: 'ath-2',
          name: 'Rohan Deshmukh',
          handle: '@rohan_cadence',
          city: 'Pune, India',
          avatarText: 'RD',
          isFollowing: false,
        },
        {
          id: 'ath-3',
          name: 'Ananya Roy',
          handle: '@ananya_endure',
          city: 'Kolkata, India',
          avatarText: 'AR',
          isFollowing: false,
        },
      ];
    }

    let req = supabase
      .from('profiles')
      .select('id, full_name, username, city, avatar_text, bio')
      .limit(20);

    if (query.trim()) {
      req = req.ilike('full_name', `%${query.trim()}%`);
    }

    const { data, error } = await req;
    if (error || !data) return [];

    return data
      .filter((p) => p.id !== currentUserId)
      .map((p) => ({
        id: p.id,
        name: p.full_name || 'Athlete',
        handle: `@${p.username || 'athlete'}`,
        city: p.city || 'India',
        avatarText: p.avatar_text || (p.full_name || 'AT').substring(0, 2).toUpperCase(),
        bio: p.bio,
      }));
  },

  /**
   * Block a user.
   */
  async blockUser(blockerId: string, blockedId: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return true;

    const { error } = await supabase
      .from('user_blocks')
      .insert({ blocker_id: blockerId, blocked_id: blockedId });

    if (error && error.code !== '23505') {
      console.warn('Error blocking user:', error.message);
      return false;
    }
    return true;
  },

  /**
   * Unblock a user.
   */
  async unblockUser(blockerId: string, blockedId: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return true;

    const { error } = await supabase
      .from('user_blocks')
      .delete()
      .eq('blocker_id', blockerId)
      .eq('blocked_id', blockedId);

    if (error) {
      console.warn('Error unblocking user:', error.message);
      return false;
    }
    return true;
  },
};
