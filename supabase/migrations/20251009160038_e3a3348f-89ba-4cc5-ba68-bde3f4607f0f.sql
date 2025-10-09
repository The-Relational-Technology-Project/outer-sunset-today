-- Create storage bucket for event flyers
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-flyers', 'event-flyers', false);

-- Create policies for event flyers bucket
CREATE POLICY "Anyone can upload flyers"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'event-flyers');

CREATE POLICY "Admins can view all flyers"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'event-flyers' AND 
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete flyers"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'event-flyers' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create table to track flyer submissions
CREATE TABLE public.flyer_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path TEXT NOT NULL,
  submitter_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  processed BOOLEAN DEFAULT false NOT NULL,
  event_id UUID REFERENCES public.events(id),
  processing_notes TEXT
);

-- Enable RLS on flyer_submissions
ALTER TABLE public.flyer_submissions ENABLE ROW LEVEL SECURITY;

-- Anyone can submit flyers
CREATE POLICY "Anyone can submit flyers"
ON public.flyer_submissions
FOR INSERT
WITH CHECK (true);

-- Admins can view all flyer submissions
CREATE POLICY "Admins can view flyer submissions"
ON public.flyer_submissions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Admins can update flyer submissions (mark as processed)
CREATE POLICY "Admins can update flyer submissions"
ON public.flyer_submissions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Admins can delete flyer submissions
CREATE POLICY "Admins can delete flyer submissions"
ON public.flyer_submissions
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);