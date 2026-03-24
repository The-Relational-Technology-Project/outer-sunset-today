
-- Create custom_updates table
CREATE TABLE public.custom_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  is_public boolean NOT NULL DEFAULT false,
  subscriber_count integer NOT NULL DEFAULT 0
);

-- Create custom_update_subscriptions table
CREATE TABLE public.custom_update_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  custom_update_id uuid NOT NULL REFERENCES public.custom_updates(id) ON DELETE CASCADE,
  email text,
  phone text,
  preferred_channel text NOT NULL DEFAULT 'email',
  messaging_opt_in boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  is_creator boolean NOT NULL DEFAULT false
);

-- RLS for custom_updates
ALTER TABLE public.custom_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public updates are viewable by everyone"
  ON public.custom_updates FOR SELECT
  TO public
  USING (is_public = true);

CREATE POLICY "Anyone can insert custom updates"
  ON public.custom_updates FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Service role can manage custom updates"
  ON public.custom_updates FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS for custom_update_subscriptions
ALTER TABLE public.custom_update_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe"
  ON public.custom_update_subscriptions FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Admins can view subscriptions"
  ON public.custom_update_subscriptions FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can manage subscriptions"
  ON public.custom_update_subscriptions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Security definer function to increment subscriber count
CREATE OR REPLACE FUNCTION public.increment_update_subscriber_count(update_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.custom_updates
  SET subscriber_count = subscriber_count + 1
  WHERE id = update_id;
END;
$$;

-- Seed the 5 example updates
INSERT INTO public.custom_updates (description, is_public, subscriber_count) VALUES
  ('Weekly street cleaning reminder for the East side of 48th Ave', true, 0),
  ('Weekly street cleaning reminder for the West side of 48th Ave', true, 0),
  ('Weekly street cleaning reminder for Lincoln Way', true, 0),
  ('Arizmendi Pizza daily menu (specifically: shiitake, portabella and button mushrooms, sesame-ginger-garlic vinaigrette)', true, 0),
  ('Ocean Beach evening (likely to be over 65 degrees at 5pm)', true, 0);
