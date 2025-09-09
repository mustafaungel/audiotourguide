-- Fix audio guides visibility - restore public access to published guides
-- The security hardening accidentally broke public access to audio guides

-- First, let's ensure we have the correct RLS policies for audio_guides
-- Drop any conflicting policies and recreate the essential ones

-- Drop existing policies to start clean
DROP POLICY IF EXISTS "Anyone can view published guides" ON public.audio_guides;
DROP POLICY IF EXISTS "Public can view published guides" ON public.audio_guides;

-- Create the essential policy for public access to published and approved guides
CREATE POLICY "Public can view published approved guides" 
ON public.audio_guides 
FOR SELECT 
TO public
USING (is_published = true AND is_approved = true);

-- Ensure anon and authenticated users can access the table
GRANT SELECT ON public.audio_guides TO anon, authenticated;

-- Also ensure guide_sections are accessible for published guides
DROP POLICY IF EXISTS "Anyone can view sections of published guides" ON public.guide_sections;

CREATE POLICY "Public can view sections of published guides" 
ON public.guide_sections 
FOR SELECT 
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.audio_guides 
    WHERE audio_guides.id = guide_sections.guide_id 
    AND audio_guides.is_published = true 
    AND audio_guides.is_approved = true
  )
);

GRANT SELECT ON public.guide_sections TO anon, authenticated;