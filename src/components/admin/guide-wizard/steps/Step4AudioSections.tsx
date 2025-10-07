import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, GripVertical } from "lucide-react";
import type { WizardFormData } from "@/hooks/admin/useGuideCreationWizard";
import { AudioSectionUploader } from "../AudioSectionUploader";

interface Step4Props {
  formData: WizardFormData;
  updateFormData: (updates: Partial<WizardFormData>) => void;
}

export function Step4AudioSections({ formData, updateFormData }: Step4Props) {
  const addSection = () => {
    updateFormData({
      sections: [
        ...formData.sections,
        { title: '', description: '', audio_url: '', duration_seconds: undefined }
      ]
    });
  };

  const removeSection = (index: number) => {
    updateFormData({
      sections: formData.sections.filter((_, i) => i !== index)
    });
  };

  const updateSection = (index: number, field: string, value: string) => {
    const newSections = [...formData.sections];
    newSections[index] = { ...newSections[index], [field]: value };
    updateFormData({ sections: newSections });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Audio Sections</h2>
        <p className="text-muted-foreground">
          Add sections to organize your guide content. Each section can have its own audio.
        </p>
      </div>

      <div className="space-y-4">
        {formData.sections.map((section, index) => (
          <Card key={index} className="p-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Section {index + 1}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSection(index)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>

              <div>
                <Label>Section Title *</Label>
                <Input
                  value={section.title}
                  onChange={(e) => updateSection(index, 'title', e.target.value)}
                  placeholder="e.g., Introduction to the Colosseum"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={section.description}
                  onChange={(e) => updateSection(index, 'description', e.target.value)}
                  placeholder="Brief description of this section..."
                  className="min-h-[80px]"
                />
              </div>

              <div>
                <Label>Audio File</Label>
                <AudioSectionUploader
                  sectionIndex={index}
                  currentAudioUrl={section.audio_url}
                  currentDuration={section.duration_seconds}
                  onUpload={(audioUrl, duration) => {
                    const newSections = [...formData.sections];
                    newSections[index] = {
                      ...newSections[index],
                      audio_url: audioUrl,
                      duration_seconds: duration,
                    };
                    updateFormData({ sections: newSections });
                  }}
                  onRemove={() => {
                    const newSections = [...formData.sections];
                    newSections[index] = {
                      ...newSections[index],
                      audio_url: '',
                      duration_seconds: undefined,
                    };
                    updateFormData({ sections: newSections });
                  }}
                />
              </div>
            </div>
          </Card>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={addSection}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Section
        </Button>

        {formData.sections.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No sections added yet. Click "Add Section" to get started.
          </p>
        )}
      </div>
    </div>
  );
}
