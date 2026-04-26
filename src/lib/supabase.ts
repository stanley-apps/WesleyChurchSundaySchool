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
  category?: 'sunday_school' | 'vbs'
  vbs_day?: number
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
  hashtags: string[] | null // New: Add hashtags
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

// New Quiz types
export interface QuizQuestion {
  id: string; // Unique ID for the question
  question: string; // The question text
  options: string[]; // Array of 4 multiple-choice options
  answer_index: number; // Index of the correct answer in the options array (0-3)
  explanation: string; // Short explanation for the answer
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme'; // Difficulty level
  topic: string; // The topic of the question
  source_reference?: string; // Optional reference to the source material (e.g., Bible verse, page number)
}

export interface Quiz {
  id: string;
  user_id: string;
  topic: string;
  difficulty: string;
  num_questions: number;
  questions: QuizQuestion[]; // Array of QuizQuestion objects
  created_at: string;
  status: string; // e.g., 'draft', 'published'
  ai_model_used?: string;
  generation_metadata?: {
    aiModel: string;
    generationTime: number;
    validationScore: number;
    sourceFileUrl?: string;
    sourceFileType?: string;
  };
}