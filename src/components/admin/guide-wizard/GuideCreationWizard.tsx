import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Save, Check } from "lucide-react";
import { useGuideCreationWizard } from "@/hooks/admin/useGuideCreationWizard";
import { WizardProgressBar } from "./WizardProgressBar";
import { Step1BasicInfo } from "./steps/Step1BasicInfo";
import { Step2Description } from "./steps/Step2Description";
import { Step3Images } from "./steps/Step3Images";
import { Step4AudioSections } from "./steps/Step4AudioSections";
import { Step5ReviewPublish } from "./steps/Step5ReviewPublish";
import { validateGuideForm, validatePrice } from "@/utils/admin/validation";
import { toast } from "sonner";

interface GuideCreationWizardProps {
  onSuccess: (guide: any) => void;
  onCancel: () => void;
  onSubmit: (data: any) => Promise<void>;
}

const STEPS = [
  { number: 1, title: "Basic Info" },
  { number: 2, title: "Description" },
  { number: 3, title: "Images" },
  { number: 4, title: "Sections" },
  { number: 5, title: "Review" }
];

export function GuideCreationWizard({ onSuccess, onCancel, onSubmit }: GuideCreationWizardProps) {
  const {
    currentStep,
    totalSteps,
    formData,
    isDraft,
    updateFormData,
    nextStep,
    previousStep,
    resetWizard,
    saveDraft,
    loadDraft,
    clearDraft
  } = useGuideCreationWizard();

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.title.trim()) newErrors.title = "Title is required";
      else if (formData.title.length < 10) newErrors.title = "Title must be at least 10 characters";
      else if (formData.title.length > 100) newErrors.title = "Title must be less than 100 characters";
      
      if (!formData.city) newErrors.city = "City is required";
      if (!formData.country) newErrors.country = "Country is required";
      if (!formData.category) newErrors.category = "Category is required";
      if (!formData.difficulty) newErrors.difficulty = "Difficulty is required";
    }

    if (currentStep === 2) {
      if (!formData.description.trim()) newErrors.description = "Description is required";
      else if (formData.description.length < 50) newErrors.description = "Description must be at least 50 characters";
      else if (formData.description.length > 1000) newErrors.description = "Description must be less than 1000 characters";
    }

    if (currentStep === 5) {
      const priceValidation = validatePrice(formData.price);
      if (!priceValidation.isValid) {
        newErrors.price = priceValidation.error || "Invalid price";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      saveDraft();
      nextStep();
    } else {
      toast.error("Please fix the errors before continuing");
    }
  };

  const handlePrevious = () => {
    saveDraft();
    previousStep();
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    setIsSubmitting(true);
    try {
      const submitData = {
        title: formData.title,
        description: formData.description,
        city: formData.city,
        country: formData.country,
        category: formData.category,
        difficulty: formData.difficulty,
        price: parseFloat(formData.price) || 0,
        duration: parseInt(formData.duration) || 0,
        languages: formData.languages,
        image_urls: formData.uploadedImages,
        is_featured: formData.is_featured,
        is_hidden: formData.is_hidden,
        sections: formData.sections
      };

      await onSubmit(submitData);
      clearDraft();
      onSuccess(submitData);
    } catch (error) {
      console.error('Error submitting guide:', error);
      toast.error('Failed to create guide');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    const stepProps = { formData, updateFormData, errors };

    switch (currentStep) {
      case 1:
        return <Step1BasicInfo {...stepProps} />;
      case 2:
        return <Step2Description {...stepProps} />;
      case 3:
        return <Step3Images {...stepProps} />;
      case 4:
        return <Step4AudioSections {...stepProps} />;
      case 5:
        return <Step5ReviewPublish {...stepProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardContent className="p-6">
          <WizardProgressBar
            currentStep={currentStep}
            totalSteps={totalSteps}
            steps={STEPS}
          />

          <div className="min-h-[400px]">
            {renderStep()}
          </div>

          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
              >
                Cancel
              </Button>
              {isDraft && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={saveDraft}
                >
                  <Save className="h-4 w-4 mr-1" />
                  Save Draft
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
              )}
              {currentStep < totalSteps ? (
                <Button onClick={handleNext}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? (
                    "Creating..."
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Create Guide
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
