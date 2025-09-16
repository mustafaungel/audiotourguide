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
}

export const GuideCollectionManager: React.FC<GuideCollectionManagerProps> = ({
  guideId,
  onUpdate
}) => {
  const [linkedGuides, setLinkedGuides] = useState<LinkedGuide[]>([]);
  const [availableGuides, setAvailableGuides] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGuide, setSelectedGuide] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

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
    if (!selectedGuide || !customTitle.trim()) {
      toast({
        title: "Eksik Bilgi",
        description: "Lütfen guide seçin ve özel başlık girin",
        variant: "destructive"
      });
      return;
    }

    if (linkedGuides.some(g => g.guide_id === selectedGuide)) {
      toast({
        title: "Hata",
        description: "Bu guide zaten eklenmiş",
        variant: "destructive"
      });
      return;
    }

    const newGuide: LinkedGuide = {
      guide_id: selectedGuide,
      custom_title: customTitle.trim(),
      order: linkedGuides.length
    };

    const updatedGuides = [...linkedGuides, newGuide];
    await saveCollection(updatedGuides);
    
    setSelectedGuide('');
    setCustomTitle('');
  };

  const removeLinkedGuide = async (guideId: string) => {
    const updatedGuides = linkedGuides
      .filter(g => g.guide_id !== guideId)
      .map((g, index) => ({ ...g, order: index }));
    
    await saveCollection(updatedGuides);
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
    try {
      const { error } = await supabase
        .from('guide_collections')
        .upsert({
          main_guide_id: guideId,
          linked_guides: guides as any
        }, {
          onConflict: 'main_guide_id'
        });

      if (error) throw error;

      setLinkedGuides(guides);
      onUpdate?.();
      
      toast({
        title: "Başarılı",
        description: "Guide koleksiyonu güncellendi"
      });
    } catch (error) {
      console.error('Error saving collection:', error);
      toast({
        title: "Hata",
        description: "Koleksiyon kaydedilirken hata oluştu",
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Bağlı Audio Guide'lar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new linked guide */}
        <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
          <Label>Yeni Guide Ekle</Label>
          
          <div className="flex gap-2">
            <Search className="w-4 h-4 mt-3 text-muted-foreground" />
            <Input
              placeholder="Guide ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>

          <Select value={selectedGuide} onValueChange={setSelectedGuide}>
            <SelectTrigger>
              <SelectValue placeholder="Guide seçin" />
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
            placeholder="Özel başlık (örn: Vadiler Turu)"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
          />

          <Button
            onClick={addLinkedGuide}
            disabled={!selectedGuide || !customTitle.trim() || loading}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Guide Ekle
          </Button>
        </div>

        {/* Linked guides list */}
        {linkedGuides.length > 0 && (
          <div className="space-y-2">
            <Label>Bağlı Guide'lar ({linkedGuides.length})</Label>
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
                    Sıra: {index + 1}
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
            <p>Henüz bağlı guide yok</p>
            <p className="text-sm">Yukarıdaki form ile yeni guide ekleyebilirsiniz</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};