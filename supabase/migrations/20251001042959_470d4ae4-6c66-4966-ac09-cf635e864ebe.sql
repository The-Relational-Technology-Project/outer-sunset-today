-- Allow anyone to insert events (for public event submission)
CREATE POLICY "Anyone can submit events"
ON public.events
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Create a table to store event submissions with contact info
CREATE TABLE public.event_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  submitter_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on event_submissions
ALTER TABLE public.event_submissions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert event submissions
CREATE POLICY "Anyone can submit event info"
ON public.event_submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);