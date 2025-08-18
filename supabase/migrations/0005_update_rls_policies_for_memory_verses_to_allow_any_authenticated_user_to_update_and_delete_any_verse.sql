-- Drop existing UPDATE policy for memory_verses
DROP POLICY IF EXISTS "Users can update their own memory verses" ON public.memory_verses;

-- Create a new UPDATE policy allowing any authenticated user to update any verse
CREATE POLICY "Authenticated users can update any memory verse" ON public.memory_verses 
FOR UPDATE TO authenticated USING (true);

-- Drop existing DELETE policy for memory_verses
DROP POLICY IF EXISTS "Users can delete their own memory verses" ON public.memory_verses;

-- Create a new DELETE policy allowing any authenticated user to delete any verse
CREATE POLICY "Authenticated users can delete any memory verse" ON public.memory_verses 
FOR DELETE TO authenticated USING (true);