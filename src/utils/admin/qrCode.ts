import QRCode from 'qrcode';
import { supabase } from '@/integrations/supabase/client';

export interface QRCodeOptions {
  width?: number;
  margin?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

export const generateQRCode = async (
  url: string,
  options: QRCodeOptions = {}
): Promise<string> => {
  const defaultOptions = {
    width: 200,
    margin: 2,
    color: {
      dark: '#1e293b',
      light: '#ffffff'
    },
    errorCorrectionLevel: 'H' as const,
    ...options
  };

  return await QRCode.toDataURL(url, defaultOptions);
};

export const generateGuideQRCode = async (guideId: string): Promise<{
  qrCodeUrl: string;
  shareUrl: string;
}> => {
  const baseUrl = window.location.origin;
  const shareUrl = `${baseUrl}/guide/${guideId}`;
  const qrCodeUrl = await generateQRCode(shareUrl);

  return { qrCodeUrl, shareUrl };
};

export const updateGuideWithQRCode = async (
  guideId: string,
  qrCodeUrl: string,
  shareUrl: string
): Promise<void> => {
  const { error } = await supabase
    .from('audio_guides')
    .update({
      qr_code_url: qrCodeUrl,
      share_url: shareUrl
    })
    .eq('id', guideId);

  if (error) {
    console.error('Error updating guide with QR code:', error);
    throw error;
  }
};
