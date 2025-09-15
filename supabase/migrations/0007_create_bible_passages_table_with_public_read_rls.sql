-- Create bible_passages table
CREATE TABLE public.bible_passages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reference TEXT UNIQUE NOT NULL, -- e.g., "John 3:16"
  context_snippet TEXT NOT NULL, -- 20-30 words
  full_passage_url TEXT, -- Link to Bible Gateway or similar
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (REQUIRED for security)
ALTER TABLE public.bible_passAGES ENABLE ROW LEVEL SECURITY;

-- Policies for bible_passages table
-- Anyone can read bible passages (public access)
CREATE POLICY "Public read access for bible passages" ON public.bible_passages
FOR SELECT USING (true);

-- Only authenticated users can insert new passages (e.g., for admin/curator roles)
CREATE POLICY "Authenticated users can insert bible passages" ON public.bible_passages
FOR INSERT TO authenticated WITH CHECK (true);

-- Only authenticated users can update passages
CREATE POLICY "Authenticated users can update bible passages" ON public.bible_passages
FOR UPDATE TO authenticated USING (true);

-- Only authenticated users can delete passages
CREATE POLICY "Authenticated users can delete bible passages" ON public.bible_passages
FOR DELETE TO authenticated USING (true);

-- Insert some initial data into bible_passages for demonstration
INSERT INTO public.bible_passages (reference, context_snippet, full_passage_url) VALUES
('John 3:16', 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.', 'https://www.biblegateway.com/passage/?search=John+3:16&version=NIV'),
('Matthew 14:13-21', 'Jesus fed five thousand men, besides women and children, with five loaves of bread and two fish.', 'https://www.biblegateway.com/passage/?search=Matthew+14:13-21&version=NIV'),
('Acts 2:1-4', 'When the day of Pentecost came, they were all together in one place. Suddenly a sound like a mighty rushing wind came from heaven.', 'https://www.biblegateway.com/passage/?search=Acts+2:1-4&version=NIV'),
('Genesis 6:9-22', 'Noah was a righteous man, blameless among the people of his time, and he walked faithfully with God. God told Noah to build an ark.', 'https://www.biblegateway.com/passage/?search=Genesis+6:9-22&version=NIV'),
('Daniel 6:1-28', 'Daniel was thrown into the lions'' den because he continued to pray to God. God sent an angel to shut the mouths of the lions.', 'https://www.biblegateway.com/passage/?search=Daniel+6:1-28&version=NIV'),
('Exodus 14:21-22', 'Moses stretched out his hand over the sea, and the Lord drove the sea back with a strong east wind, dividing the water.', 'https://www.biblegateway.com/passage/?search=Exodus+14:21-22&version=NIV');