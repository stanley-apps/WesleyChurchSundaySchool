-- Create memory_verses table
CREATE TABLE public.memory_verses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  verse_text TEXT NOT NULL,
  reference TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (REQUIRED)
ALTER TABLE public.memory_verses ENABLE ROW LEVEL SECURITY;

-- Policies for memory_verses table
-- Allow authenticated users to read all memory verses
CREATE POLICY "Authenticated users can read all memory verses" ON public.memory_verses
FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to insert their own memory verses
CREATE POLICY "Users can insert their own memory verses" ON public.memory_verses
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to update their own memory verses
CREATE POLICY "Users can update their own memory verses" ON public.memory_verses
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Allow authenticated users to delete their own memory verses
CREATE POLICY "Users can delete their own memory verses" ON public.memory_verses
FOR DELETE TO authenticated USING (auth.uid() = user_id);