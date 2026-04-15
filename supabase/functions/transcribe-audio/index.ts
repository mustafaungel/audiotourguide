import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const { audio_url, language } = await req.json();
    if (!audio_url) {
      throw new Error('audio_url is required');
    }

    console.log('Transcribing audio:', { audio_url: audio_url.substring(0, 80), language });

    // Download audio file
    const audioResponse = await fetch(audio_url);
    if (!audioResponse.ok) {
      throw new Error(`Failed to download audio: ${audioResponse.status}`);
    }

    const audioBlob = await audioResponse.blob();

    // Send to OpenAI Whisper API
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.mp3');
    formData.append('model', 'whisper-1');
    if (language) {
      // ISO 639-1 language code for better accuracy
      formData.append('language', language);
    }
    formData.append('response_format', 'text');

    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
      },
      body: formData,
    });

    if (!whisperResponse.ok) {
      const errorText = await whisperResponse.text();
      throw new Error(`Whisper API error: ${whisperResponse.status} ${errorText}`);
    }

    const transcript = await whisperResponse.text();

    // Clean up: add paragraph breaks every 2-3 sentences for readability
    const cleaned = transcript.trim()
      .replace(/([.!?])\s+/g, '$1\n\n')  // paragraph break after each sentence
      .replace(/\n{3,}/g, '\n\n');         // max 2 newlines

    console.log('Transcription complete:', { length: cleaned.length, preview: cleaned.substring(0, 100) });

    return new Response(JSON.stringify({ transcript: cleaned }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Transcription error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
