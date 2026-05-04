CREATE TABLE IF NOT EXISTS public.waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "waitlist_insert" ON public.waitlist FOR INSERT WITH CHECK (true);
