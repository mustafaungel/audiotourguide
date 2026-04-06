import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GripVertical, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface GuideItem {
  id: string;
  title: string;
  location: string;
  is_published: boolean;
  is_approved: boolean;
  price_usd: number;
  display_order: number;
}

const SortableGuideRow = ({ guide, index }: { guide: GuideItem; index: number }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: guide.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isLive = guide.is_published && guide.is_approved;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg border bg-card',
        isDragging && 'opacity-50 shadow-lg z-50'
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="touch-target flex items-center justify-center text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing shrink-0"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-5 w-5" />
      </button>

      <span className="text-sm font-medium text-muted-foreground w-6 text-center shrink-0">
        {index + 1}
      </span>

      <span className="text-sm font-medium truncate flex-1 min-w-0">
        {guide.title}
      </span>

      <span className="text-xs text-muted-foreground truncate hidden sm:block max-w-[120px]">
        {guide.location}
      </span>

      <Badge
        variant={isLive ? 'default' : 'secondary'}
        className="shrink-0 text-xs"
      >
        {isLive ? 'Live' : 'Hidden'}
      </Badge>

      <span className="text-xs text-muted-foreground shrink-0 w-14 text-right">
        ${(guide.price_usd / 100).toFixed(2)}
      </span>
    </div>
  );
};

export const AdminGuideOrderManager = () => {
  const [guides, setGuides] = useState<GuideItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchGuides();
  }, []);

  const fetchGuides = async () => {
    try {
      const { data, error } = await supabase
        .from('audio_guides')
        .select('id, title, location, is_published, is_approved, price_usd, display_order')
        .eq('is_standalone', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGuides(data || []);
    } catch (error) {
      console.error('Error fetching guides:', error);
      toast.error('Guide listesi yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setGuides((prev) => {
      const oldIndex = prev.findIndex((g) => g.id === active.id);
      const newIndex = prev.findIndex((g) => g.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = guides.map((guide, index) =>
        supabase
          .from('audio_guides')
          .update({ display_order: index })
          .eq('id', guide.id)
      );
      const results = await Promise.all(updates);
      const failed = results.filter((r) => r.error);
      if (failed.length > 0) throw failed[0].error;

      setHasChanges(false);
      toast.success('Sıralama kaydedildi');
    } catch (error) {
      console.error('Error saving order:', error);
      toast.error('Sıralama kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Guide Sıralaması</h3>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          size="sm"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <Save className="h-4 w-4 mr-1" />
          )}
          Kaydet
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={guides.map((g) => g.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-1.5">
            {guides.map((guide, index) => (
              <SortableGuideRow key={guide.id} guide={guide} index={index} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {guides.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">
          Henüz guide eklenmemiş
        </p>
      )}
    </div>
  );
};
