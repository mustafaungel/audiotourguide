import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Clock, User, Globe, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface VerificationRequest {
  id: string;
  full_name: string;
  portfolio_url?: string;
  experience_description?: string;
  social_media_links: any;
  submitted_at: string;
  status: string;
  user_id: string;
  id_document_url?: string;
  profiles?: {
    email: string;
    full_name: string;
  };
}

export const UserManagement = () => {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchVerificationRequests();
  }, []);

  const fetchVerificationRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('verification_requests')
        .select(`
          *,
          profiles!verification_requests_user_id_fkey (
            email,
            full_name
          )
        `)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch verification requests"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (requestId: string) => {
    try {
      const { error } = await supabase.rpc('approve_creator_verification', {
        request_id: requestId,
        admin_notes_param: adminNotes || null
      });

      if (error) throw error;

      setRequests(prev => prev.map(req => 
        req.id === requestId ? { ...req, status: 'approved' } : req
      ));

      toast({
        title: "Verification Approved",
        description: "Creator has been verified successfully."
      });

      setSelectedRequest(null);
      setAdminNotes('');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to approve verification"
      });
    }
  };

  const handleRejection = async (requestId: string) => {
    if (!rejectionReason.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please provide a rejection reason"
      });
      return;
    }

    try {
      const { error } = await supabase.rpc('reject_creator_verification', {
        request_id: requestId,
        rejection_reason_param: rejectionReason,
        admin_notes_param: adminNotes || null
      });

      if (error) throw error;

      setRequests(prev => prev.map(req => 
        req.id === requestId ? { ...req, status: 'rejected' } : req
      ));

      toast({
        title: "Verification Rejected",
        description: "Verification request has been rejected."
      });

      setSelectedRequest(null);
      setAdminNotes('');
      setRejectionReason('');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reject verification"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending Review</Badge>;
      case 'approved':
        return <Badge variant="default">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading verification requests...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-muted-foreground">Review creator verification requests</p>
        </div>
      </div>

      <div className="grid gap-4">
        {requests.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No verification requests yet</p>
            </CardContent>
          </Card>
        ) : (
          requests.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {request.full_name}
                      {getStatusBadge(request.status)}
                    </CardTitle>
                    <CardDescription>
                      {request.profiles?.email} • 
                      Submitted {new Date(request.submitted_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {request.experience_description && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Experience
                    </h4>
                    <p className="text-sm text-muted-foreground">{request.experience_description}</p>
                  </div>
                )}

                {request.portfolio_url && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Portfolio
                    </h4>
                    <a 
                      href={request.portfolio_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      {request.portfolio_url}
                    </a>
                  </div>
                )}

                {request.social_media_links && Object.keys(request.social_media_links).length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Social Media</h4>
                    <div className="flex gap-2">
                      {Object.entries(request.social_media_links).map(([platform, url]) => (
                        <a 
                          key={platform}
                          href={url as string}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm capitalize"
                        >
                          {platform}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {request.status === 'pending' && (
                  <div className="border-t pt-4">
                    {selectedRequest === request.id ? (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="adminNotes">Admin Notes (Optional)</Label>
                          <Textarea
                            id="adminNotes"
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                            placeholder="Add any notes for this decision..."
                            rows={3}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="rejectionReason">Rejection Reason (Required for rejection)</Label>
                          <Textarea
                            id="rejectionReason"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Explain why this request is being rejected..."
                            rows={2}
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            onClick={() => handleApproval(request.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button 
                            variant="destructive"
                            onClick={() => handleRejection(request.id)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => {
                              setSelectedRequest(null);
                              setAdminNotes('');
                              setRejectionReason('');
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button 
                        onClick={() => setSelectedRequest(request.id)}
                        variant="outline"
                      >
                        <Clock className="h-4 w-4 mr-1" />
                        Review Request
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};