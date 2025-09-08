import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Mail, Edit, Eye, Clock, CheckCircle, AlertCircle, Search } from 'lucide-react';

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  category: string;
  status: string;
  priority: string;
  admin_notes?: string;
  responded_at?: string;
  responded_by?: string;
  created_at: string;
  updated_at: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  text_content?: string;
  template_type: string;
  is_active: boolean;
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: 'orange' },
  { value: 'in_progress', label: 'In Progress', color: 'blue' },
  { value: 'resolved', label: 'Resolved', color: 'green' },
  { value: 'closed', label: 'Closed', color: 'gray' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: 'green' },
  { value: 'normal', label: 'Normal', color: 'blue' },
  { value: 'high', label: 'High', color: 'orange' },
  { value: 'urgent', label: 'Urgent', color: 'red' },
];

export const AdminContactManagement: React.FC = () => {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);

  useEffect(() => {
    fetchSubmissions();
    fetchTemplates();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching contact submissions:', error);
      toast.error('Failed to load contact submissions');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching email templates:', error);
    }
  };

  const updateSubmissionStatus = async (id: string, status: string, adminNotes?: string) => {
    try {
      const updateData: any = { status };
      if (adminNotes !== undefined) {
        updateData.admin_notes = adminNotes;
      }
      if (status === 'resolved' || status === 'closed') {
        updateData.responded_at = new Date().toISOString();
        updateData.responded_by = (await supabase.auth.getUser()).data.user?.id;
      }

      const { error } = await supabase
        .from('contact_submissions')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast.success('Submission updated successfully');
      setSelectedSubmission(null);
      fetchSubmissions(); // Refresh the list
    } catch (error) {
      console.error('Error updating submission:', error);
      toast.error('Failed to update submission');
    }
  };

  const updateTemplate = async (template: Partial<EmailTemplate>) => {
    try {
      if (editingTemplate) {
        // Update existing template
        const { error } = await supabase
          .from('email_templates')
          .update(template)
          .eq('id', editingTemplate.id);

        if (error) throw error;
        toast.success('Template updated successfully');
      } else {
        // Create new template - ensure required fields are present
        const templateData = {
          name: template.name || '',
          subject: template.subject || '',
          html_content: template.html_content || '',
          text_content: template.text_content || '',
          template_type: template.template_type || 'contact',
          is_active: template.is_active ?? true
        };

        const { error } = await supabase
          .from('email_templates')
          .insert(templateData);

        if (error) throw error;
        toast.success('Template created successfully');
      }

      setShowTemplateEditor(false);
      setEditingTemplate(null);
      fetchTemplates(); // Refresh the list
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    }
  };

  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = !searchTerm || 
      submission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.subject.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || submission.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusOption = STATUS_OPTIONS.find(opt => opt.value === status);
    return (
      <Badge variant={status === 'resolved' ? 'default' : 'secondary'}>
        {statusOption?.label || status}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityOption = PRIORITY_OPTIONS.find(opt => opt.value === priority);
    return (
      <Badge variant={priority === 'urgent' || priority === 'high' ? 'destructive' : 'secondary'}>
        {priorityOption?.label || priority}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Contact Management</h2>
          <p className="text-muted-foreground">Manage contact form submissions and email templates</p>
        </div>
        <Button onClick={() => setShowTemplateEditor(true)}>
          <Edit className="h-4 w-4 mr-2" />
          Manage Templates
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search submissions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUS_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Submissions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Contact Submissions ({filteredSubmissions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubmissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{submission.name}</p>
                        <p className="text-sm text-muted-foreground">{submission.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{submission.subject}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{submission.category}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(submission.status)}</TableCell>
                    <TableCell>{getPriorityBadge(submission.priority)}</TableCell>
                    <TableCell>{format(new Date(submission.created_at), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedSubmission(submission)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Contact Submission Details</DialogTitle>
                          </DialogHeader>
                          {selectedSubmission && (
                            <SubmissionDetails 
                              submission={selectedSubmission}
                              onUpdateStatus={updateSubmissionStatus}
                            />
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Template Editor Dialog */}
      <Dialog open={showTemplateEditor} onOpenChange={setShowTemplateEditor}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Email Template Management</DialogTitle>
          </DialogHeader>
          <TemplateEditor 
            templates={templates}
            editingTemplate={editingTemplate}
            onEditTemplate={setEditingTemplate}
            onSaveTemplate={updateTemplate}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

const SubmissionDetails: React.FC<{
  submission: ContactSubmission;
  onUpdateStatus: (id: string, status: string, adminNotes?: string) => void;
}> = ({ submission, onUpdateStatus }) => {
  const [status, setStatus] = useState(submission.status);
  const [adminNotes, setAdminNotes] = useState(submission.admin_notes || '');

  const handleUpdate = () => {
    onUpdateStatus(submission.id, status, adminNotes);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>Name</Label>
          <Input value={submission.name} readOnly />
        </div>
        <div>
          <Label>Email</Label>
          <Input value={submission.email} readOnly />
        </div>
      </div>

      <div>
        <Label>Subject</Label>
        <Input value={submission.subject} readOnly />
      </div>

      <div>
        <Label>Message</Label>
        <Textarea value={submission.message} readOnly rows={4} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <Label>Category</Label>
          <Input value={submission.category} readOnly />
        </div>
        <div>
          <Label>Current Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Priority</Label>
          <Input value={submission.priority} readOnly />
        </div>
      </div>

      <div>
        <Label>Admin Notes</Label>
        <Textarea
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          placeholder="Add notes about this submission..."
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button onClick={handleUpdate}>
          Update Submission
        </Button>
      </div>
    </div>
  );
};

const TemplateEditor: React.FC<{
  templates: EmailTemplate[];
  editingTemplate: EmailTemplate | null;
  onEditTemplate: (template: EmailTemplate | null) => void;
  onSaveTemplate: (template: Partial<EmailTemplate>) => void;
}> = ({ templates, editingTemplate, onEditTemplate, onSaveTemplate }) => {
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    html_content: '',
    text_content: '',
    template_type: 'contact',
    is_active: true,
  });

  useEffect(() => {
    if (editingTemplate) {
      setFormData({
        name: editingTemplate.name,
        subject: editingTemplate.subject,
        html_content: editingTemplate.html_content,
        text_content: editingTemplate.text_content || '',
        template_type: editingTemplate.template_type,
        is_active: editingTemplate.is_active,
      });
    } else {
      setFormData({
        name: '',
        subject: '',
        html_content: '',
        text_content: '',
        template_type: 'contact',
        is_active: true,
      });
    }
  }, [editingTemplate]);

  const handleSave = () => {
    onSaveTemplate(formData);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <Select value={editingTemplate?.id || 'new'} onValueChange={(value) => {
          if (value === 'new') {
            onEditTemplate(null);
          } else {
            const template = templates.find(t => t.id === value);
            onEditTemplate(template || null);
          }
        }}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select template to edit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new">New template</SelectItem>
            {templates.map(template => (
              <SelectItem key={template.id} value={template.id}>
                {template.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button variant="outline" onClick={() => onEditTemplate(null)}>
          New Template
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>Template Name</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., welcome_email"
          />
        </div>
        <div>
          <Label>Subject Line</Label>
          <Input
            value={formData.subject}
            onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
            placeholder="Email subject"
          />
        </div>
      </div>

      <div>
        <Label>HTML Content</Label>
        <Textarea
          value={formData.html_content}
          onChange={(e) => setFormData(prev => ({ ...prev, html_content: e.target.value }))}
          placeholder="HTML email content..."
          rows={8}
        />
      </div>

      <div>
        <Label>Text Content (Optional)</Label>
        <Textarea
          value={formData.text_content}
          onChange={(e) => setFormData(prev => ({ ...prev, text_content: e.target.value }))}
          placeholder="Plain text version..."
          rows={4}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => onEditTemplate(null)}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          {editingTemplate ? 'Update' : 'Create'} Template
        </Button>
      </div>
    </div>
  );
};