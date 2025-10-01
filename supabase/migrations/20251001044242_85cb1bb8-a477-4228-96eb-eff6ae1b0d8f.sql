-- Create surf_counts table to track daily surf activity
CREATE TABLE public.surf_counts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  surf_date DATE NOT NULL DEFAULT CURRENT_DATE,
  count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(surf_date)
);

-- Enable RLS
ALTER TABLE public.surf_counts ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view surf counts
CREATE POLICY "Surf counts are viewable by everyone"
ON public.surf_counts
FOR SELECT
USING (true);

-- Allow anyone to insert today's count (for initial creation)
CREATE POLICY "Anyone can create today's surf count"
ON public.surf_counts
FOR INSERT
WITH CHECK (surf_date = CURRENT_DATE);

-- Allow anyone to update today's count
CREATE POLICY "Anyone can update today's surf count"
ON public.surf_counts
FOR UPDATE
USING (surf_date = CURRENT_DATE)
WITH CHECK (surf_date = CURRENT_DATE);

-- Create function to increment today's surf count
CREATE OR REPLACE FUNCTION increment_surf_count()
RETURNS INTEGER AS $$
DECLARE
  current_count INTEGER;
BEGIN
  -- Insert or update today's count
  INSERT INTO public.surf_counts (surf_date, count)
  VALUES (CURRENT_DATE, 1)
  ON CONFLICT (surf_date)
  DO UPDATE SET count = surf_counts.count + 1
  RETURNING count INTO current_count;
  
  RETURN current_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;