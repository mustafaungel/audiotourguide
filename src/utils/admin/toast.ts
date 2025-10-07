import { toast } from 'sonner';

export const showSuccessToast = (message: string) => {
  toast.success(message);
};

export const showErrorToast = (message: string) => {
  toast.error(message);
};

export const showGuideCreatedToast = (isHidden: boolean) => {
  if (isHidden) {
    toast.success('Hidden guide created! Only accessible via access link - perfect for private sharing.');
  } else {
    toast.success('Published guide created! Discoverable on main page with payment required. Access link available for direct access.');
  }
};

export const showValidationErrorToast = (missingFields: string[]) => {
  toast.error(`Please fill in the following required fields: ${missingFields.join(', ')}`);
};

export const copyToClipboard = async (text: string, type: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${type} copied to clipboard!`);
  } catch (error) {
    console.error('Failed to copy:', error);
    toast.error('Failed to copy to clipboard');
  }
};
