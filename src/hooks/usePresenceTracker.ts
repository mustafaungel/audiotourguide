import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Tracks real-time listeners for a guide using Supabase Presence.
 * Zero DB writes — purely WebSocket-based.
 * The user joins the channel on mount and leaves on unmount.
 */
export function usePresenceTracker(guideId: string | undefined): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!guideId) return;

    const channelName = `listeners:${guideId}`;
    const channel = supabase.channel(channelName);

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const total = Object.keys(state).reduce(
          (sum, key) => sum + state[key].length,
          0
        );
        setCount(total);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user: crypto.randomUUID(), joined_at: Date.now() });
        }
      });

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [guideId]);

  return count;
}
