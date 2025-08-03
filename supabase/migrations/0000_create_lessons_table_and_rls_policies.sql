CREATE TABLE public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  class_level TEXT, -- e.g., 'Preschool', 'Elementary', 'Youth'
  file_url TEXT NOT NULL -- URL to the PDF in Supabase Storage
);

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- Policy to allow everyone to view lessons
CREATE POLICY "Everyone can view lessons"
ON public.lessons FOR SELECT
USING (TRUE);

-- Policy to allow authenticated users to create lessons
CREATE POLICY "Authenticated users can create lessons"
ON public.lessons FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy to allow authenticated users to update their own lessons
CREATE POLICY "Authenticated users can update their own lessons"
ON public.lessons FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

-- Policy to allow authenticated users to delete their own lessons
CREATE POLICY "Authenticated users can delete their own lessons"
ON public.lessons FOR DELETE TO authenticated
USING (auth.uid() = user_id);