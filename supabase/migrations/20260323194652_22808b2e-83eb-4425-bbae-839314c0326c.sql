
-- news_items table
CREATE TABLE public.news_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  source_name text NOT NULL,
  source_url text NOT NULL,
  article_hash text UNIQUE NOT NULL,
  summary text,
  category text,
  relevance_score numeric DEFAULT 0,
  is_actionable boolean DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  helpful_count integer NOT NULL DEFAULT 0,
  not_helpful_count integer NOT NULL DEFAULT 0
);

-- RLS
ALTER TABLE public.news_items ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "News items are viewable by everyone"
  ON public.news_items FOR SELECT
  TO public
  USING (true);

-- Service role insert/update (edge function uses service role key)
CREATE POLICY "Service role can insert news items"
  ON public.news_items FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update news items"
  ON public.news_items FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Feedback increment function (public callable, but only increments counts)
CREATE OR REPLACE FUNCTION public.increment_news_feedback(item_id uuid, feedback_type text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF feedback_type = 'helpful' THEN
    UPDATE public.news_items SET helpful_count = helpful_count + 1 WHERE id = item_id;
  ELSIF feedback_type = 'not_helpful' THEN
    UPDATE public.news_items SET not_helpful_count = not_helpful_count + 1 WHERE id = item_id;
  ELSE
    RAISE EXCEPTION 'Invalid feedback type: %', feedback_type;
  END IF;
END;
$$;
