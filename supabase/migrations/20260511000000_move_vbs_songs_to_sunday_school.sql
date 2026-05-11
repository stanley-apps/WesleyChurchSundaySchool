-- One-time data migration: fold VBS songs into the Sunday School song list.
UPDATE public.songs
SET
  category = 'sunday_school',
  vbs_day = NULL
WHERE category = 'vbs';
