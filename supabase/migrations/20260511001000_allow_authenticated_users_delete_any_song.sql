-- Duplicate cleanup is an app-level maintenance action, so authenticated users
-- need to be able to delete duplicate song rows regardless of original owner.
DROP POLICY IF EXISTS "Users can delete own songs" ON public.songs;
DROP POLICY IF EXISTS "Authenticated users can delete any song" ON public.songs;

CREATE POLICY "Authenticated users can delete any song"
ON public.songs
FOR DELETE
TO authenticated
USING (true);
