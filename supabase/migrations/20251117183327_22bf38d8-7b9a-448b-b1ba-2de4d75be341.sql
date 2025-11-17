-- Fix security issue: Remove overly permissive SELECT policy
-- The edge function uses service role key and bypasses RLS
-- Only admins should be able to view subscriber list
DROP POLICY IF EXISTS "Can view own subscription by token" ON public.newsletter_subscribers;

-- Remove the overly permissive UPDATE policy as well
-- Edge function will use service role key to update
DROP POLICY IF EXISTS "Can unsubscribe using token" ON public.newsletter_subscribers;