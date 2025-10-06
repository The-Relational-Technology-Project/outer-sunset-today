-- Create table to track best blue score days
CREATE TABLE public.best_blue_days (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blue_date DATE NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.best_blue_days ENABLE ROW LEVEL SECURITY;

-- Everyone can view best blue days
CREATE POLICY "Best blue days are viewable by everyone"
ON public.best_blue_days
FOR SELECT
USING (true);

-- Only allow inserts/deletes for now (you can manage via backend/SQL editor)
CREATE POLICY "Allow insert of best blue days"
ON public.best_blue_days
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow delete of best blue days"
ON public.best_blue_days
FOR DELETE
USING (true);