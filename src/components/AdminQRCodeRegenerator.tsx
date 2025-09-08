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
  slug?: string;
  qr_code_url: string | null;
  share_url: string | null;
  admin_qr_code_url: string | null;
  admin_share_url: string | null;
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
        .select('id, title, qr_code_url, share_url, admin_qr_code_url, admin_share_url, price_usd')
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
        description: `User QR code regenerated successfully! URL: ${data?.share_url}`,
      });
    } catch (error) {
      console.error('Error regenerating user QR code:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to regenerate user QR code",
        variant: "destructive",
      });
    } finally {
      setRegenerating(null);
    }
  };

  const generateAdminQRCode = async (guideId: string) => {
    setRegenerating(guideId);
    try {
      // Get fresh session to ensure we have valid tokens
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.access_token) {
        console.error('Session error:', sessionError);
        toast({
          title: "Authentication Error",
          description: "Please sign in again to generate admin QR codes",
          variant: "destructive",
        });
        return;
      }

      console.log('Calling generate-admin-qr-code with session:', session.access_token.slice(-10));
      
      const { data, error } = await supabase.functions.invoke('generate-admin-qr-code', {
        body: { guideId }
      });

      if (error) {
        console.error('Function error:', error);
        throw error;
      }

      // Refresh the guide data
      await loadGuides();

      toast({
        title: "Success",
        description: `Admin QR code generated successfully! URL: ${data?.admin_share_url}`,
      });
    } catch (error) {
      console.error('Error generating admin QR code:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate admin QR code",
        variant: "destructive",
      });
    } finally {
      setRegenerating(null);
    }
  };

  const generateAllAdminQRCodes = async () => {
    setLoading(true);
    try {
      const guidesWithoutAdminQR = guides.filter(guide => !guide.admin_qr_code_url);
      
      for (const guide of guidesWithoutAdminQR) {
        setRegenerating(guide.id);
        await generateAdminQRCode(guide.id);
        // Add a small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      toast({
        title: "Success",
        description: `Generated admin QR codes for ${guidesWithoutAdminQR.length} guides`,
      });
    } catch (error) {
      console.error('Error generating all admin QR codes:', error);
      toast({
        title: "Error",
        description: "Failed to generate all admin QR codes",
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

  const guidesWithoutAdminQR = guides.filter(guide => !guide.admin_qr_code_url);
  const guidesWithAdminQR = guides.filter(guide => guide.admin_qr_code_url);
  const guidesWithoutUserQR = guides.filter(guide => !guide.qr_code_url);
  const guidesWithUserQR = guides.filter(guide => guide.qr_code_url);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          QR Code Management
        </CardTitle>
        <CardDescription>
          Manage two types of QR codes: Admin QR codes (permanent, for marketing) and User QR codes (access-specific, after purchase)
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
          {guidesWithoutAdminQR.length > 0 && (
            <Button 
              onClick={generateAllAdminQRCodes} 
              disabled={loading}
            >
              <QrCode className="h-4 w-4 mr-2" />
              Generate All Missing Admin QR Codes ({guidesWithoutAdminQR.length})
            </Button>
          )}
        </div>

        <div className="grid gap-2">
          <div className="text-sm text-muted-foreground mb-2 space-y-1">
            <div>Total guides: {guides.length}</div>
            <div>Admin QR codes: {guidesWithAdminQR.length} / {guides.length} | User QR codes: {guidesWithUserQR.length} / {guides.length}</div>
          </div>
          
          {guides.map((guide) => (
            <div 
              key={guide.id} 
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex-1">
                <div className="font-medium">{guide.title}</div>
                <div className="text-sm text-muted-foreground">{guide.id}</div>
                
                {guide.admin_share_url && (
                  <div className="text-xs text-green-600 mt-1 break-all">
                    Admin URL (Purchase): {guide.admin_share_url}
                  </div>
                )}
                
                {guide.share_url && (
                  <div className="text-xs text-blue-600 mt-1 break-all">
                    User URL (Access): {guide.share_url}
                  </div>
                )}
                
                <div className="text-xs text-muted-foreground">
                  Price: ${(guide.price_usd / 100).toFixed(2)}
                </div>
              </div>
              
              <div className="flex items-center gap-2 flex-wrap">
                {/* Admin QR Code Status */}
                {guide.admin_qr_code_url ? (
                  <Badge variant="secondary">Admin QR ✓</Badge>
                ) : (
                  <Badge variant="destructive">No Admin QR</Badge>
                )}
                
                {/* User QR Code Status */}
                {guide.qr_code_url ? (
                  <Badge variant="outline">User QR ✓</Badge>
                ) : (
                  <Badge variant="outline" className="opacity-50">No User QR</Badge>
                )}
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openGuidePreview(guide)}
                  title="Preview guide"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                
                {/* Copy Admin URL */}
                {guide.admin_share_url && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(guide.admin_share_url!);
                      toast({
                        title: "Success",
                        description: "Admin URL copied to clipboard",
                      });
                    }}
                    title="Copy admin URL (purchase page)"
                    className="border-green-200 text-green-700 hover:bg-green-50"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
                
                {/* Copy User URL */}
                {guide.share_url && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(guide.share_url!);
                      toast({
                        title: "Success",
                        description: "User access URL copied to clipboard",
                      });
                    }}
                    title="Copy user access URL"
                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
                
                {/* Generate Admin QR Code */}
                <Button
                  size="sm"
                  onClick={() => generateAdminQRCode(guide.id)}
                  disabled={regenerating === guide.id}
                  title="Generate/regenerate admin QR code"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {regenerating === guide.id ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <QrCode className="h-4 w-4" />
                  )}
                </Button>
                
                {/* Generate User QR Code */}
                <Button
                  size="sm"
                  onClick={() => regenerateQRCode(guide.id)}
                  disabled={regenerating === guide.id}
                  title="Generate/regenerate user access QR code"
                  variant="outline"
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