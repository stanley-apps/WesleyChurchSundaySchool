/*
  # Setup demo user for Sunday School Hub

  1. Authentication Setup
    - Create demo user with phone number authentication
    - Phone: +1234567890
    - Password: password123

  2. Security
    - Ensure proper authentication configuration
*/

-- Insert demo user into auth.users table
-- Note: In a real Supabase project, you would create this user through the Supabase dashboard
-- or use the Supabase CLI. This is for demonstration purposes.

-- The demo user should be created manually in your Supabase dashboard:
-- 1. Go to Authentication > Users in your Supabase dashboard
-- 2. Click "Add user"
-- 3. Set phone to: +1234567890
-- 4. Set password to: password123
-- 5. Confirm the user (set email_confirmed_at and phone_confirmed_at)

-- For now, we'll create a note in the database about the required setup
CREATE TABLE IF NOT EXISTS setup_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note text NOT NULL,
  created_at timestamptz DEFAULT now()
);

INSERT INTO setup_notes (note) VALUES 
('Demo user required: Phone +1234567890, Password password123 - Create manually in Supabase Auth dashboard');