import { supabase } from '@/integrations/supabase/client';
import { removeBackground, loadImage } from '@/utils/backgroundRemoval';
import { toast } from 'sonner';

export interface LogoGenerationOptions {
  style?: 'modern' | 'classic' | 'minimal';
  theme?: 'audio-tour' | 'travel' | 'tech';
}

export interface GeneratedLogo {
  originalUrl: string;
  processedBlob: Blob;
  faviconBlob: Blob;
  prompt: string;
}

export class LogoGenerationService {
  static async generateLogo(options: LogoGenerationOptions = {}): Promise<GeneratedLogo> {
    try {
      console.log('Starting logo generation...');
      
      // Call our edge function to generate the logo
      const { data, error } = await supabase.functions.invoke('generate-logo', {
        body: options
      });

      if (error) {
        console.error('Logo generation error:', error);
        throw new Error(`Failed to generate logo: ${error.message}`);
      }

      const { base64Image, prompt } = data;
      
      // Convert base64 to blob
      const response = await fetch(base64Image);
      const originalBlob = await response.blob();
      
      // Load as image for processing
      const imageElement = await loadImage(originalBlob);
      
      // Remove background to create transparent version
      console.log('Removing background...');
      const processedBlob = await removeBackground(imageElement);
      
      // Create favicon version (48x48)
      const faviconBlob = await this.createFavicon(processedBlob);
      
      return {
        originalUrl: data.imageUrl,
        processedBlob,
        faviconBlob,
        prompt
      };
      
    } catch (error) {
      console.error('Error in logo generation service:', error);
      throw error;
    }
  }

  static async createFavicon(logoBlob: Blob): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Set favicon size
        canvas.width = 48;
        canvas.height = 48;
        
        // Draw resized logo
        ctx.drawImage(img, 0, 0, 48, 48);
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create favicon blob'));
          }
        }, 'image/png');
      };
      
      img.onerror = () => reject(new Error('Failed to load logo image'));
      img.src = URL.createObjectURL(logoBlob);
    });
  }

  static async uploadLogo(logoBlob: Blob, faviconBlob: Blob): Promise<{
    logoUrl: string;
    faviconUrl: string;
  }> {
    try {
      const timestamp = Date.now();
      
      // Upload main logo
      const logoFileName = `logos/site-logo-${timestamp}.png`;
      const { data: logoData, error: logoError } = await supabase.storage
        .from('guide-images')
        .upload(logoFileName, logoBlob, {
          contentType: 'image/png',
          upsert: true
        });

      if (logoError) {
        throw new Error(`Failed to upload logo: ${logoError.message}`);
      }

      // Upload favicon
      const faviconFileName = `logos/favicon-${timestamp}.png`;
      const { data: faviconData, error: faviconError } = await supabase.storage
        .from('guide-images')
        .upload(faviconFileName, faviconBlob, {
          contentType: 'image/png',
          upsert: true
        });

      if (faviconError) {
        throw new Error(`Failed to upload favicon: ${faviconError.message}`);
      }

      // Get public URLs
      const { data: logoPublicData } = supabase.storage
        .from('guide-images')
        .getPublicUrl(logoFileName);

      const { data: faviconPublicData } = supabase.storage
        .from('guide-images')
        .getPublicUrl(faviconFileName);

      return {
        logoUrl: logoPublicData.publicUrl,
        faviconUrl: faviconPublicData.publicUrl
      };
      
    } catch (error) {
      console.error('Error uploading logo:', error);
      throw error;
    }
  }

  static async updateSiteSettings(logoUrl: string, faviconUrl: string): Promise<void> {
    try {
      // Update logo URL
      const { error: logoError } = await supabase
        .from('site_settings')
        .upsert({
          setting_key: 'site_logo_url',
          setting_value: logoUrl,
          setting_type: 'url',
          description: 'Main site logo URL',
          is_active: true
        });

      if (logoError) {
        throw new Error(`Failed to update logo setting: ${logoError.message}`);
      }

      // Update dark logo URL (same as main logo for now)
      const { error: darkLogoError } = await supabase
        .from('site_settings')
        .upsert({
          setting_key: 'site_logo_dark_url',
          setting_value: logoUrl,
          setting_type: 'url',
          description: 'Dark theme site logo URL',
          is_active: true
        });

      if (darkLogoError) {
        throw new Error(`Failed to update dark logo setting: ${darkLogoError.message}`);
      }

      // Update favicon URL
      const { error: faviconError } = await supabase
        .from('site_settings')
        .upsert({
          setting_key: 'site_favicon_url',
          setting_value: faviconUrl,
          setting_type: 'url',
          description: 'Site favicon URL',
          is_active: true
        });

      if (faviconError) {
        throw new Error(`Failed to update favicon setting: ${faviconError.message}`);
      }

      console.log('Site settings updated successfully');
      
    } catch (error) {
      console.error('Error updating site settings:', error);
      throw error;
    }
  }

  static async generateAndImplementLogo(options: LogoGenerationOptions = {}): Promise<void> {
    try {
      toast.info('Generating your custom logo...');
      
      // Generate logo
      const logo = await this.generateLogo(options);
      
      toast.info('Uploading logo files...');
      
      // Upload logo and favicon
      const { logoUrl, faviconUrl } = await this.uploadLogo(logo.processedBlob, logo.faviconBlob);
      
      toast.info('Updating site settings...');
      
      // Update database settings
      await this.updateSiteSettings(logoUrl, faviconUrl);
      
      // Update favicon in HTML
      this.updateHtmlFavicon(faviconUrl);
      
      toast.success('Custom logo generated and implemented successfully!');
      
      // Force a page refresh to ensure all components pick up the new logo
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('Error in generate and implement logo:', error);
      toast.error(`Failed to generate logo: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  static updateHtmlFavicon(faviconUrl: string): void {
    try {
      // Update existing favicon or create new one
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = faviconUrl;
      
      // Also update apple-touch-icon
      let appleLink = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
      if (!appleLink) {
        appleLink = document.createElement('link');
        appleLink.rel = 'apple-touch-icon';
        document.getElementsByTagName('head')[0].appendChild(appleLink);
      }
      appleLink.href = faviconUrl;
      
      console.log('HTML favicon updated');
      
    } catch (error) {
      console.error('Error updating HTML favicon:', error);
    }
  }
}