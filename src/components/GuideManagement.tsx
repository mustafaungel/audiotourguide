import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Eye, Clock, Trash2, Edit, Copy, QrCode } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Guide {
  id: string;
  title: string;
  description: string;
  location: string;
  category: string;
  price_usd: number;
  is_approved: boolean;
  is_published: boolean;
  created_at: string;
  qr_code_url?: string;
  share_url?: string;
  profiles?: {
    full_name: string;
    email: string;
  } | null;
}

export const GuideManagement = () => {
  const { user } = useAuth();
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGuides();
  }, []);

  const fetchGuides = async () => {
    try {
      const { data: guidesData, error } = await supabase
        .from('audio_guides')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform guides to match expected interface
      const guidesWithProfiles = (guidesData || []).map((guide) => ({
        ...guide,
        profiles: null // No longer fetching creator profiles
      }));
      
      setGuides(guidesWithProfiles);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch guides"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateGuideStatus = async (guideId: string, isApproved: boolean) => {
    try {
      const { error } = await supabase
        .from('audio_guides')
        .update({ is_approved: isApproved })
        .eq('id', guideId);

      if (error) throw error;

      setGuides(prev => prev.map(guide => 
        guide.id === guideId ? { ...guide, is_approved: isApproved } : guide
      ));

      toast({
        title: isApproved ? "Guide Approved" : "Guide Rejected",
        description: `Guide has been ${isApproved ? 'approved' : 'rejected'} successfully.`
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update guide status"
      });
    }
  };

  const deleteGuide = async (guideId: string) => {
    if (!confirm('Are you sure you want to delete this guide? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('audio_guides')
        .delete()
        .eq('id', guideId);

      if (error) throw error;

      setGuides(prev => prev.filter(guide => guide.id !== guideId));

      toast({
        title: "Guide Deleted",
        description: "Guide has been permanently deleted."
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete guide"
      });
    }
  };

  const previewGuide = (guideId: string) => {
    // Open guide detail page in new tab with absolute URL
    const baseUrl = window.location.origin;
    const previewUrl = `${baseUrl}/guide/${guideId}`;
    window.open(previewUrl, '_blank');
  };

  const editGuide = (guide: Guide) => {
    // Store the guide data in sessionStorage for editing
    sessionStorage.setItem('editingGuide', JSON.stringify(guide));
    // Directly set the active tab state instead of DOM manipulation
    const event = new CustomEvent('admin-tab-change', { detail: 'edit-guide' });
    window.dispatchEvent(event);
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${type} copied to clipboard.`
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to copy to clipboard"
      });
    }
  };

  const generateQRCode = async (guideId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-qr-code', {
        body: {
          guideId: guideId
        }
      });

      if (error) throw error;

      // Refresh the guides list to show the new QR code
      fetchGuides();
      
      toast({
        title: "QR Code Generated",
        description: "QR code and share link have been created for this guide."
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate QR code"
      });
    }
  };

  const getStatusBadge = (guide: Guide) => {
    if (!guide.is_approved) {
      return <Badge variant="destructive">Pending Approval</Badge>;
    }
    if (!guide.is_published) {
      return <Badge variant="secondary">Approved</Badge>;
    }
    return <Badge variant="default">Published</Badge>;
  };

  if (loading) {
    return <div className="p-8 text-center">Loading guides...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Guide Management</h2>
          <p className="text-muted-foreground">Review and approve audio guides from creators</p>
        </div>
      </div>

      <div className="grid gap-4">
        {guides.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No guides submitted yet</p>
            </CardContent>
          </Card>
        ) : (
          guides.map((guide) => (
            <Card key={guide.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {guide.title}
                      {getStatusBadge(guide)}
                    </CardTitle>
                    <CardDescription>
                      {guide.location} • {guide.category}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold">${(guide.price_usd / 100).toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(guide.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{guide.description}</p>
                
                {/* QR Code and Share Link Section */}
                {(guide.qr_code_url || guide.share_url) && (
                  <div className="mb-4 p-3 border rounded-lg bg-muted/50">
                    <h4 className="text-sm font-medium mb-2">Share & Access</h4>
                    <div className="flex flex-col sm:flex-row gap-2">
                      {guide.qr_code_url && (
                        <div className="flex items-center gap-2">
                          <img src={guide.qr_code_url} alt="QR Code" className="w-12 h-12 rounded border" />
                          <span className="text-xs text-muted-foreground">QR Code</span>
                        </div>
                      )}
                      {guide.share_url && (
                        <div className="flex-1">
                          <div className="flex items-center gap-1">
                            <input 
                              readOnly 
                              value={guide.share_url} 
                              className="text-xs bg-background border rounded px-2 py-1 flex-1 min-w-0"
                            />
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => copyToClipboard(guide.share_url!, 'Share link')}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => previewGuide(guide.id)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => editGuide(guide)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  
                  {!guide.qr_code_url && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => generateQRCode(guide.id)}
                    >
                      <QrCode className="h-4 w-4 mr-1" />
                      Generate QR
                    </Button>
                  )}
                  
                  {!guide.is_approved && (
                    <>
                      <Button 
                        size="sm" 
                        onClick={() => updateGuideStatus(guide.id, true)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => updateGuideStatus(guide.id, false)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </>
                  )}
                  
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => deleteGuide(guide.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};