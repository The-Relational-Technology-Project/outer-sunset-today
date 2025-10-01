-- Fix search_path for increment_surf_count function
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;