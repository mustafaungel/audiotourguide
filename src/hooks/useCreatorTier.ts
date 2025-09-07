import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CreatorTier {
  tier_name: string;
  tier_level: number;
  required_points: number;
  tier_color: string;
  tier_description: string;
  benefits: any; // JSON field from database
}

interface TierHistory {
  id: string;
  previous_tier: string | null;
  new_tier: string;
  points_earned: number;
  reason: string;
  created_at: string;
}

export const useCreatorTier = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const getTierInfo = useCallback(async (tierName: string): Promise<CreatorTier | null> => {
    try {
      const { data, error } = await supabase
        .from('creator_tiers')
        .select('*')
        .eq('tier_name', tierName)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching tier info:', error);
      return null;
    }
  }, []);

  const getAllTiers = useCallback(async (): Promise<CreatorTier[]> => {
    try {
      const { data, error } = await supabase
        .from('creator_tiers')
        .select('*')
        .order('tier_level', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all tiers:', error);
      return [];
    }
  }, []);

  const updateCreatorTier = useCallback(async (userId: string) => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .rpc('update_creator_tier', { creator_user_id: userId });

      if (error) throw error;

      toast({
        title: "Tier Updated",
        description: `Your tier has been updated to ${data}`,
      });

      return data;
    } catch (error: any) {
      console.error('Error updating tier:', error);
      toast({
        title: "Update Failed",
        description: "Unable to update tier at the moment",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const calculateTierPoints = useCallback(async (userId: string): Promise<number> => {
    try {
      const { data, error } = await supabase
        .rpc('calculate_tier_points', { creator_user_id: userId });

      if (error) throw error;
      return data || 0;
    } catch (error) {
      console.error('Error calculating tier points:', error);
      return 0;
    }
  }, []);

  const getTierHistory = useCallback(async (userId: string): Promise<TierHistory[]> => {
    try {
      const { data, error } = await supabase
        .from('tier_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching tier history:', error);
      return [];
    }
  }, []);

  const getNextTierRequirements = useCallback(async (currentTier: string): Promise<{ nextTier: CreatorTier | null; pointsNeeded: number }> => {
    try {
      const allTiers = await getAllTiers();
      const currentTierData = allTiers.find(t => t.tier_name === currentTier);
      
      if (!currentTierData) {
        return { nextTier: null, pointsNeeded: 0 };
      }

      const nextTier = allTiers.find(t => t.tier_level === currentTierData.tier_level + 1);
      
      if (!nextTier) {
        return { nextTier: null, pointsNeeded: 0 };
      }

      const pointsNeeded = nextTier.required_points;
      return { nextTier, pointsNeeded };
    } catch (error) {
      console.error('Error getting next tier requirements:', error);
      return { nextTier: null, pointsNeeded: 0 };
    }
  }, [getAllTiers]);

  return {
    getTierInfo,
    getAllTiers,
    updateCreatorTier,
    calculateTierPoints,
    getTierHistory,
    getNextTierRequirements,
    isLoading
  };
};