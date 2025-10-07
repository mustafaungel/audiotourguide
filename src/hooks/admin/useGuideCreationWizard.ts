import { useState, useCallback } from 'react';

export interface WizardFormData {
  title: string;
  city: string;
  country: string;
  category: string;
  difficulty: string;
  description: string;
  languages: string[];
  price: string;
  duration: string;
  is_featured: boolean;
  is_hidden: boolean;
  sections: Array<{
    title: string;
    description: string;
    audio_url: string;
    duration_seconds?: number;
  }>;
  uploadedImages: string[];
}

const INITIAL_FORM_DATA: WizardFormData = {
  title: '',
  city: '',
  country: '',
  category: '',
  difficulty: 'Beginner',
  description: '',
  languages: ['English'],
  price: '0',
  duration: '',
  is_featured: false,
  is_hidden: true,
  sections: [],
  uploadedImages: [],
};

export const useGuideCreationWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<WizardFormData>(INITIAL_FORM_DATA);
  const [isDraft, setIsDraft] = useState(false);

  const totalSteps = 5;

  const updateFormData = useCallback((updates: Partial<WizardFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    setIsDraft(true);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep, totalSteps]);

  const previousStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= totalSteps) {
      setCurrentStep(step);
    }
  }, [totalSteps]);

  const resetWizard = useCallback(() => {
    setCurrentStep(1);
    setFormData(INITIAL_FORM_DATA);
    setIsDraft(false);
  }, []);

  const saveDraft = useCallback(() => {
    localStorage.setItem('admin_guide_draft', JSON.stringify(formData));
    setIsDraft(false);
  }, [formData]);

  const loadDraft = useCallback(() => {
    const draft = localStorage.getItem('admin_guide_draft');
    if (draft) {
      setFormData(JSON.parse(draft));
      return true;
    }
    return false;
  }, []);

  const clearDraft = useCallback(() => {
    localStorage.removeItem('admin_guide_draft');
    setIsDraft(false);
  }, []);

  return {
    currentStep,
    totalSteps,
    formData,
    isDraft,
    updateFormData,
    nextStep,
    previousStep,
    goToStep,
    resetWizard,
    saveDraft,
    loadDraft,
    clearDraft,
  };
};