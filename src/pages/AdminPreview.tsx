import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { supabase } from '@/integrations/supabase/client';
import { AudioGuideLoader } from '@/components/AudioGuideLoader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, ExternalLink, Monitor, Smartphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface GuideOption {
  id: string;
  title: string;
  location: string;
  is_published: boolean;
  is_approved: boolean;
  master_access_code: string | null;
  slug: string;
}

const AdminPreview = () => {
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const navigate = useNavigate();
  const [guides, setGuides] = useState<GuideOption[]>([]);
  const [selectedGuideId, setSelectedGuideId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [iframeView, setIframeView] = useState<'mobile' | 'desktop'>('mobile');

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/admin-login');
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    loadGuides();
  }, []);

  const loadGuides = async () => {
    const { data, error } = await supabase
      .from('audio_guides')
      .select('id, title, location, is_published, is_approved, master_access_code, slug')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setGuides(data);
    }
    setLoading(false);
  };

  const selectedGuide = guides.find(g => g.id === selectedGuideId);

  const previewUrl = selectedGuide?.master_access_code
    ? `/access/${selectedGuide.id}?access_code=${selectedGuide.master_access_code}`
    : null;

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <AudioGuideLoader variant="page" message="Loading preview..." />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <h1 className="text-2xl font-bold mb-2">Preview & Test</h1>
        <p className="text-muted-foreground text-sm mb-6">
          Test audio access pages before publishing — verify audio, languages, and linked guides.
        </p>

        {/* Guide Selector */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Select Guide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedGuideId} onValueChange={setSelectedGuideId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a guide to preview..." />
              </SelectTrigger>
              <SelectContent>
                {guides.map(guide => (
                  <SelectItem key={guide.id} value={guide.id}>
                    <div className="flex items-center gap-2">
                      <span>{guide.title}</span>
                      <span className="text-muted-foreground text-xs">— {guide.location}</span>
                      {!guide.is_published && (
                        <Badge variant="outline" className="text-[10px] px-1.5">Draft</Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedGuide && (
              <div className="flex flex-wrap gap-2 items-center">
                <Badge variant={selectedGuide.is_published ? 'default' : 'secondary'}>
                  {selectedGuide.is_published ? 'Published' : 'Draft'}
                </Badge>
                <Badge variant={selectedGuide.is_approved ? 'default' : 'secondary'}>
                  {selectedGuide.is_approved ? 'Approved' : 'Pending'}
                </Badge>
                {selectedGuide.master_access_code ? (
                  <div className="flex items-center gap-1 text-green-600 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Access code available</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-destructive text-xs">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>No access code</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview Area */}
        {previewUrl && (
          <div className="space-y-4">
            {/* Controls */}
            <div className="flex items-center gap-3">
              <Button
                variant={iframeView === 'mobile' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIframeView('mobile')}
              >
                <Smartphone className="w-4 h-4 mr-1.5" />
                Mobile
              </Button>
              <Button
                variant={iframeView === 'desktop' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIframeView('desktop')}
              >
                <Monitor className="w-4 h-4 mr-1.5" />
                Desktop
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(previewUrl, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-1.5" />
                Open in new tab
              </Button>
            </div>

            {/* Checklist */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Test Checklist</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-1.5">
                  {[
                    'Audio plays correctly for each chapter',
                    'Language switch loads translated sections',
                    'Linked guide tabs are visible and switch properly',
                    'Dark/light mode toggle works',
                    'Review form submits successfully',
                    'Back button navigates correctly',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-muted-foreground/50 mt-0.5">☐</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Iframe */}
            <div className="flex justify-center">
              <div
                className={`border rounded-2xl overflow-hidden shadow-lg bg-background transition-all duration-300 ${
                  iframeView === 'mobile' ? 'w-[390px] h-[844px]' : 'w-full h-[800px]'
                }`}
              >
                <iframe
                  src={previewUrl}
                  className="w-full h-full border-0"
                  title="Guide Preview"
                />
              </div>
            </div>
          </div>
        )}

        {selectedGuide && !previewUrl && (
          <Card className="border-destructive/50">
            <CardContent className="py-8 text-center">
              <XCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                This guide has no master access code. Generate one from the Edit Guide panel first.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminPreview;
