-- Create events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  event_date DATE NOT NULL,
  event_type TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create daily_menus table
CREATE TABLE public.daily_menus (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant TEXT NOT NULL,
  location TEXT NOT NULL,
  menu_date DATE NOT NULL,
  special_item TEXT NOT NULL,
  category TEXT NOT NULL,
  price TEXT,
  hours TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_menus ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (anyone can view events and menus)
CREATE POLICY "Events are viewable by everyone" 
ON public.events 
FOR SELECT 
USING (true);

CREATE POLICY "Daily menus are viewable by everyone" 
ON public.daily_menus 
FOR SELECT 
USING (true);

-- Create indexes for better query performance
CREATE INDEX idx_events_date ON public.events(event_date);
CREATE INDEX idx_events_start_time ON public.events(start_time);
CREATE INDEX idx_daily_menus_date ON public.daily_menus(menu_date);