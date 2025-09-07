import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useCreatorConnection = () => {
  const [connecting, setConnecting] = useState(false);
  const { toast } = useToast();

  const connectToCreator = useCallback(async (
    creatorId: string,
    source: 'purchase' | 'manual_follow' | 'recommendation' = 'manual_follow',
    guideId?: string
  ) => {
    try {
      setConnecting(true);

      const { data, error } = await supabase
        .from('creator_connections')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          creator_id: creatorId,
          connection_source: source,
          guide_id: guideId,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Connected!",
        description: "You're now connected to this creator",
      });

      return data;
    } catch (error: any) {
      console.error('Error connecting to creator:', error);
      
      // Handle unique constraint violation (already connected)
      if (error.code === '23505') {
        toast({
          title: "Already Connected",
          description: "You're already connected to this creator",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: "Unable to connect to creator at the moment",
          variant: "destructive",
        });
      }
    } finally {
      setConnecting(false);
    }
  }, [toast]);

  const disconnectFromCreator = useCallback(async (creatorId: string) => {
    try {
      setConnecting(true);

      const userId = (await supabase.auth.getUser()).data.user?.id;
      const { error } = await supabase
        .from('creator_connections')
        .update({ is_active: false })
        .eq('creator_id', creatorId)
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Disconnected",
        description: "You're no longer following this creator",
      });
    } catch (error) {
      console.error('Error disconnecting from creator:', error);
      toast({
        title: "Error",
        description: "Unable to unfollow creator at the moment",
        variant: "destructive",
      });
    } finally {
      setConnecting(false);
    }
  }, [toast]);

  const checkConnection = useCallback(async (creatorId: string) => {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      const { data, error } = await supabase
        .from('creator_connections')
        .select('id, is_active')
        .eq('creator_id', creatorId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      return data?.is_active || false;
    } catch (error) {
      console.error('Error checking connection:', error);
      return false;
    }
  }, []);

  const getConnectedCreators = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('creator_connections')
        .select(`
          creator_id,
          connected_at,
          connection_source,
          profiles!creator_connections_creator_id_fkey (
            user_id,
            full_name,
            avatar_url,
            bio,
            verification_status
          )
        `)
        .eq('is_active', true)
        .order('connected_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching connected creators:', error);
      return [];
    }
  }, []);

  return {
    connectToCreator,
    disconnectFromCreator,
    checkConnection,
    getConnectedCreators,
    connecting
  };
};