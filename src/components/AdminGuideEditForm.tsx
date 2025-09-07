import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { GuideSectionsManager } from './GuideSectionsManager';

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
  creator_id: string;
  profiles?: {
    full_name: string;
    email: string;
  } | null;
}

interface AdminGuideEditFormProps {
  onBack: () => void;
}

export const AdminGuideEditForm = ({ onBack }: AdminGuideEditFormProps) => {
  const [guide, setGuide] = useState<Guide | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    category: '',
    price_usd: 0,
  });

  useEffect(() => {
    // Load guide data from sessionStorage
    const editingGuideData = sessionStorage.getItem('editingGuide');
    if (editingGuideData) {
      const guideData = JSON.parse(editingGuideData);
      setGuide(guideData);
      setFormData({
        title: guideData.title,
        description: guideData.description,
        location: guideData.location,
        category: guideData.category,
        price_usd: guideData.price_usd / 100, // Convert from cents to dollars
      });
    }
  }, []);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateGuide = async () => {
    if (!guide) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('audio_guides')
        .update({
          title: formData.title,
          description: formData.description,
          location: formData.location,
          category: formData.category,
          price_usd: Math.round(formData.price_usd * 100), // Convert to cents
          updated_at: new Date().toISOString(),
        })
        .eq('id', guide.id);

      if (error) throw error;

      toast.success('Guide updated successfully!');
      
      // Clear sessionStorage
      sessionStorage.removeItem('editingGuide');
      
      // Go back to content management
      onBack();
    } catch (error) {
      console.error('Error updating guide:', error);
      toast.error('Failed to update guide');
    } finally {
      setLoading(false);
    }
  };

  if (!guide) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Content Management
          </Button>
        </div>
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No guide selected for editing</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Content Management
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Edit Guide</h2>
          <p className="text-muted-foreground">Modify guide details and content</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Guide Information</CardTitle>
            <CardDescription>Update basic guide details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter guide title"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description *</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter guide description"
                rows={4}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-location">Location *</Label>
              <Input
                id="edit-location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="e.g., Paris, France"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cultural">Cultural</SelectItem>
                  <SelectItem value="historical">Historical</SelectItem>
                  <SelectItem value="nature">Nature</SelectItem>
                  <SelectItem value="adventure">Adventure</SelectItem>
                  <SelectItem value="food">Food & Drink</SelectItem>
                  <SelectItem value="art">Art & Museums</SelectItem>
                  <SelectItem value="architecture">Architecture</SelectItem>
                  <SelectItem value="religious">Religious Sites</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-price">Price (USD) *</Label>
              <Input
                id="edit-price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price_usd}
                onChange={(e) => handleInputChange('price_usd', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>

            <Button
              onClick={updateGuide}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating Guide...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Update Guide
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Guide Sections</CardTitle>
            <CardDescription>Manage audio sections and content</CardDescription>
          </CardHeader>
          <CardContent>
            <GuideSectionsManager guideId={guide.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};