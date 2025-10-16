-- Add archived field to events table
ALTER TABLE public.events 
ADD COLUMN archived boolean NOT NULL DEFAULT false;

-- Add archived field to flyer_submissions table
ALTER TABLE public.flyer_submissions
ADD COLUMN archived boolean NOT NULL DEFAULT false;

-- Create index for better query performance
CREATE INDEX idx_events_archived ON public.events(archived);
CREATE INDEX idx_flyer_submissions_archived ON public.flyer_submissions(archived);