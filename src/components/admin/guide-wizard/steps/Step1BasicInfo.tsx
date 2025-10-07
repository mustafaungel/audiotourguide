import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link2 } from "lucide-react";
import { generateSlugPreview } from "@/lib/slug-utils";
import type { WizardFormData } from "@/hooks/admin/useGuideCreationWizard";

const CATEGORIES = [
  'Historical Sites',
  'Museums & Galleries', 
  'Cultural Tours',
  'Nature & Wildlife',
  'Food & Cuisine',
  'Architecture',
  'Religious Sites',
  'Local Markets',
  'Street Art',
  'Neighborhoods'
];

const DIFFICULTIES = [
  { value: 'Beginner', label: 'Beginner - All ages welcome' },
  { value: 'Intermediate', label: 'Intermediate - Some walking required' },
  { value: 'Advanced', label: 'Advanced - Good fitness needed' }
];

interface Destination {
  id: string;
  name: string;
  city: string;
  country: string;
}

interface Step1Props {
  formData: WizardFormData;
  updateFormData: (updates: Partial<WizardFormData>) => void;
  errors: Record<string, string>;
}

export function Step1BasicInfo({ formData, updateFormData, errors }: Step1Props) {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [slugPreview, setSlugPreview] = useState('');

  useEffect(() => {
    fetchDestinations();
  }, []);

  useEffect(() => {
    const location = formData.city && formData.country ? `${formData.city}, ${formData.country}` : '';
    const preview = generateSlugPreview(formData.title, location);
    setSlugPreview(preview);
  }, [formData.title, formData.city, formData.country]);

  const fetchDestinations = async () => {
    try {
      const { data, error } = await supabase
        .from('destinations')
        .select('id, name, city, country')
        .eq('is_approved', true)
        .order('name');

      if (error) throw error;
      setDestinations(data || []);
    } catch (error) {
      console.error('Error fetching destinations:', error);
      toast.error('Failed to load destinations');
    } finally {
      setLoading(false);
    }
  };

  const handleDestinationChange = (destinationId: string) => {
    const destination = destinations.find(d => d.id === destinationId);
    if (destination) {
      updateFormData({
        city: destination.city,
        country: destination.country
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Basic Information</h2>
        <p className="text-muted-foreground">
          Let's start with the essential details for your audio guide.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Guide Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => updateFormData({ title: e.target.value })}
            placeholder="Enter an engaging title for your guide"
            className={errors.title ? "border-destructive" : ""}
          />
          {errors.title && <p className="text-sm text-destructive mt-1">{errors.title}</p>}
          <p className="text-xs text-muted-foreground mt-1">
            10-100 characters recommended
          </p>
        </div>

        <div>
          <Label htmlFor="destination">Destination *</Label>
          <Select
            value={formData.city && formData.country ? `${formData.city}-${formData.country}` : ""}
            onValueChange={(value) => {
              const destination = destinations.find(d => `${d.city}-${d.country}` === value);
              if (destination) handleDestinationChange(destination.id);
            }}
          >
            <SelectTrigger className={errors.city || errors.country ? "border-destructive" : ""}>
              <SelectValue placeholder={loading ? "Loading destinations..." : "Select destination"} />
            </SelectTrigger>
            <SelectContent>
              {destinations.map((destination) => (
                <SelectItem key={destination.id} value={`${destination.city}-${destination.country}`}>
                  {destination.name} - {destination.city}, {destination.country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(errors.city || errors.country) && (
            <p className="text-sm text-destructive mt-1">Destination is required</p>
          )}
        </div>

        <div>
          <Label className="flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            URL Slug (Auto-generated)
          </Label>
          <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
            <span className="text-sm text-muted-foreground">audiotourguide.app/guide/</span>
            <span className="text-sm font-mono text-foreground">
              {slugPreview || 'enter-title-and-destination'}
            </span>
          </div>
        </div>

        <div>
          <Label htmlFor="category">Category *</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => updateFormData({ category: value })}
          >
            <SelectTrigger className={errors.category ? "border-destructive" : ""}>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && <p className="text-sm text-destructive mt-1">{errors.category}</p>}
        </div>

        <div>
          <Label htmlFor="difficulty">Difficulty Level *</Label>
          <Select
            value={formData.difficulty}
            onValueChange={(value) => updateFormData({ difficulty: value })}
          >
            <SelectTrigger className={errors.difficulty ? "border-destructive" : ""}>
              <SelectValue placeholder="Select difficulty" />
            </SelectTrigger>
            <SelectContent>
              {DIFFICULTIES.map((diff) => (
                <SelectItem key={diff.value} value={diff.value}>
                  {diff.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.difficulty && <p className="text-sm text-destructive mt-1">{errors.difficulty}</p>}
        </div>
      </div>
    </div>
  );
}
