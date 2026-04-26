-- Add display_order column to songs table
ALTER TABLE songs ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Initialize display_order based on title for existing songs
WITH ordered_songs AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY category, vbs_day ORDER BY title) as row_num
  FROM songs
)
UPDATE songs
SET display_order = ordered_songs.row_num
FROM ordered_songs
WHERE songs.id = ordered_songs.id;