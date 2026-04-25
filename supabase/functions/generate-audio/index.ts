import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const elevenlabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');
    if (!elevenlabsApiKey) {
      throw new Error('ELEVENLABS_API_KEY is not configured');
    }

    const authHeader = req.headers.get('Authorization')!;
    // Auth client with anon key to verify user
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );
    const { data: { user }, error: authError } = await authClient.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Service role client for storage uploads (bypasses RLS)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { text, voiceId, modelId, isPreview } = await req.json();

    if (!text) {
      throw new Error('Text is required');
    }

    // Strip header/title lines that shouldn't be read aloud by TTS
    // Matches patterns like: "Place Name – Section Title" or "Description" at the start
    const stripHeaders = (t: string): string => {
      const lines = t.split('\n');
      let startIdx = 0;
      for (let i = 0; i < Math.min(lines.length, 5); i++) {
        const line = lines[i].trim();
        // Skip empty lines, short title-like lines with dashes, "Description" labels
        if (!line) { startIdx = i + 1; continue; }
        if (line.length < 80 && /[–—]/.test(line)) { startIdx = i + 1; continue; }
        if (/^(Description|Script|Title|Section|Chapter|Introduction)\s*\*?$/i.test(line)) { startIdx = i + 1; continue; }
        if (line.startsWith('*"') || line.startsWith('Description ')) { startIdx = i + 1; continue; }
        break; // First real content line found
      }
      return lines.slice(startIdx).join('\n').trim();
    };

    // Clean TTS-problematic characters before sending to ElevenLabs
    const cleanedText = stripHeaders(text)
      .replace(/[—]/g, ', ').replace(/[–]/g, ', ')
      .replace(/[""]/g, '').replace(/["]/g, '')
      .replace(/^\*"/gm, '').replace(/^Description\s*\*?/im, '')
      .replace(/[ \t]{2,}/g, ' ')
      .trim();

    // Safety: reject overly long scripts (prevents ElevenLabs credit waste)
    if (!isPreview && cleanedText.length > 8000) {
      throw new Error(`Script too long (${cleanedText.length} chars). Maximum 8000 characters per section. Please shorten the script.`);
    }

    // Use default professional voice if not specified
    const selectedVoiceId = voiceId || '9BWtsMINqrJLrRacOk9x'; // Aria voice
    const selectedModelId = modelId || 'eleven_multilingual_v2';

    console.log('Generating audio with ElevenLabs:', { 
      textLength: text.length, 
      voiceId: selectedVoiceId, 
      modelId: selectedModelId,
      isPreview 
    });

    // For preview, limit text to first 200 characters
    const textToConvert = isPreview ? cleanedText.substring(0, 200) + '...' : cleanedText;

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': elevenlabsApiKey,
      },
      body: JSON.stringify({
        text: textToConvert,
        model_id: selectedModelId,
        voice_settings: {
          stability: 0.4,
          similarity_boost: 0.75,
          style: 0.35,
          use_speaker_boost: true,
          speed: 0.95,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', errorText);
      throw new Error(`ElevenLabs API error: ${response.status} ${errorText}`);
    }

    // Get audio buffer and upload to storage
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = new Uint8Array(arrayBuffer);
    
    // Calculate audio duration using MP3 frame analysis
    const duration = calculateMP3Duration(audioBuffer);
    
    // Generate unique filename
    const fileName = `generated-audio-${Date.now()}-${crypto.randomUUID()}.mp3`;
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('guide-audio')
      .upload(fileName, audioBuffer, {
        contentType: 'audio/mpeg',
        cacheControl: '3600'
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error(`Failed to upload audio: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseClient.storage
      .from('guide-audio')
      .getPublicUrl(fileName);

    console.log('Successfully generated and uploaded audio:', { fileName, duration });

    return new Response(JSON.stringify({ 
      audio_url: publicUrl,
      duration_seconds: Math.round(duration),
      voiceId: selectedVoiceId,
      modelId: selectedModelId,
      isPreview,
      generatedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in generate-audio function:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Simple MP3 duration calculation function
function calculateMP3Duration(buffer: Uint8Array): number {
  try {
    // Look for MP3 frame headers to estimate duration
    // This is a simplified calculation based on file size and bitrate
    const fileSize = buffer.length;
    
    // Check for ID3 tag and skip it
    let offset = 0;
    if (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) { // "ID3"
      const tagSize = ((buffer[6] & 0x7f) << 21) | ((buffer[7] & 0x7f) << 14) | ((buffer[8] & 0x7f) << 7) | (buffer[9] & 0x7f);
      offset = tagSize + 10;
    }
    
    // Look for first MP3 frame header
    for (let i = offset; i < buffer.length - 4; i++) {
      if (buffer[i] === 0xFF && (buffer[i + 1] & 0xE0) === 0xE0) {
        // Found frame header, extract info
        const header = (buffer[i] << 24) | (buffer[i + 1] << 16) | (buffer[i + 2] << 8) | buffer[i + 3];
        
        // Extract version, layer, and bitrate
        const version = (header >> 19) & 0x3;
        const layer = (header >> 17) & 0x3;
        const bitrateIndex = (header >> 12) & 0xF;
        const samplingIndex = (header >> 10) & 0x3;
        
        // Standard bitrate table for MPEG-1 Layer III
        const bitrates = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320];
        const sampleRates = [44100, 48000, 32000];
        
        if (bitrateIndex > 0 && bitrateIndex < 15 && samplingIndex < 3) {
          const bitrate = bitrates[bitrateIndex] * 1000; // Convert to bps
          const sampleRate = sampleRates[samplingIndex];
          
          // Estimate duration: (file_size * 8) / bitrate
          const estimatedDuration = (fileSize * 8) / bitrate;
          return Math.max(1, estimatedDuration); // Minimum 1 second
        }
        break;
      }
    }
    
    // Fallback: estimate based on typical TTS bitrate (64kbps)
    const fallbackDuration = (fileSize * 8) / (64 * 1000);
    return Math.max(1, fallbackDuration);
    
  } catch (error) {
    console.error('Error calculating MP3 duration:', error);
    // Fallback to file size estimation
    return Math.max(1, Math.round(buffer.length / 16000)); // Rough estimate
  }
}