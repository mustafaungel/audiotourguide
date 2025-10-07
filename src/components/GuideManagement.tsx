import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CheckCircle, XCircle, Eye, Clock, Trash2, Edit, Copy, QrCode, EyeOff, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useGuides } from '@/hooks/admin/useGuides';
import { usePagination } from '@/hooks/admin/usePagination';
import { PaginationControls } from '@/components/admin/PaginationControls';
import { PAGINATION_CONFIG } from '@/utils/admin/pagination';
import { supabase } from '@/integrations/supabase/client';

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
  const [searchQuery, setSearchQuery] = useState('');
  const { currentPage, pageSize, goToPage } = usePagination({
    pageSize: PAGINATION_CONFIG.GUIDES_PER_PAGE,
  });

  const {
    data: guidesResult,
    isLoading,
    refetch,
    updateGuide,
    deleteGuide,
    isUpdating,
    isDeleting,
  } = useGuides({ page: currentPage, pageSize });

  const guides = guidesResult?.data || [];
  const totalPages = guidesResult?.totalPages || 1;
  const hasNextPage = guidesResult?.hasNextPage || false;
  const hasPreviousPage = guidesResult?.hasPreviousPage || false;

  // Filter guides by search query
  const filteredGuides = guides.filter((guide) =>
    guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guide.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guide.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const updateGuideStatus = async (guideId: string, isApproved: boolean) => {
    updateGuide(
      { id: guideId, updates: { is_approved: isApproved } },
      {
        onSuccess: () => {
          toast({
            title: isApproved ? "Guide Approved" : "Guide Rejected",
            description: `Guide has been ${isApproved ? 'approved' : 'rejected'} successfully.`
          });
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to update guide status"
          });
        }
      }
    );
  };

  const togglePublicationStatus = async (guideId: string, currentStatus: boolean) => {
    updateGuide(
      { id: guideId, updates: { is_published: !currentStatus } },
      {
        onSuccess: () => {
          toast({
            title: !currentStatus ? "Guide Published" : "Guide Hidden",
            description: `Guide has been ${!currentStatus ? 'made public' : 'hidden from public view'}.`
          });
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to update publication status"
          });
        }
      }
    );
  };

  const handleDeleteGuide = (guideId: string) => {
    if (!confirm('Are you sure you want to delete this guide? This action cannot be undone.')) {
      return;
    }
    deleteGuide(guideId);
  };

  const previewGuide = (guide: Guide) => {
    // Use share_url if available for direct access, otherwise use public route
    if (guide.share_url) {
      window.open(guide.share_url, '_blank');
    } else {
      const baseUrl = window.location.origin;
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

      refetch();
      
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

      refetch();
      
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
      return <Badge variant="destructive">Pending Approval</Badge>;
    }
    if (!guide.is_published) {
      return <Badge variant="secondary">Hidden</Badge>;
    }
    return <Badge variant="default">Published</Badge>;
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading guides...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Guide Management</h2>
            <p className="text-muted-foreground">
              Review and approve audio guides from creators ({guidesResult?.totalCount || 0} total)
            </p>
          </div>
          <Button 
            variant="outline"
            onClick={repairAccessLinks}
          >
            <QrCode className="h-4 w-4 mr-2" />
            Repair Access Links
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search guides by title, location, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredGuides.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {guides.length === 0 ? 'No guides submitted yet' : 'No guides match your search'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredGuides.map((guide) => (
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
                
                {/* Access Link Section - Always Show */}
                <div className="mb-4 p-3 border rounded-lg bg-muted/50">
                  <h4 className="text-sm font-medium mb-2">
                    {guide.is_published ? 'Published Guide Access' : 'Hidden Guide Access Link'}
                  </h4>
                  <div className="space-y-2">
                    {guide.is_published ? (
                      <div className="text-sm text-muted-foreground">
                        <p><strong>Main Page:</strong> Discoverable and requires payment</p>
                        <p><strong>Direct Access:</strong> Use access link below for instant access</p>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        <p><strong>Hidden:</strong> Not shown on main page, only accessible via link below</p>
                      </div>
                    )}
                    
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
                        Access link not generated - guide may need to be recreated
                      </div>
                    )}
                    
                    {guide.qr_code_url && (
                      <div className="flex items-center gap-2 pt-2 border-t">
                        <img src={guide.qr_code_url} alt="QR Code" className="w-12 h-12 rounded border" />
                        <span className="text-xs text-muted-foreground">QR Code available</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
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
                  
                  {(!guide.qr_code_url || !guide.share_url) && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => generateQRCode(guide.id)}
                    >
                      <QrCode className="h-4 w-4 mr-1" />
                      {guide.qr_code_url ? 'Regenerate' : 'Generate'} Access Link
                    </Button>
                  )}

                  {guide.is_approved && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => togglePublicationStatus(guide.id, guide.is_published)}
                    >
                      {guide.is_published ? (
                        <>
                          <EyeOff className="h-4 w-4 mr-1" />
                          Hide
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-1" />
                          Publish
                        </>
                      )}
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
                    onClick={() => handleDeleteGuide(guide.id)}
                    disabled={isDeleting}
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

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={goToPage}
        hasNextPage={hasNextPage}
        hasPreviousPage={hasPreviousPage}
      />
    </div>
  );
};