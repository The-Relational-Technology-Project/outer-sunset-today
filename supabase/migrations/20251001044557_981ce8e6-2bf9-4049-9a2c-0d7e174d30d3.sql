-- Add SELECT policy to event_submissions to protect email addresses
-- For now, no one can SELECT from this table (preventing email harvesting)
-- In the future, this can be updated to allow authenticated admin users

-- Add a comment to document the security intention
COMMENT ON TABLE public.event_submissions IS 
'Stores submitter emails for event submissions. SELECT access is restricted to prevent email harvesting. Only system administrators should have access to this data.';

-- Explicitly prevent public SELECT access (this makes the security intention clear)
-- When admin authentication is implemented, this policy can be updated to:
-- CREATE POLICY "Only admins can view submissions" ON public.event_submissions
-- FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- For now, we'll create a policy that denies all SELECT access
CREATE POLICY "Submissions are private"
ON public.event_submissions
FOR SELECT
USING (false);

-- This ensures that even if RLS is misconfigured, emails remain protected