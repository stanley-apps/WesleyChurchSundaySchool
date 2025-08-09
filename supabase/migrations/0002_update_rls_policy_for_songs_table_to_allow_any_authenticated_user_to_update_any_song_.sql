-- Drop the existing policy that restricts updates to own songs
DROP POLICY IF EXISTS "Users can update own songs" ON public.songs;

-- Create a new policy that allows any authenticated user to update any song
CREATE POLICY "Authenticated users can update any song" ON public.songs
FOR UPDATE TO authenticated USING (true);