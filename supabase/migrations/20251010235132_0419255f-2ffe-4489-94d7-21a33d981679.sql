-- Update RLS policy for contact_submissions to allow admins to view
DROP POLICY IF EXISTS "Contact submissions are private" ON public.contact_submissions;

CREATE POLICY "Admins can view contact submissions"
ON public.contact_submissions
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Update RLS policy for flyer submissions storage access
CREATE POLICY "Admins can view flyer files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'event-flyers' 
  AND has_role(auth.uid(), 'admin')
);