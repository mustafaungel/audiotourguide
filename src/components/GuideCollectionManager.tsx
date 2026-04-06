import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Plus, X, GripVertical, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LinkedGuide {
  guide_id: string;
  custom_title: string;
  order: number;
  guide_title?: string;
  guide_location?: string;
}

interface GuideCollectionManagerProps {
  guideId: string;
  onUpdate?: () => void;
  embedded?: boolean;
}

export const GuideCollectionManager: React.FC<GuideCollectionManagerProps> = ({
  guideId,
  onUpdate,
  embedded = false
}) => {
  const [linkedGuides, setLinkedGuides] = useState<LinkedGuide[]>([]);
  const [availableGuides, setAvailableGuides] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGuide, setSelectedGuide] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  console.log('GuideCollectionManager rendered with guideId:', guideId);
  console.log('Available guides:', availableGuides.length);
  console.log('Selected guide:', selectedGuide);
  console.log('Custom title:', customTitle);

  useEffect(() => {
    loadCollection();
    loadAvailableGuides();
  }, [guideId]);

  const loadCollection = async () => {
    try {
      const { data, error } = await supabase
        .from('guide_collections')
        .select('linked_guides')
        .eq('main_guide_id', guideId)
        .maybeSingle();

      if (error) throw error;

      if (data?.linked_guides) {
        const guides = data.linked_guides as unknown as LinkedGuide[];
        
        // Load guide details for linked guides
        const guideIds = guides.map(g => g.guide_id);
        if (guideIds.length > 0) {
          const { data: guideDetails, error: detailsError } = await supabase
            .from('audio_guides')
            .select('id, title, location')
            .in('id', guideIds);

          if (!detailsError) {
            const enrichedGuides = guides.map(linkedGuide => {
              const details = guideDetails.find(d => d.id === linkedGuide.guide_id);
              return {
                ...linkedGuide,
                guide_title: details?.title,
                guide_location: details?.location
              };
            });
            setLinkedGuides(enrichedGuides.sort((a, b) => a.order - b.order));
          }
        }
      }
    } catch (error) {
      console.error('Error loading collection:', error);
    }
  };

  const loadAvailableGuides = async () => {
    try {
      const { data, error } = await supabase
        .from('audio_guides')
        .select('id, title, location, is_published, is_approved')
        .neq('id', guideId)
        .eq('is_published', true)
        .eq('is_approved', true)
        .order('title');

      if (error) throw error;
      setAvailableGuides(data || []);
    } catch (error) {
      console.error('Error loading available guides:', error);
    }
  };

  const addLinkedGuide = async () => {
    console.log('Add linked guide clicked - selectedGuide:', selectedGuide, 'customTitle:', customTitle);
    
    if (!selectedGuide || !customTitle.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a guide and enter a custom title",
        variant: "destructive"
      });
      return;
    }

    if (linkedGuides.some(g => g.guide_id === selectedGuide)) {
      toast({
        title: "Error",
        description: "This guide is already linked",
        variant: "destructive"
      });
      return;
    }

    // Update linked guide's is_standalone to false
    const { error: updateError } = await supabase
      .from('audio_guides')
      .update({ is_standalone: false })
      .eq('id', selectedGuide);
    
    if (updateError) {
      console.error('Error updating guide:', updateError);
      toast({
        title: "Error",
        description: "Failed to link guide",
        variant: "destructive"
      });
      return;
    }

    const newGuide: LinkedGuide = {
      guide_id: selectedGuide,
      custom_title: customTitle.trim(),
      order: linkedGuides.length
    };

    console.log('Adding new guide:', newGuide);
    const updatedGuides = [...linkedGuides, newGuide];
    await saveCollection(updatedGuides);
    
    setSelectedGuide('');
    setCustomTitle('');
    
    toast({
      title: "Guide Linked",
      description: "This guide will only be accessible through this collection"
    });
  };

  const removeLinkedGuide = async (guideId: string) => {
    // Restore is_standalone to true
    const { error: updateError } = await supabase
      .from('audio_guides')
      .update({ is_standalone: true })
      .eq('id', guideId);
    
    if (updateError) {
      console.error('Error updating guide:', updateError);
    }
    
    const updatedGuides = linkedGuides
      .filter(g => g.guide_id !== guideId)
      .map((g, index) => ({ ...g, order: index }));
    
    await saveCollection(updatedGuides);
    
    toast({
      title: "Guide Unlinked",
      description: "Guide is now available as standalone"
    });
  };

  const moveGuide = async (guideId: string, direction: 'up' | 'down') => {
    const currentIndex = linkedGuides.findIndex(g => g.guide_id === guideId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= linkedGuides.length) return;

    const updatedGuides = [...linkedGuides];
    [updatedGuides[currentIndex], updatedGuides[newIndex]] = 
    [updatedGuides[newIndex], updatedGuides[currentIndex]];
    
    // Update order values
    updatedGuides.forEach((guide, index) => {
      guide.order = index;
    });

    await saveCollection(updatedGuides);
  };

  const saveCollection = async (guides: LinkedGuide[]) => {
    setLoading(true);
    console.log('Saving collection for guideId:', guideId, 'with guides:', guides);
    
    try {
      const { data, error } = await supabase
        .from('guide_collections')
        .upsert({
          main_guide_id: guideId,
          linked_guides: guides as any
        }, {
          onConflict: 'main_guide_id'
        })
        .select();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      console.log('Collection saved successfully:', data);
      setLinkedGuides(guides);
      
      // Reload collection data to ensure UI is in sync
      await loadCollection();
      onUpdate?.();
      
      toast({
        title: "Success",
        description: "Guide collection updated successfully"
      });
    } catch (error) {
      console.error('Error saving collection:', error);
      toast({
        title: "Error",
        description: "Failed to save collection",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredGuides = availableGuides.filter(guide =>
    guide.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guide.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const content = (
    <div className="space-y-4">
      {/* Add new linked guide */}
      <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
        <Label>Add New Guide</Label>
          
          <div className="flex gap-2">
            <Search className="w-4 h-4 mt-3 text-muted-foreground" />
            <Input
              placeholder="Search guides..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>

          <Select value={selectedGuide} onValueChange={setSelectedGuide}>
            <SelectTrigger>
              <SelectValue placeholder="Select guide" />
            </SelectTrigger>
            <SelectContent>
              {filteredGuides.map(guide => (
                <SelectItem key={guide.id} value={guide.id}>
                  {guide.title} - {guide.location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder="Custom title (e.g., Valley Tour)"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
          />

          <Button
            type="button"
            onClick={addLinkedGuide}
            disabled={!selectedGuide || !customTitle.trim() || loading}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Guide
          </Button>
        </div>

        {/* Linked guides list */}
        {linkedGuides.length > 0 && (
          <div className="space-y-2">
            <Label>Linked Guides ({linkedGuides.length})</Label>
            {linkedGuides.map((linkedGuide, index) => (
              <div
                key={linkedGuide.guide_id}
                className="flex items-center gap-3 p-3 border rounded-lg bg-background"
              >
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveGuide(linkedGuide.guide_id, 'up')}
                    disabled={index === 0}
                    className="h-6 w-6 p-0"
                  >
                    ↑
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveGuide(linkedGuide.guide_id, 'down')}
                    disabled={index === linkedGuides.length - 1}
                    className="h-6 w-6 p-0"
                  >
                    ↓
                  </Button>
                </div>

                <GripVertical className="w-4 h-4 text-muted-foreground" />

                <div className="flex-1 space-y-1">
                  <div className="font-medium">{linkedGuide.custom_title}</div>
                  <div className="text-sm text-muted-foreground">
                    {linkedGuide.guide_title} - {linkedGuide.guide_location}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Order: {index + 1}
                  </Badge>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeLinkedGuide(linkedGuide.guide_id)}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {linkedGuides.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Plus className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No linked guides yet</p>
            <p className="text-sm">Use the form above to add new guides</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};