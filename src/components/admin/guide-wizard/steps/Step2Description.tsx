import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { WizardFormData } from "@/hooks/admin/useGuideCreationWizard";

interface Step2Props {
  formData: WizardFormData;
  updateFormData: (updates: Partial<WizardFormData>) => void;
  errors: Record<string, string>;
}

export function Step2Description({ formData, updateFormData, errors }: Step2Props) {
  const [generating, setGenerating] = useState(false);

  const generateDescription = async () => {
    if (!formData.city || !formData.title || !formData.category) {
      toast.error('Please complete Step 1 before generating description');
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-guide-description', {
        body: {
          title: formData.title,
          city: formData.city,
          country: formData.country,
          category: formData.category
        }
      });

      if (error) throw error;

      updateFormData({ description: data.description });
      toast.success('Description generated successfully!');
    } catch (error) {
      console.error('Error generating description:', error);
      toast.error('Failed to generate description');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Description</h2>
        <p className="text-muted-foreground">
          Describe what travelers will experience and learn on this tour.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="description">Guide Description *</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={generateDescription}
              disabled={generating}
            >
              <Sparkles className="h-4 w-4 mr-1" />
              {generating ? 'Generating...' : 'AI Generate'}
            </Button>
          </div>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => updateFormData({ description: e.target.value })}
            placeholder="Describe what travelers will experience and learn..."
            className={`min-h-[200px] ${errors.description ? "border-destructive" : ""}`}
          />
          <div className="flex justify-between items-center mt-1">
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description}</p>
            )}
            <span className="text-sm text-muted-foreground ml-auto">
              {formData.description.length}/1000 characters
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            50-500 characters recommended. Use AI generation for inspiration.
          </p>
        </div>
      </div>
    </div>
  );
}
