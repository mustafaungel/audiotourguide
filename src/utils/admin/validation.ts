export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateGuideForm = (formData: {
  title?: string;
  city?: string;
  country?: string;
  category?: string;
  price?: string;
}): ValidationResult => {
  const errors: string[] = [];

  if (!formData.title?.trim()) errors.push('Title');
  if (!formData.city?.trim()) errors.push('City');
  if (!formData.country?.trim()) errors.push('Country');
  if (!formData.category?.trim()) errors.push('Category');

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validatePrice = (price: string): {
  isValid: boolean;
  value?: number;
  error?: string;
} => {
  const priceValue = price?.trim() ? parseFloat(price) * 100 : 0;
  
  if (isNaN(priceValue) || priceValue < 0) {
    return {
      isValid: false,
      error: 'Please enter a valid price (0 or greater for free guides)'
    };
  }

  return {
    isValid: true,
    value: priceValue
  };
};

export const validateSections = (sections: any[]): {
  isValid: boolean;
  error?: string;
} => {
  if (sections.length === 0) {
    return { isValid: true };
  }

  const invalidSections = sections.filter(section => !section.title?.trim());
  
  if (invalidSections.length > 0) {
    return {
      isValid: false,
      error: 'All sections must have at least a title'
    };
  }

  return { isValid: true };
};
