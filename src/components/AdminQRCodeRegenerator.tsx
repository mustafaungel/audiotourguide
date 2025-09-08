import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, ExternalLink, QrCode, Copy } from "lucide-react";

interface Guide {
  id: string;
  title: string;
  qr_code_url: string | null;
  share_url: string | null;
  price_usd: number;
}

export function AdminQRCodeRegenerator() {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const [loadingGuides, setLoadingGuides] = useState(false);
  const { toast } = useToast();

  const loadGuides = async () => {
    setLoadingGuides(true);
    try {
      const { data, error } = await supabase
        .from('audio_guides')
        .select('id, title, qr_code_url, share_url, price_usd')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGuides(data || []);
    } catch (error) {
      console.error('Error loading guides:', error);
      toast({
        title: "Error",
        description: "Failed to load guides",
        variant: "destructive",
      });
    } finally {
      setLoadingGuides(false);
    }
  };

  const regenerateQRCode = async (guideId: string) => {
    setRegenerating(guideId);
    try {
      const { data, error } = await supabase.functions.invoke('generate-qr-code', {
        body: { guideId }
      });

      if (error) throw error;

      // Refresh the guide data
      await loadGuides();

      toast({
        title: "Success",
        description: `QR code regenerated successfully! URL: ${data?.share_url}`,
      });
    } catch (error) {
      console.error('Error regenerating QR code:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to regenerate QR code",
        variant: "destructive",
      });
    } finally {
      setRegenerating(null);
    }
  };

  const regenerateAllQRCodes = async () => {
    setLoading(true);
    try {
      const guidesWithoutQR = guides.filter(guide => !guide.qr_code_url);
      
      for (const guide of guidesWithoutQR) {
        setRegenerating(guide.id);
        await regenerateQRCode(guide.id);
        // Add a small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      toast({
        title: "Success",
        description: `Regenerated QR codes for ${guidesWithoutQR.length} guides`,
      });
    } catch (error) {
      console.error('Error regenerating all QR codes:', error);
      toast({
        title: "Error",
        description: "Failed to regenerate all QR codes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRegenerating(null);
    }
  };

  const openGuidePreview = (guideId: string) => {
    const url = `${window.location.origin}/guide/${guideId}`;
    window.open(url, '_blank');
  };

  React.useEffect(() => {
    loadGuides();
  }, []);

  const guidesWithoutQR = guides.filter(guide => !guide.qr_code_url);
  const guidesWithQR = guides.filter(guide => guide.qr_code_url);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          QR Code Management
        </CardTitle>
        <CardDescription>
          Regenerate QR codes and share links for audio guides with the correct domain
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 mb-4">
          <Button 
            onClick={loadGuides} 
            variant="outline" 
            disabled={loadingGuides}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loadingGuides ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {guidesWithoutQR.length > 0 && (
            <Button 
              onClick={regenerateAllQRCodes} 
              disabled={loading}
            >
              <QrCode className="h-4 w-4 mr-2" />
              Regenerate All Missing QR Codes ({guidesWithoutQR.length})
            </Button>
          )}
        </div>

        <div className="grid gap-2">
          <div className="text-sm text-muted-foreground mb-2">
            Total guides: {guides.length} | With QR codes: {guidesWithQR.length} | Missing QR codes: {guidesWithoutQR.length}
          </div>
          
          {guides.map((guide) => (
            <div 
              key={guide.id} 
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex-1">
                <div className="font-medium">{guide.title}</div>
                <div className="text-sm text-muted-foreground">{guide.id}</div>
                {guide.share_url && (
                  <div className="text-xs text-blue-600 mt-1 break-all">
                    Share URL: {guide.share_url}
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  Price: ${(guide.price_usd / 100).toFixed(2)}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {guide.qr_code_url ? (
                  <Badge variant="secondary">QR Code Ready</Badge>
                ) : (
                  <Badge variant="destructive">Missing QR Code</Badge>
                )}
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openGuidePreview(guide.id)}
                  title="Preview guide"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                
                {guide.share_url && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(guide.share_url!);
                      toast({
                        title: "Success",
                        description: "Share URL copied to clipboard",
                      });
                    }}
                    title="Copy share URL"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
                
                <Button
                  size="sm"
                  onClick={() => regenerateQRCode(guide.id)}
                  disabled={regenerating === guide.id}
                >
                  {regenerating === guide.id ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <QrCode className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {guides.length === 0 && !loadingGuides && (
          <div className="text-center text-muted-foreground py-8">
            No guides found
          </div>
        )}
      </CardContent>
    </Card>
  );
}