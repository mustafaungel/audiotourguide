import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, ExternalLink, QrCode, Copy } from "lucide-react";
import { ButtonLoader } from '@/components/AudioGuideLoader';

interface Guide {
  id: string;
  title: string;
  slug?: string;
  qr_code_url: string | null;
  share_url: string | null;
  master_access_code: string | null;
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
        .select('id, title, slug, qr_code_url, share_url, master_access_code, price_usd')
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
      for (const guide of guides) {
        setRegenerating(guide.id);
        await regenerateQRCode(guide.id);
        // Add a small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      toast({
        title: "Success",
        description: `Regenerated QR codes for ${guides.length} guides with master access codes`,
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

  const openGuidePreview = (guide: Guide) => {
    const url = `${window.location.origin}/guide/${guide.slug || guide.id}`;
    window.open(url, '_blank');
  };

  React.useEffect(() => {
    loadGuides();
  }, []);

  const guidesWithoutQR = guides.filter(guide => !guide.qr_code_url);
  const guidesWithQR = guides.filter(guide => guide.qr_code_url);
  const guidesWithoutMaster = guides.filter(guide => !guide.master_access_code);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          QR Code Management
        </CardTitle>
        <CardDescription>
          Manage QR codes that provide full access to audio guides using master access codes
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
          {guides.length > 0 && (
            <Button 
              onClick={regenerateAllQRCodes} 
              disabled={loading}
            >
              <QrCode className="h-4 w-4 mr-2" />
              Regenerate All QR Codes with Master Access
            </Button>
          )}
        </div>

        <div className="grid gap-2">
          <div className="text-sm text-muted-foreground mb-2 space-y-1">
            <div>Total guides: {guides.length}</div>
            <div>QR codes: {guidesWithQR.length} / {guides.length}</div>
            <div>Master access codes: {guides.length - guidesWithoutMaster.length} / {guides.length}</div>
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
                    Access URL: {guide.share_url}
                  </div>
                )}
                
                {guide.master_access_code && (
                  <div className="text-xs text-green-600 mt-1">
                    Master Code: {guide.master_access_code}
                  </div>
                )}
                
                <div className="text-xs text-muted-foreground">
                  Price: ${(guide.price_usd / 100).toFixed(2)}
                </div>
              </div>
              
              <div className="flex items-center gap-2 flex-wrap">
                {/* QR Code Status */}
                {guide.qr_code_url ? (
                  <Badge variant="secondary">QR Code ✓</Badge>
                ) : (
                  <Badge variant="destructive">No QR Code</Badge>
                )}
                
                {/* Master Access Code Status */}
                {guide.master_access_code ? (
                  <Badge variant="outline">Master Access ✓</Badge>
                ) : (
                  <Badge variant="outline" className="opacity-50">No Master Code</Badge>
                )}
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openGuidePreview(guide)}
                  title="Preview guide"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                
                {/* Copy Access URL */}
                {guide.share_url && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(guide.share_url!);
                      toast({
                        title: "Success",
                        description: "Access URL copied to clipboard",
                      });
                    }}
                    title="Copy access URL (full access)"
                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
                
                {/* Generate QR Code */}
                <Button
                  size="sm"
                  onClick={() => regenerateQRCode(guide.id)}
                  disabled={regenerating === guide.id}
                  title="Generate/regenerate QR code with master access"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                {regenerating === guide.id ? (
                    <ButtonLoader />
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