-- Create quizzes table
CREATE TABLE public.quizzes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  topic TEXT NOT NULL,
  difficulty TEXT NOT NULL, -- 'easy', 'medium', 'hard', 'extreme'
  num_questions INTEGER NOT NULL,
  questions JSONB NOT NULL, -- Stores the array of quiz questions, emojis, choices, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'draft' NOT NULL, -- 'draft', 'published', 'reviewed'
  ai_model_used TEXT, -- e.g., 'GPT-4', 'Claude-3'
  generation_metadata JSONB -- Stores validation score, generation time, etc.
);

-- Enable RLS (REQUIRED for security)
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

-- Policies for quizzes table
-- Teachers can create their own quizzes
CREATE POLICY "Teachers can create quizzes" ON public.quizzes
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Teachers can view their own quizzes
CREATE POLICY "Teachers can view their own quizzes" ON public.quizzes
FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Authenticated users can view published quizzes
CREATE POLICY "Authenticated users can view published quizzes" ON public.quizzes
FOR SELECT TO authenticated USING (status = 'published');

-- Teachers can update their own quizzes
CREATE POLICY "Teachers can update their own quizzes" ON public.quizzes
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Teachers can delete their own quizzes
CREATE POLICY "Teachers can delete their own quizzes" ON public.quizzes
FOR DELETE TO authenticated USING (auth.uid() = user_id);