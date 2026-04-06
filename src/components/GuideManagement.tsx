import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Eye, Clock, Trash2, Edit, Copy, QrCode, EyeOff, MoreVertical, ChevronDown } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { buildAccessUrl } from '@/lib/url-utils';

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
  slug?: string;
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

  const togglePublicationStatus = async (guideId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('audio_guides')
        .update({ is_published: !currentStatus })
        .eq('id', guideId);

      if (error) throw error;

      setGuides(prev => prev.map(guide => 
        guide.id === guideId ? { ...guide, is_published: !currentStatus } : guide
      ));

      toast({
        title: !currentStatus ? "Guide Published" : "Guide Hidden",
        description: `Guide has been ${!currentStatus ? 'made public' : 'hidden from public view'}.`
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update publication status"
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

  const previewGuide = (guide: Guide) => {
    // Always use current origin for preview/test (not share_url which points to production)
    const baseUrl = window.location.origin;
    if ((guide as any).master_access_code) {
      const url = buildAccessUrl(guide.id, (guide as any).master_access_code, 'preview');
      window.open(url, '_blank');
    } else {
      const previewUrl = guide.slug ? `${baseUrl}/guide/${guide.slug}` : `${baseUrl}/guide/${guide.id}`;
      window.open(previewUrl, '_blank');
    }
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

  const repairAccessLinks = async () => {
    try {
      const guidesNeedingRepair = guides.filter(guide => !guide.share_url || !guide.qr_code_url);
      
      if (guidesNeedingRepair.length === 0) {
        toast({
          title: "No Repair Needed",
          description: "All guides already have access links."
        });
        return;
      }

      toast({
        title: "Repairing Access Links",
        description: `Processing ${guidesNeedingRepair.length} guides...`
      });

      for (const guide of guidesNeedingRepair) {
        await supabase.functions.invoke('generate-qr-code', {
          body: {
            guideId: guide.id,
            skipAuth: true
          }
        });
      }

      // Refresh the guides list
      fetchGuides();
      
      toast({
        title: "Access Links Repaired",
        description: `Successfully repaired ${guidesNeedingRepair.length} guides.`
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to repair access links"
      });
    }
  };

  const getStatusBadge = (guide: Guide) => {
    if (!guide.is_approved) {
      return <Badge variant="destructive" className="gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
    }
    if (!guide.is_published) {
      return <Badge variant="secondary" className="gap-1"><EyeOff className="h-3 w-3" />Hidden</Badge>;
    }
    return <Badge variant="default" className="gap-1"><CheckCircle className="h-3 w-3" />Live</Badge>;
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
        <Button 
          variant="outline"
          onClick={repairAccessLinks}
        >
          <QrCode className="h-4 w-4 mr-2" />
          Repair Access Links
        </Button>
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
                <p className="text-muted-foreground mb-4 line-clamp-2">{guide.description}</p>
                
                {/* Collapsible Access Link Section */}
                <Collapsible className="mb-4">
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full justify-between mb-2">
                      <span className="flex items-center gap-2">
                        <QrCode className="h-4 w-4" />
                        Access Links & QR Code
                      </span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="p-3 border rounded-lg bg-muted/50 space-y-2">
                      <div className="text-xs text-muted-foreground">
                        {guide.is_published ? (
                          <p><strong>Published:</strong> Discoverable on main page, direct access via link below</p>
                        ) : (
                          <p><strong>Hidden:</strong> Only accessible via link below</p>
                        )}
                      </div>
                      
                      {guide.share_url ? (
                        <div className="flex items-center gap-1">
                          <input 
                            readOnly 
                            value={guide.share_url} 
                            className="text-xs bg-background border rounded px-2 py-1 flex-1 min-w-0"
                          />
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => copyToClipboard(guide.share_url!, 'Access link')}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="text-xs text-orange-600">
                          Access link not generated
                        </div>
                      )}
                      
                      {guide.qr_code_url && (
                        <div className="flex items-center gap-2 pt-2 border-t">
                          <img src={guide.qr_code_url} alt="QR Code" className="w-12 h-12 rounded border" />
                          <span className="text-xs text-muted-foreground">QR Code ready</span>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
                
                <div className="flex flex-wrap gap-2">
                  {/* Primary Actions */}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => previewGuide(guide)}
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

                  {/* Quick Approve/Reject for Pending */}
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
                  
                  {/* More Actions Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {(!guide.qr_code_url || !guide.share_url) && (
                        <DropdownMenuItem onClick={() => generateQRCode(guide.id)}>
                          <QrCode className="h-4 w-4 mr-2" />
                          {guide.qr_code_url ? 'Regenerate' : 'Generate'} Access
                        </DropdownMenuItem>
                      )}
                      
                      {guide.is_approved && (
                        <DropdownMenuItem onClick={() => togglePublicationStatus(guide.id, guide.is_published)}>
                          {guide.is_published ? (
                            <>
                              <EyeOff className="h-4 w-4 mr-2" />
                              Hide from Public
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-2" />
                              Publish to Public
                            </>
                          )}
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuItem 
                        onClick={() => deleteGuide(guide.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Guide
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};