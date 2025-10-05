-- Create the 'stories' table (already exists, but including for context of the full script)
-- This part is unchanged and should not cause the error.
CREATE TABLE public.stories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  class_level TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL
);

-- Enable RLS for the 'stories' table (REQUIRED)
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- Policies for 'stories' table (these are correct and unchanged)
CREATE POLICY "Public read access for stories" ON public.stories
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert their own stories" ON public.stories
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stories" ON public.stories
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stories" ON public.stories
FOR DELETE TO authenticated USING (auth.uid() = user_id);


-- Create the 'story_files' storage bucket (already exists, but including for context)
INSERT INTO storage.buckets (id, name, public)
VALUES ('story_files', 'story_files', true);

-- Policies for 'story_files' storage bucket (corrected)
-- Drop existing policies to recreate them with the fix
DROP POLICY IF EXISTS "Authenticated users can read story files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own story files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own story files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own story files" ON storage.objects;

-- Allow authenticated users to read files
CREATE POLICY "Authenticated users can read story files" ON storage.objects
FOR SELECT TO authenticated USING (bucket_id = 'story_files');

-- Allow authenticated users to upload files to their own folder
CREATE POLICY "Users can upload their own story files" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'story_files' AND auth.uid() = ((storage.foldername(name))[1])::uuid);

-- Allow authenticated users to update their own files
CREATE POLICY "Users can update their own story files" ON storage.objects
FOR UPDATE TO authenticated USING (bucket_id = 'story_files' AND auth.uid() = ((storage.foldername(name))[1])::uuid);

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete their own story files" ON storage.objects
FOR DELETE TO authenticated USING (bucket_id = 'story_files' AND auth.uid() = ((storage.foldername(name))[1])::uuid);