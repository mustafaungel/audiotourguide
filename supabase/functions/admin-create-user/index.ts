import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CreateUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  role: z.enum(['traveler', 'content_creator', 'admin']),
  bio: z.string().max(500, 'Bio too long').optional(),
  languages: z.array(z.string()).optional(),
  guideCountry: z.string().optional(),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[ADMIN-CREATE-USER] Starting user creation');

    // Verify admin authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify requester is admin using server-side function
    const { data: isAdmin, error: adminCheckError } = await supabaseClient.rpc('is_admin');
    
    if (adminCheckError) {
      console.error('[ADMIN-CREATE-USER] Admin check error:', adminCheckError);
      throw new Error('Failed to verify admin status');
    }

    if (!isAdmin) {
      console.warn('[ADMIN-CREATE-USER] Unauthorized access attempt');
      throw new Error('Unauthorized: Admin access required');
    }

    console.log('[ADMIN-CREATE-USER] Admin verified');

    // Use service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    );

    // Validate input
    const body = await req.json();
    const validatedData = CreateUserSchema.parse(body);

    console.log('[ADMIN-CREATE-USER] Creating auth user:', { email: validatedData.email, role: validatedData.role });

    // Create user with admin client
    const { data: { user }, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: validatedData.email,
      password: validatedData.password || `TempPass${Math.random().toString(36).slice(2)}!`,
      email_confirm: true,
      user_metadata: { full_name: validatedData.fullName }
    });

    if (authError || !user) {
      console.error('[ADMIN-CREATE-USER] Auth creation error:', authError);
      throw authError ?? new Error('User creation returned no user');
    }

    console.log('[ADMIN-CREATE-USER] Auth user created:', user.id);

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        user_id: user.id,
        email: validatedData.email,
        full_name: validatedData.fullName,
        role: validatedData.role,
        bio: validatedData.bio || null,
        languages_spoken: validatedData.languages || ['English'],
        guide_country: validatedData.guideCountry || null,
        verification_status: validatedData.role === 'content_creator' ? 'pending' : 'unverified'
      });

    if (profileError) {
      console.error('[ADMIN-CREATE-USER] Profile creation error:', profileError);
      // Try to clean up auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(user.id);
      throw profileError;
    }

    console.log('[ADMIN-CREATE-USER] User created successfully:', { id: user.id, email: user.email });

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: { 
          id: user.id, 
          email: user.email,
          full_name: validatedData.fullName,
          role: validatedData.role
        } 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[ADMIN-CREATE-USER] Error:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: 'Validation error', details: error.errors[0].message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: error.message || 'Failed to create user' }),
      { status: error.message?.includes('Unauthorized') ? 403 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
