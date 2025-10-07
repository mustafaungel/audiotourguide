import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, X, AlertCircle } from "lucide-react";
import { useState } from "react";
import type { WizardFormData } from "@/hooks/admin/useGuideCreationWizard";

const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
  'Dutch', 'Russian', 'Chinese', 'Japanese', 'Korean', 'Arabic',
  'Hindi', 'Turkish', 'Greek', 'Swedish', 'Norwegian', 'Danish'
];

interface Step5Props {
  formData: WizardFormData;
  updateFormData: (updates: Partial<WizardFormData>) => void;
  errors: Record<string, string>;
}

export function Step5ReviewPublish({ formData, updateFormData, errors }: Step5Props) {
  const [newLanguage, setNewLanguage] = useState("");

  const addLanguage = () => {
    if (newLanguage && !formData.languages.includes(newLanguage)) {
      updateFormData({
        languages: [...formData.languages, newLanguage]
      });
      setNewLanguage('');
    }
  };

  const removeLanguage = (language: string) => {
    if (language !== 'English') {
      updateFormData({
        languages: formData.languages.filter(l => l !== language)
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Review & Publish</h2>
        <p className="text-muted-foreground">
          Final settings and review your guide before publishing.
        </p>
      </div>

      <div className="space-y-6">
        {/* Summary */}
        <Card className="p-4 bg-muted/50">
          <h3 className="font-semibold mb-3">Guide Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Title:</span>
              <span className="font-medium">{formData.title || 'Not set'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Location:</span>
              <span className="font-medium">
                {formData.city && formData.country
                  ? `${formData.city}, ${formData.country}`
                  : 'Not set'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Category:</span>
              <span className="font-medium">{formData.category || 'Not set'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sections:</span>
              <span className="font-medium">
                {formData.sections.length}
                {formData.sections.some(s => !s.audio_url) && (
                  <AlertCircle className="inline h-3 w-3 ml-1 text-amber-600" />
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Images:</span>
              <span className="font-medium">{formData.uploadedImages.length}</span>
            </div>
          </div>
        </Card>

        <Separator />

        {/* Pricing */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="price">Price (USD) *</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={formData.price}
              onChange={(e) => updateFormData({ price: e.target.value })}
              placeholder="9.99"
              className={errors.price ? "border-destructive" : ""}
            />
            {errors.price && <p className="text-sm text-destructive mt-1">{errors.price}</p>}
            <p className="text-xs text-muted-foreground mt-1">
              Set to 0 for free guides
            </p>
          </div>

          <div>
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              min="0"
              value={formData.duration}
              onChange={(e) => updateFormData({ duration: e.target.value })}
              placeholder="45"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Estimated tour duration
            </p>
          </div>
        </div>

        {/* Languages */}
        <div>
          <Label>Languages Available</Label>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {formData.languages.map((language) => (
                <Badge
                  key={language}
                  variant="secondary"
                  className="flex items-center gap-1 px-2 py-1"
                >
                  {language}
                  {language !== 'English' && (
                    <button
                      type="button"
                      onClick={() => removeLanguage(language)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
            
            <div className="flex gap-2">
              <Select value={newLanguage} onValueChange={setNewLanguage}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Add language" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.filter(lang => !formData.languages.includes(lang)).map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {lang}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addLanguage}
                disabled={!newLanguage}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
          </div>
        </div>

        <Separator />

        {/* Publish Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="is_featured">Featured Guide</Label>
              <p className="text-xs text-muted-foreground">
                Display this guide prominently on the homepage
              </p>
            </div>
            <Switch
              id="is_featured"
              checked={formData.is_featured}
              onCheckedChange={(checked) => updateFormData({ is_featured: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="is_hidden">Hidden Guide</Label>
              <p className="text-xs text-muted-foreground">
                Only accessible via direct link - not shown in public listings
              </p>
            </div>
            <Switch
              id="is_hidden"
              checked={formData.is_hidden}
              onCheckedChange={(checked) => updateFormData({ is_hidden: checked })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
