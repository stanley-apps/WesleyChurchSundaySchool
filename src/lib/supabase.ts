import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Song = {
  id: string
  title: string
  lyrics: string
  user_id: string
  created_at: string
  category?: 'sunday_school' | 'vbs' | null
  vbs_day?: number | null
  display_order?: number | null
}

export type Lesson = {
  id: string
  title: string
  description: string | null
  class_level: string | null
  file_url: string
  user_id: string
  created_at: string
}

export type MemoryVerse = {
  id: string
  user_id: string
  verse_text: string
  reference: string
  created_at: string
  hashtags: string[] | null
}

export type Story = {
  id: string
  created_at: string
  user_id: string
  title: string
  description: string | null
  class_level: string | null
  file_url: string
  file_type: string
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  answer_index: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
  topic: string;
  source_reference?: string;
}

export type QuizQuestionMode = 'regular' | 'emoji';

export interface Quiz {
  id: string;
  user_id: string;
  topic: string;
  difficulty: string;
  num_questions: number;
  questions: QuizQuestion[];
  created_at: string;
  status: string;
  ai_model_used?: string;
  generation_metadata?: {
    aiModel: string;
    generationTime: number;
    validationScore: number;
    questionMode?: QuizQuestionMode;
    sourceFileUrl?: string;
    sourceFileType?: string;
  };
}
