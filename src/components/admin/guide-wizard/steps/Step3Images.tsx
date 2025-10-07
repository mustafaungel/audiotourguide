import { Label } from "@/components/ui/label";
import { ImageUploader } from "@/components/ImageUploader";
import type { WizardFormData } from "@/hooks/admin/useGuideCreationWizard";

interface Step3Props {
  formData: WizardFormData;
  updateFormData: (updates: Partial<WizardFormData>) => void;
}

export function Step3Images({ formData, updateFormData }: Step3Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Images</h2>
        <p className="text-muted-foreground">
          Add images to showcase your guide. The first image will be the primary image.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Guide Images</Label>
          <ImageUploader
            onImagesUploaded={(urls) => updateFormData({ uploadedImages: urls })}
            currentImages={formData.uploadedImages}
            maxImages={5}
          />
          <p className="text-xs text-muted-foreground mt-2">
            Upload up to 5 images. Recommended size: 1200x800px or larger.
          </p>
        </div>
      </div>
    </div>
  );
}
