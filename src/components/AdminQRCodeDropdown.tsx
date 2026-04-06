import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Copy, ExternalLink, QrCode, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { buildAccessUrl } from "@/lib/url-utils";

interface Guide {
  id: string;
  title: string;
  slug?: string;
  qr_code_url: string | null;
  share_url: string | null;
  master_access_code: string | null;
  price_usd: number;
}

export function AdminQRCodeDropdown() {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState<string | null>(null);

  useEffect(() => {
    loadGuides();
  }, []);

  const loadGuides = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('audio_guides')
        .select('id, title, slug, qr_code_url, share_url, master_access_code, price_usd')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGuides(data || []);
    } catch (error) {
      console.error('Error loading guides:', error);
      toast.error('Failed to load guides');
    } finally {
      setLoading(false);
    }
  };

  const regenerateQRCode = async (guideId: string) => {
    try {
      setRegenerating(guideId);
      const { error } = await supabase.functions.invoke('generate-admin-qr-code', {
        body: { guideId }
      });

      if (error) throw error;
      
      toast.success('QR code regenerated successfully');
      await loadGuides();
    } catch (error) {
      console.error('Error regenerating QR code:', error);
      toast.error('Failed to regenerate QR code');
    } finally {
      setRegenerating(null);
    }
  };

  const openGuidePreview = (guide: Guide) => {
    if (guide.master_access_code) {
      const url = buildAccessUrl(guide.id, guide.master_access_code, 'preview');
      window.open(url, '_blank');
    } else {
      const baseUrl = window.location.origin;
      window.open(`${baseUrl}/guide/${guide.slug || guide.id}`, '_blank');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('URL copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy URL');
    }
  };

  const guidesWithQR = guides.filter(g => g.qr_code_url).length;
  const guidesWithMaster = guides.filter(g => g.master_access_code).length;

  if (loading) {
    return <div className="text-center py-4 text-muted-foreground">Loading guides...</div>;
  }

  if (guides.length === 0) {
    return <div className="text-center py-4 text-muted-foreground">No guides found</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Badge variant="secondary">{guidesWithQR}/{guides.length} QR Codes</Badge>
        <Badge variant="outline">{guidesWithMaster}/{guides.length} Master Codes</Badge>
        <Button size="sm" variant="ghost" onClick={loadGuides} className="ml-auto">
          <RefreshCw className="h-3 w-3 mr-1" />
          Refresh
        </Button>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
        {guides.map((guide) => (
          <div 
            key={guide.id} 
            className="flex items-center justify-between gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{guide.title}</div>
              <div className="flex items-center gap-2 mt-1">
                {guide.qr_code_url ? (
                  <Badge variant="secondary" className="text-xs">QR ✓</Badge>
                ) : (
                  <Badge variant="destructive" className="text-xs">No QR</Badge>
                )}
                {guide.master_access_code && (
                  <Badge variant="outline" className="text-xs">Master ✓</Badge>
                )}
                <span className="text-xs text-muted-foreground">${(guide.price_usd / 100).toFixed(2)}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => openGuidePreview(guide)}
                title="Preview guide"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
              {(guide.share_url || guide.master_access_code) && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => {
                    const url = guide.share_url || 
                      `${window.location.origin}/audio-access?code=${guide.master_access_code}`;
                    copyToClipboard(url);
                  }}
                  title="Copy access URL"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              )}
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => regenerateQRCode(guide.id)}
                disabled={regenerating === guide.id}
                title="Regenerate QR code"
              >
                {regenerating === guide.id ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  <QrCode className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
