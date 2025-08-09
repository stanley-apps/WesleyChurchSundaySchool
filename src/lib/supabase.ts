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