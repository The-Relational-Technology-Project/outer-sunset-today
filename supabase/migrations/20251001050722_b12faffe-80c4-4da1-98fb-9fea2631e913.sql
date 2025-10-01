-- Create table for contact form submissions
CREATE TABLE public.contact_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  submission_type TEXT NOT NULL DEFAULT 'recurring_event',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to submit contact forms
CREATE POLICY "Anyone can submit contact forms"
ON public.contact_submissions
FOR INSERT
WITH CHECK (true);

-- Keep submissions private (only admins can view)
CREATE POLICY "Contact submissions are private"
ON public.contact_submissions
FOR SELECT
USING (false);