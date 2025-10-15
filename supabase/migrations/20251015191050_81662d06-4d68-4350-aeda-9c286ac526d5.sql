-- Drop the existing SELECT policy
DROP POLICY IF EXISTS "Admins can view contact submissions" ON public.contact_submissions;

-- Create a more explicit policy that clearly blocks unauthenticated and non-admin users
CREATE POLICY "Only authenticated admins can view contact submissions" 
ON public.contact_submissions 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND has_role(auth.uid(), 'admin'::app_role)
);