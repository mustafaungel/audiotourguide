import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  Star, 
  MapPin, 
  Share2, 
  Headphones, 
  Globe,
  Flame,
  Crown,
  Award,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
}

interface UserStats {
  level: number;
  totalPoints: number;
  guidesListened: number;
  placesVisited: number;
  sharesCount: number;
  streak: number;
  totalTimeListened: number;
}

export const ViralGamification: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userStats, setUserStats] = useState<UserStats>({
    level: 1,
    totalPoints: 150,
    guidesListened: 5,
    placesVisited: 3,
    sharesCount: 2,
    streak: 3,
    totalTimeListened: 240 // minutes
  });

  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: 'first-listen',
      title: 'First Explorer',
      description: 'Listen to your first audio guide',
      icon: <Headphones className="h-4 w-4" />,
      progress: 1,
      maxProgress: 1,
      unlocked: true,
      rarity: 'common',
      points: 10
    },
    {
      id: 'social-butterfly',
      title: 'Social Butterfly',
      description: 'Share 5 audio guides',
      icon: <Share2 className="h-4 w-4" />,
      progress: 2,
      maxProgress: 5,
      unlocked: false,
      rarity: 'rare',
      points: 50
    },
    {
      id: 'globe-trotter',
      title: 'Globe Trotter',
      description: 'Visit 10 different destinations',
      icon: <Globe className="h-4 w-4" />,
      progress: 3,
      maxProgress: 10,
      unlocked: false,
      rarity: 'epic',
      points: 100
    },
    {
      id: 'streak-master',
      title: 'Streak Master',
      description: 'Listen to guides for 7 days straight',
      icon: <Flame className="h-4 w-4" />,
      progress: 3,
      maxProgress: 7,
      unlocked: false,
      rarity: 'legendary',
      points: 200
    },
    {
      id: 'culture-enthusiast',
      title: 'Culture Enthusiast',
      description: 'Listen to 25 cultural guides',
      icon: <Award className="h-4 w-4" />,
      progress: 5,
      maxProgress: 25,
      unlocked: false,
      rarity: 'epic',
      points: 150
    }
  ]);

  const calculateLevel = (points: number) => {
    return Math.floor(points / 100) + 1;
  };

  const getProgressToNextLevel = (points: number) => {
    const currentLevelPoints = (calculateLevel(points) - 1) * 100;
    const nextLevelPoints = calculateLevel(points) * 100;
    return ((points - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) * 100;
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'rare': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'epic': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'legendary': return 'bg-gradient-tourism text-primary-foreground border-tourism-warm';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const shareAchievement = (achievement: Achievement) => {
    const shareText = `🏆 Just unlocked \"${achievement.title}\" on Audio Tour Guides! ${achievement.description} #TravelGoals #AudioTour`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Achievement Unlocked!',
        text: shareText,
        url: window.location.origin
      });
    } else {
      navigator.clipboard.writeText(shareText);
      toast({
        title: "Achievement copied to clipboard!",
        description: "Share your progress on social media to inspire others!"
      });
    }
  };

  const triggerLevelUp = () => {
    toast({
      title: "🎉 LEVEL UP!",
      description: `Congratulations! You've reached level ${userStats.level + 1}!`,
    });
    
    // Confetti effect or animation could be added here
    setUserStats(prev => ({ ...prev, level: prev.level + 1 }));
  };

  const getCurrentLevelTitle = (level: number) => {
    if (level >= 20) return "Master Explorer 🌟";
    if (level >= 15) return "Legendary Traveler 👑";
    if (level >= 10) return "Expert Guide 🏆";
    if (level >= 5) return "Seasoned Tourist 🗺️";
    return "Curious Wanderer 🌱";
  };

  useEffect(() => {
    // Simulate real-time updates for viral engagement
    const interval = setInterval(() => {
      // Randomly trigger notifications to keep users engaged
      if (Math.random() < 0.3) { // 30% chance every 30 seconds
        const messages = [
          "🔥 Someone just shared your favorite guide!",
          "🌟 A new trending destination is available!",
          "🚀 Your listening streak is impressive!",
          "💎 You're close to unlocking a rare achievement!"
        ];
        
        toast({
          title: messages[Math.floor(Math.random() * messages.length)],
          description: "Keep exploring to earn more rewards!"
        });
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [toast]);

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* User Level & Progress */}
      <Card className="bg-gradient-tourism border-tourism-warm/20 shadow-tourism">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-foreground/20 rounded-lg">
                <Crown className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-primary-foreground">
                  Level {userStats.level}
                </CardTitle>
                <p className="text-primary-foreground/80 text-sm">
                  {getCurrentLevelTitle(userStats.level)}
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground">
              {userStats.totalPoints} points
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-primary-foreground/80">
              <span>Progress to Level {userStats.level + 1}</span>
              <span>{userStats.totalPoints % 100}/100 XP</span>
            </div>
            <Progress 
              value={getProgressToNextLevel(userStats.totalPoints)} 
              className="h-2 bg-primary-foreground/20"
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center bg-gradient-card">
          <div className="flex flex-col items-center gap-2">
            <div className="p-2 bg-tourism-sky/10 rounded-lg">
              <Headphones className="h-5 w-5 text-tourism-sky" />
            </div>
            <div className="text-2xl font-bold text-foreground">{userStats.guidesListened}</div>
            <div className="text-sm text-muted-foreground">Guides Heard</div>
          </div>
        </Card>
        
        <Card className="p-4 text-center bg-gradient-card">
          <div className="flex flex-col items-center gap-2">
            <div className="p-2 bg-tourism-earth/10 rounded-lg">
              <MapPin className="h-5 w-5 text-tourism-earth" />
            </div>
            <div className="text-2xl font-bold text-foreground">{userStats.placesVisited}</div>
            <div className="text-sm text-muted-foreground">Places Visited</div>
          </div>
        </Card>
        
        <Card className="p-4 text-center bg-gradient-card">
          <div className="flex flex-col items-center gap-2">
            <div className="p-2 bg-tourism-warm/10 rounded-lg">
              <Flame className="h-5 w-5 text-tourism-warm" />
            </div>
            <div className="text-2xl font-bold text-foreground">{userStats.streak}</div>
            <div className="text-sm text-muted-foreground">Day Streak</div>
          </div>
        </Card>
        
        <Card className="p-4 text-center bg-gradient-card">
          <div className="flex flex-col items-center gap-2">
            <div className="p-2 bg-accent/10 rounded-lg">
              <Share2 className="h-5 w-5 text-accent" />
            </div>
            <div className="text-2xl font-bold text-foreground">{userStats.sharesCount}</div>
            <div className="text-sm text-muted-foreground">Shares</div>
          </div>
        </Card>
      </div>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-tourism-warm" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`p-4 rounded-lg border transition-all ${
                  achievement.unlocked 
                    ? 'bg-gradient-card border-tourism-warm/30 shadow-sm' 
                    : 'bg-muted/50 border-border'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded ${achievement.unlocked ? 'bg-tourism-warm/10' : 'bg-muted'}`}>
                      {achievement.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className={`font-medium ${achievement.unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {achievement.title}
                        </h4>
                        <Badge className={getRarityColor(achievement.rarity)}>
                          {achievement.rarity}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {achievement.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress 
                          value={(achievement.progress / achievement.maxProgress) * 100} 
                          className="h-1 flex-1"
                        />
                        <span className="text-xs text-muted-foreground">
                          {achievement.progress}/{achievement.maxProgress}
                        </span>
                      </div>
                    </div>
                  </div>
                  {achievement.unlocked && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => shareAchievement(achievement)}
                      className="border-tourism-warm/20 hover:bg-tourism-warm/10"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Daily Challenge */}
      <Card className="border-accent/20 bg-gradient-accent/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-accent" />
            Daily Challenge
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-foreground">Listen to 3 guides today</h4>
              <p className="text-sm text-muted-foreground">Earn 50 bonus points!</p>
              <Progress value={66} className="h-2 mt-2 w-48" />
              <span className="text-xs text-muted-foreground">2/3 completed</span>
            </div>
            <div className="text-accent font-bold text-lg">+50 XP</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
