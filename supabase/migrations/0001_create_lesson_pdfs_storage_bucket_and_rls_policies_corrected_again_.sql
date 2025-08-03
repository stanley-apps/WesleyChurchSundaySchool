-- Create a storage bucket for lesson PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('lesson_pdfs', 'lesson_pdfs', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload lesson PDFs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'lesson_pdfs' AND auth.uid() IS NOT NULL);

-- Policy to allow everyone to view lesson PDFs
CREATE POLICY "Everyone can view lesson PDFs"
ON storage.objects FOR SELECT
USING (bucket_id = 'lesson_pdfs');

-- Policy to allow authenticated users to delete their own lesson PDFs
CREATE POLICY "Authenticated users can delete their own lesson PDFs"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'lesson_pdfs' AND starts_with(name, auth.uid()::text || '/'));

-- Policy to allow authenticated users to update their own lesson PDFs
CREATE POLICY "Authenticated users can update their own lesson PDFs"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'lesson_pdfs' AND starts_with(name, auth.uid()::text || '/'));