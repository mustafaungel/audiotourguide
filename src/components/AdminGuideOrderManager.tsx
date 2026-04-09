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
import { buildAccessUrl, getBaseUrl } from '@/lib/url-utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GripVertical, Save, Loader2, Pencil, ExternalLink, Eye, EyeOff, Link2, ChevronDown, Copy, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getLanguageFlag, getLanguageName } from '@/lib/language-utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface GuideItem {
  id: string;
  title: string;
  location: string;
  is_published: boolean;
  is_approved: boolean;
  is_standalone: boolean;
  price_usd: number;
  display_order: number;
  languages: string[];
  slug: string;
  master_access_code: string | null;
}

interface LinkedGuideInfo {
  guide_id: string;
  custom_title?: string;
}

interface CollectionMap {
  [mainGuideId: string]: LinkedGuideInfo[];
}

const SortableGuideRow = ({
  guide,
  index,
  onTogglePublish,
  onEdit,
  togglingId,
  linkedGuides,
  guideTitles,
}: {
  guide: GuideItem;
  index: number;
  onTogglePublish: (id: string, current: boolean) => void;
  onEdit: (id: string) => void;
  togglingId: string | null;
  linkedGuides: LinkedGuideInfo[];
  guideTitles: Record<string, string>;
}) => {
  const [expanded, setExpanded] = useState(false);
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
  const isPending = guide.is_published && !guide.is_approved;

  const handlePreview = () => {
    if (guide.master_access_code) {
      window.open(`/access/${guide.id}?access_code=${guide.master_access_code}`, '_blank');
    } else {
      toast.error('No access code for this guide');
    }
  };

  const accessLink = guide.master_access_code
    ? buildAccessUrl(guide.id, guide.master_access_code, 'public')
    : null;
  const detailLink = `${getBaseUrl()}/guide/${guide.slug}`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'rounded-lg border bg-card',
        isDragging && 'opacity-50 shadow-lg z-50'
      )}
    >
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          {...attributes}
          {...listeners}
          className="flex items-center justify-center text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing shrink-0"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <span className="text-xs font-medium text-muted-foreground w-5 text-center shrink-0">
          {index + 1}
        </span>

        <button
          className="flex items-center gap-2 flex-1 min-w-0 text-left"
          onClick={() => setExpanded(!expanded)}
        >
          <span className="text-sm font-medium truncate flex-1 min-w-0">
            {guide.title}
          </span>
          <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200", expanded && "rotate-180")} />
        </button>

        <span className="text-xs text-muted-foreground truncate hidden sm:block max-w-[180px]">
          {guide.location}
        </span>

        <div className="hidden md:flex items-center gap-0.5 shrink-0">
          {guide.languages.map((lang) => (
            <Tooltip key={lang}>
              <TooltipTrigger asChild>
                <span className="text-sm cursor-default">{getLanguageFlag(lang)}</span>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {getLanguageName(lang)}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        {!guide.is_standalone && (
          <Badge variant="outline" className="shrink-0 text-[10px] px-1.5 py-0 gap-0.5 cursor-default text-violet-600 border-violet-300 dark:text-violet-400 dark:border-violet-700">
            Linked
          </Badge>
        )}

        {linkedGuides.length > 0 && (
          <Badge variant="outline" className="shrink-0 text-[10px] px-1.5 py-0 gap-0.5 cursor-default">
            <Link2 className="h-3 w-3" />
            {linkedGuides.length}
          </Badge>
        )}

        <Badge
          variant={isLive ? 'default' : isPending ? 'outline' : 'secondary'}
          className="shrink-0 text-[10px] px-1.5 py-0"
        >
          {isLive ? 'Live' : isPending ? 'Pending' : 'Hidden'}
        </Badge>

        <span className="text-xs text-muted-foreground shrink-0 w-12 text-right">
          ${(guide.price_usd / 100).toFixed(2)}
        </span>

        <div className="flex items-center gap-0.5 shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
                onClick={() => onEdit(guide.id)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">Edit</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-7 w-7"
                onClick={handlePreview}
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">Preview (Audio Access)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className={cn(
                  "h-7 w-7",
                  guide.is_published
                    ? "text-orange-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950"
                    : "text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                )}
                onClick={() => onTogglePublish(guide.id, guide.is_published)}
                disabled={togglingId === guide.id}
              >
                {guide.is_published ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {guide.is_published ? 'Hide' : 'Publish'}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-border/50 space-y-2 text-xs">
          <div className="flex items-start gap-2">
            <span className="text-muted-foreground shrink-0">📋 Languages:</span>
            <div className="flex flex-wrap gap-1.5">
              {guide.languages.map((lang) => (
                <span key={lang} className="inline-flex items-center gap-1 bg-muted/50 rounded px-1.5 py-0.5">
                  {getLanguageFlag(lang)} {getLanguageName(lang)}
                </span>
              ))}
              {guide.languages.length === 0 && <span className="text-muted-foreground">—</span>}
            </div>
          </div>

          <div className="flex items-start gap-2">
            <span className="text-muted-foreground shrink-0">🔗 Linked:</span>
            <div className="flex flex-wrap gap-1.5">
              {linkedGuides.length > 0 ? linkedGuides.map((lg, i) => (
                <span key={i} className="inline-flex items-center gap-1 bg-muted/50 rounded px-1.5 py-0.5">
                  {lg.custom_title || guideTitles[lg.guide_id] || lg.guide_id.slice(0, 8)}
                </span>
              )) : <span className="text-muted-foreground">No linked guides</span>}
            </div>
          </div>

          {accessLink && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground shrink-0">🔑 Access:</span>
              <code className="text-[11px] bg-muted/50 rounded px-1.5 py-0.5 truncate flex-1 min-w-0">{accessLink}</code>
              <Button variant="ghost" size="sm" className="h-6 px-2 shrink-0" onClick={() => copyToClipboard(accessLink, 'Access link')}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground shrink-0">🌐 Detail:</span>
            <code className="text-[11px] bg-muted/50 rounded px-1.5 py-0.5 truncate flex-1 min-w-0">{detailLink}</code>
            <Button variant="ghost" size="sm" className="h-6 px-2 shrink-0" onClick={() => copyToClipboard(detailLink, 'Detail link')}>
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export const AdminGuideOrderManager = ({ onCreateNew, onEdit }: { onCreateNew?: () => void; onEdit?: (guideId: string) => void }) => {
  const [guides, setGuides] = useState<GuideItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [collections, setCollections] = useState<CollectionMap>({});
  const [guideTitles, setGuideTitles] = useState<Record<string, string>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchGuides();
    fetchCollections();

    // Listen for guide updates from edit form (localStorage events)
    const onStorage = (e: StorageEvent) => {
      if (e.key?.startsWith('guide_updated_')) {
        fetchGuides();
        fetchCollections();
      }
    };
    window.addEventListener('storage', onStorage);

    // Supabase realtime subscription for instant updates
    const channel = supabase
      .channel('admin-guide-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audio_guides' }, () => {
        fetchGuides();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guide_collections' }, () => {
        fetchCollections();
      })
      .subscribe();

    return () => {
      window.removeEventListener('storage', onStorage);
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchGuides = async () => {
    try {
      const { data, error } = await supabase
        .from('audio_guides')
        .select('id, title, location, is_published, is_approved, is_standalone, price_usd, display_order, languages, slug, master_access_code')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 1 && data.every(g => g.display_order === 0)) {
        const updates = data.map((g, i) =>
          supabase.from('audio_guides').update({ display_order: i }).eq('id', g.id)
        );
        await Promise.all(updates);
        data.forEach((g, i) => { g.display_order = i; });
      }

      const guideIds = (data || []).map(g => g.id);
      if (guideIds.length > 0) {
        const { data: sectionLangs } = await supabase
          .from('guide_sections')
          .select('guide_id, language_code')
          .in('guide_id', guideIds);

        if (sectionLangs && sectionLangs.length > 0) {
          const langMap: Record<string, Set<string>> = {};
          sectionLangs.forEach(s => {
            if (!langMap[s.guide_id]) langMap[s.guide_id] = new Set();
            langMap[s.guide_id].add(s.language_code);
          });
          data?.forEach(g => {
            if (langMap[g.id]) {
              g.languages = Array.from(langMap[g.id]);
            }
          });
        }
      }

      setGuides(data || []);

      const titleMap: Record<string, string> = {};
      (data || []).forEach(g => { titleMap[g.id] = g.title; });
      setGuideTitles(titleMap);
    } catch (error) {
      console.error('Error fetching guides:', error);
      toast.error('Failed to load guide list');
    } finally {
      setLoading(false);
    }
  };

  const fetchCollections = async () => {
    try {
      const { data, error } = await supabase
        .from('guide_collections')
        .select('main_guide_id, linked_guides');

      if (error) throw error;

      const map: CollectionMap = {};
      (data || []).forEach(col => {
        const linked = Array.isArray(col.linked_guides) ? (col.linked_guides as unknown as LinkedGuideInfo[]) : [];
        if (linked.length > 0) {
          map[col.main_guide_id] = linked;
        }
      });
      setCollections(map);
    } catch (error) {
      console.error('Error fetching collections:', error);
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
      toast.success('Order saved');
    } catch (error) {
      console.error('Error saving order:', error);
      toast.error('Failed to save order');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (guideId: string, currentPublished: boolean) => {
    setTogglingId(guideId);
    try {
      const { error } = await supabase
        .from('audio_guides')
        .update({ is_published: !currentPublished })
        .eq('id', guideId);

      if (error) throw error;

      setGuides((prev) =>
        prev.map((g) =>
          g.id === guideId ? { ...g, is_published: !currentPublished } : g
        )
      );
      
      toast.success(currentPublished ? 'Guide hidden' : 'Guide published');
    } catch (error) {
      console.error('Error toggling publish:', error);
      toast.error('Failed to update status');
    } finally {
      setTogglingId(null);
    }
  };

  const handleEdit = (guideId: string) => {
    if (onEdit) {
      onEdit(guideId);
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
    <TooltipProvider delayDuration={300}>
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-semibold">Guide Order</h3>
          <div className="flex items-center gap-2">
            {onCreateNew && (
              <Button onClick={onCreateNew} size="sm" variant="default">
                <Plus className="h-4 w-4 mr-1" />
                New Guide
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              size="sm"
              variant="outline"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              Save
            </Button>
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={guides.map((g) => g.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-1">
              {guides.map((guide, index) => (
                <SortableGuideRow
                  key={guide.id}
                  guide={guide}
                  index={index}
                  onTogglePublish={handleTogglePublish}
                  onEdit={handleEdit}
                  togglingId={togglingId}
                  linkedGuides={collections[guide.id] || []}
                  guideTitles={guideTitles}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {guides.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">
            No guides yet
          </p>
        )}
      </div>
    </TooltipProvider>
  );
};
