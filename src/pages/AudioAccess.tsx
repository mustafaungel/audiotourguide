import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { AudioPlayer } from "@/components/AudioPlayer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MapPin, Clock, Download, ChevronLeft, Lock, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export default function AudioAccess() {
  const { guideId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [guide, setGuide] = useState<any>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessGranted, setAccessGranted] = useState(false);

  const accessCode = searchParams.get('access_code') || searchParams.get('access');

  useEffect(() => {
    if (!guideId) {
      setError('Guide ID is required');
      setIsLoading(false);
      return;
    }

    if (!accessCode) {
      setError('Access code is required');
      setIsLoading(false);
      return;
    }

    verifyAccessAndLoadGuide();
  }, [guideId, accessCode, user]);

  const verifyAccessAndLoadGuide = async () => {
    if (!guideId || !accessCode) return;

    setIsLoading(true);
    setError(null);

    try {
      // First verify access with the access code
      const { data: purchaseData, error: purchaseError } = await supabase
        .from('user_purchases')
        .select('id, user_id, guide_id, access_code')
        .eq('guide_id', guideId)
        .eq('access_code', accessCode)
        .maybeSingle();

      if (purchaseError || !purchaseData) {
        setError('Invalid access code or guide not found');
        setIsLoading(false);
        return;
      }

      // Access verified, now load guide details
      const { data: guideData, error: guideError } = await supabase
        .from('audio_guides')
        .select('*')
        .eq('id', guideId)
        .maybeSingle();

      if (guideError || !guideData) {
        setError('Guide not found');
        setIsLoading(false);
        return;
      }

      // Get creator profile separately
      const { data: creatorProfile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, bio')
        .eq('user_id', guideData.creator_id)
        .maybeSingle();

      // Transform guide data
      const transformedGuide = {
        ...guideData,
        creator: creatorProfile ? {
          name: creatorProfile.full_name || 'Anonymous Creator',
          avatar: creatorProfile.avatar_url || '',
          bio: creatorProfile.bio || ''
        } : {
          name: 'Anonymous Creator',
          avatar: '',
          bio: ''
        },
        sections: guideData.sections ? 
          (typeof guideData.sections === 'string' ? JSON.parse(guideData.sections) : guideData.sections) 
          : []
      };

      setGuide(transformedGuide);
      setHasAccess(true);
      setAccessGranted(true);

      toast({
        title: "Access Verified",
        description: "You can now listen to this audio guide",
      });

    } catch (error) {
      console.error('Error verifying access:', error);
      setError('Failed to verify access. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!guide?.audio_url && !guide?.id) return;
    
    try {
      let audioUrl = guide.audio_url;
      
      if (!audioUrl) {
        // Try to get from storage bucket
        const { data } = supabase.storage
          .from('guide-audio')
          .getPublicUrl(`${guide.id}.mp3`);
        
        audioUrl = data?.publicUrl || `/tmp/${guide.id}.mp3`;
      }

      const response = await fetch(audioUrl);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${guide.title}.mp3`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Download Started",
        description: "Audio guide is being downloaded",
      });
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: "Download Failed",
        description: "Unable to download audio file",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Verifying access...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !hasAccess) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-6">
          <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate('/')}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <Lock className="w-8 h-8 text-destructive" />
              </div>
              <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
              <p className="text-muted-foreground mb-4">
                {error || "You don't have access to this audio guide."}
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => navigate('/search')}>
                  Browse Guides
                </Button>
                <Button variant="outline" onClick={() => navigate('/')}>
                  Go Home
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-6">
        {/* Back Button */}
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate('/')}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <div className="max-w-4xl mx-auto">
          {/* Access Verified Header */}
          {accessGranted && (
            <Card className="mb-6 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-200">Access Verified</p>
                    <p className="text-sm text-green-600 dark:text-green-400">You have full access to this audio guide</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Guide Header */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Guide Image */}
                <div className="w-full md:w-48 h-48 rounded-lg overflow-hidden flex-shrink-0">
                  <img 
                    src={
                      guide.image_url?.startsWith('data:image') 
                        ? guide.image_url 
                        : guide.image_url || '/hero-audio-guide.jpg'
                    } 
                    alt={guide.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/hero-audio-guide.jpg';
                    }}
                  />
                </div>

                {/* Guide Info */}
                <div className="flex-1 space-y-4">
                  <div>
                    <Badge className="mb-2">{guide.category}</Badge>
                    <h1 className="text-2xl md:text-3xl font-bold">{guide.title}</h1>
                    <p className="text-muted-foreground mt-2">{guide.description}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {guide.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {Math.floor(guide.duration / 60)} min
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      {guide.rating || 0} ({guide.total_reviews || 0})
                    </div>
                  </div>

                  {/* Creator Info */}
                  <div className="flex items-center gap-3 pt-2">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={guide.creator.avatar} alt={guide.creator.name} />
                      <AvatarFallback>{guide.creator.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{guide.creator.name}</p>
                      <p className="text-sm text-muted-foreground">Guide Creator</p>
                    </div>
                  </div>

                  {/* Download Button */}
                  <div className="pt-2">
                    <Button onClick={handleDownload} variant="outline" className="w-full md:w-auto">
                      <Download className="w-4 h-4 mr-2" />
                      Download Audio
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Audio Player */}
          <div className="mb-6">
            <AudioPlayer
              title={guide.title}
              description={guide.description}
              audioSrc={guide.audio_url}
              guideId={guide.id}
              transcript={guide.transcript}
            />
          </div>

          {/* Guide Sections/Chapters */}
          {guide.sections && guide.sections.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Chapters</CardTitle>
                <CardDescription>Navigate through the guide sections</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {guide.sections.map((section: any, index: number) => (
                    <button 
                      key={index} 
                      onClick={() => {
                        // Find audio element and seek to timestamp if available
                        const audioElement = document.querySelector('audio');
                        if (audioElement && section.timestamp) {
                          audioElement.currentTime = section.timestamp;
                        }
                      }}
                      className="w-full flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1 text-left">
                          <h4 className="font-medium">{section.title}</h4>
                          {section.description && (
                            <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
                          )}
                        </div>
                      </div>
                      {section.duration_seconds && (
                        <div className="text-sm text-muted-foreground">
                          {Math.floor(section.duration_seconds / 60)}:{(section.duration_seconds % 60).toString().padStart(2, '0')}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}