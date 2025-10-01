-- Add status field to events table
ALTER TABLE public.events 
ADD COLUMN status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));

-- Add index for faster queries
CREATE INDEX idx_events_status ON public.events(status);

-- Update RLS policy to only show approved events to public
DROP POLICY IF EXISTS "Events are viewable by everyone" ON public.events;

CREATE POLICY "Approved events are viewable by everyone"
ON public.events
FOR SELECT
USING (status = 'approved');

-- Add comment for documentation
COMMENT ON COLUMN public.events.status IS 'Event approval status: pending (awaiting review), approved (live on site), rejected (not shown)';

-- Update existing events to be approved (so they show up)
UPDATE public.events SET status = 'approved' WHERE status = 'pending';