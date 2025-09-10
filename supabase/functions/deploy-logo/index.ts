import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Starting automated logo deployment...')

    // Download the uploaded image from Lovable uploads
    const imageUrl = 'https://lovable.dev/uploads/defa41c5-510e-409e-bb74-7333902f2eb6.png'
    
    console.log('Downloading image from:', imageUrl)
    const imageResponse = await fetch(imageUrl)
    
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.statusText}`)
    }
    
    const imageBlob = await imageResponse.blob()
    const imageBuffer = await imageBlob.arrayBuffer()
    
    console.log('Image downloaded successfully, size:', imageBuffer.byteLength)

    // Generate unique filename
    const timestamp = Date.now()
    const fileName = `company-logo-${timestamp}.png`
    const filePath = `logos/${fileName}`

    // Upload to Supabase storage
    console.log('Uploading to Supabase storage...')
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('guide-images')
      .upload(filePath, imageBuffer, {
        contentType: 'image/png',
        upsert: true
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw uploadError
    }

    console.log('Upload successful:', uploadData)

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('guide-images')
      .getPublicUrl(filePath)

    const logoUrl = publicUrlData.publicUrl
    console.log('Logo URL:', logoUrl)

    // Update site settings for both light and dark logos
    console.log('Updating site settings...')
    
    // Update light theme logo
    const { error: lightLogoError } = await supabase
      .from('site_settings')
      .upsert({
        setting_key: 'site_logo_url',
        setting_value: logoUrl,
        setting_type: 'text',
        description: 'Main site logo URL for light theme',
        is_active: true
      }, { 
        onConflict: 'setting_key'
      })

    if (lightLogoError) {
      console.error('Error updating light logo:', lightLogoError)
      throw lightLogoError
    }

    // Update dark theme logo (same image works for both)
    const { error: darkLogoError } = await supabase
      .from('site_settings')
      .upsert({
        setting_key: 'site_logo_dark_url',
        setting_value: logoUrl,
        setting_type: 'text',
        description: 'Main site logo URL for dark theme',
        is_active: true
      }, { 
        onConflict: 'setting_key'
      })

    if (darkLogoError) {
      console.error('Error updating dark logo:', darkLogoError)
      throw darkLogoError
    }

    // Add deployment flag to prevent re-running
    const { error: flagError } = await supabase
      .from('site_settings')
      .upsert({
        setting_key: 'logo_deployed',
        setting_value: 'true',
        setting_type: 'boolean',
        description: 'Flag indicating logo has been automatically deployed',
        is_active: true
      }, { 
        onConflict: 'setting_key'
      })

    if (flagError) {
      console.error('Error setting deployment flag:', flagError)
      throw flagError
    }

    console.log('Logo deployment completed successfully!')

    return new Response(
      JSON.stringify({
        success: true,
        logoUrl,
        message: 'Logo deployed successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Logo deployment error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})