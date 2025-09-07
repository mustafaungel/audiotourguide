import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useCreatorUpdates = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const createUpdate = useCallback(async (updateData: {
    update_type: 'post' | 'announcement' | 'guide_update';
    title?: string;
    content: string;
    image_url?: string;
    related_guide_id?: string;
    related_experience_id?: string;
    is_pinned?: boolean;
  }) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create updates.",
        variant: "destructive",
      });
      return null;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('creator_updates')
        .insert({
          creator_id: user.id,
          ...updateData,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Update created!",
        description: "Your update has been shared successfully.",
      });

      return data;
    } catch (error) {
      console.error('Error creating update:', error);
      toast({
        title: "Error creating update",
        description: "Please try again later.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  const updatePost = useCallback(async (updateId: string, updateData: {
    title?: string;
    content?: string;
    is_pinned?: boolean;
  }) => {
    if (!user) return null;

    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('creator_updates')
        .update(updateData)
        .eq('id', updateId)
        .eq('creator_id', user.id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Update saved!",
        description: "Your changes have been saved successfully.",
      });

      return data;
    } catch (error) {
      console.error('Error updating post:', error);
      toast({
        title: "Error saving changes",
        description: "Please try again later.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  const deleteUpdate = useCallback(async (updateId: string) => {
    if (!user) return false;

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('creator_updates')
        .delete()
        .eq('id', updateId)
        .eq('creator_id', user.id);

      if (error) throw error;

      toast({
        title: "Update deleted",
        description: "Your update has been removed successfully.",
      });

      return true;
    } catch (error) {
      console.error('Error deleting update:', error);
      toast({
        title: "Error deleting update",
        description: "Please try again later.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  const fetchUpdates = useCallback(async (creatorId?: string, limit: number = 20) => {
    try {
      const query = supabase
        .from('creator_updates')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (creatorId) {
        query.eq('creator_id', creatorId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching updates:', error);
      return [];
    }
  }, []);

  return {
    createUpdate,
    updatePost,
    deleteUpdate,
    fetchUpdates,
    isLoading,
  };
};