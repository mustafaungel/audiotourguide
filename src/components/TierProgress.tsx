import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { TierBadge } from './TierBadge';
import { useCreatorTier } from '@/hooks/useCreatorTier';
import { useAuth } from '@/contexts/AuthContext';
import { RefreshCw, TrendingUp, Target } from 'lucide-react';

interface TierProgressProps {
  userProfile?: any;
  showUpdateButton?: boolean;
}

export const TierProgress: React.FC<TierProgressProps> = ({ 
  userProfile, 
  showUpdateButton = false 
}) => {
  const { user } = useAuth();
  const { 
    getTierInfo, 
    getNextTierRequirements, 
    calculateTierPoints,
    updateCreatorTier,
    isLoading 
  } = useCreatorTier();

  const [currentTierInfo, setCurrentTierInfo] = useState<any>(null);
  const [nextTierInfo, setNextTierInfo] = useState<any>(null);
  const [currentPoints, setCurrentPoints] = useState(0);
  const [progressPercentage, setProgressPercentage] = useState(0);

  useEffect(() => {
    if (userProfile && user) {
      loadTierData();
    }
  }, [userProfile, user]);

  const loadTierData = async () => {
    if (!user?.id || !userProfile) return;

    try {
      // Get current tier info
      const tierInfo = await getTierInfo(userProfile.current_tier || 'bronze');
      setCurrentTierInfo(tierInfo);

      // Calculate current points
      const points = await calculateTierPoints(user.id);
      setCurrentPoints(points);

      // Get next tier requirements
      const { nextTier, pointsNeeded } = await getNextTierRequirements(
        userProfile.current_tier || 'bronze'
      );
      setNextTierInfo({ nextTier, pointsNeeded });

      // Calculate progress percentage
      if (nextTier && tierInfo) {
        const progressToNext = points - tierInfo.required_points;
        const totalNeeded = nextTier.required_points - tierInfo.required_points;
        const percentage = Math.min((progressToNext / totalNeeded) * 100, 100);
        setProgressPercentage(Math.max(percentage, 0));
      } else {
        setProgressPercentage(100); // Max tier reached
      }
    } catch (error) {
      console.error('Error loading tier data:', error);
    }
  };

  const handleTierUpdate = async () => {
    if (!user?.id) return;
    await updateCreatorTier(user.id);
    await loadTierData(); // Refresh data after update
  };

  if (!userProfile || !currentTierInfo) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-muted-foreground">Loading tier information...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Creator Tier Progress
          </div>
          {showUpdateButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleTierUpdate}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Update Tier
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Tier */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Current Tier</div>
            <TierBadge tier={userProfile.current_tier || 'bronze'} size="lg" />
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Points</div>
            <div className="text-2xl font-bold text-primary">{currentPoints}</div>
          </div>
        </div>

        {/* Progress to Next Tier */}
        {nextTierInfo?.nextTier ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Progress to {nextTierInfo.nextTier.tier_name}
                </span>
              </div>
              <TierBadge tier={nextTierInfo.nextTier.tier_name} size="sm" />
            </div>
            
            <Progress value={progressPercentage} className="h-2" />
            
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{currentPoints} points</span>
              <span>{nextTierInfo.pointsNeeded} points needed</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="text-lg font-semibold text-primary mb-2">
              🎉 Maximum Tier Achieved!
            </div>
            <div className="text-sm text-muted-foreground">
              You've reached the highest tier level
            </div>
          </div>
        )}

        {/* Current Tier Benefits */}
        <div>
          <div className="text-sm font-medium mb-2">Current Benefits</div>
          <div className="grid gap-1">
            {currentTierInfo.benefits?.map((benefit: string, index: number) => (
              <div key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                {benefit}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};