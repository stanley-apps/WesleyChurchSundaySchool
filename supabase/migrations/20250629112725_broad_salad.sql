/*
  # Create songs table for Sunday School Hub

  1. New Tables
    - `songs`
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `lyrics` (text, required)
      - `created_at` (timestamp)
      - `user_id` (uuid, foreign key to auth.users)

  2. Security
    - Enable RLS on `songs` table
    - Add policies for authenticated users to:
      - Read all songs
      - Create their own songs
      - Update their own songs
      - Delete their own songs

  3. Changes
    - Creates the songs table with proper structure
    - Sets up row level security
    - Adds comprehensive CRUD policies
*/

CREATE TABLE IF NOT EXISTS songs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  lyrics text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to read all songs
CREATE POLICY "Anyone can read songs"
  ON songs
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy to allow authenticated users to create songs
CREATE POLICY "Users can create songs"
  ON songs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own songs
CREATE POLICY "Users can update own songs"
  ON songs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to delete their own songs
CREATE POLICY "Users can delete own songs"
  ON songs
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);