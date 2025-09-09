-- Add email tracking columns to user_purchases table
ALTER TABLE public.user_purchases 
ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_error TEXT;