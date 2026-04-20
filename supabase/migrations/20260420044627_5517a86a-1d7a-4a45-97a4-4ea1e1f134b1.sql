
-- 1. Events: admin moderation
CREATE POLICY "Admins can update events" ON public.events
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete events" ON public.events
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. best_blue_days: restrict writes to admins
DROP POLICY IF EXISTS "Allow insert of best blue days" ON public.best_blue_days;
DROP POLICY IF EXISTS "Allow delete of best blue days" ON public.best_blue_days;

CREATE POLICY "Only admins can insert best blue days" ON public.best_blue_days
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete best blue days" ON public.best_blue_days
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. surf_counts: remove open public write; rely on SECURITY DEFINER RPC increment_surf_count
DROP POLICY IF EXISTS "Anyone can create today's surf count" ON public.surf_counts;
DROP POLICY IF EXISTS "Anyone can update today's surf count" ON public.surf_counts;

-- 4. user_roles: explicit admin-only write policies (prevent self-grant)
CREATE POLICY "Only admins can insert roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update roles" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
