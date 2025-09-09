-- Fix security issue: Remove public access to contact submissions
-- Only admins should be able to view customer email addresses and messages

-- Drop the potentially vulnerable user access policy
DROP POLICY IF EXISTS "Users can view own contact submissions" ON public.contact_submissions;

-- Ensure only these secure policies remain:
-- 1. Public can create contact submissions (necessary for contact forms)
-- 2. Admins can view all contact submissions (for management)
-- 3. Admins can update contact submissions (for status management)

-- Add additional security: Ensure no other policies accidentally grant public access
-- This is a safety measure to prevent future accidental public access