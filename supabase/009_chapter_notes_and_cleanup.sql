-- Clean up revision_sessions since Quick Revision is removed
DROP TABLE IF EXISTS public.revision_sessions CASCADE;

-- Create shared chapter_notes table
CREATE TABLE IF NOT EXISTS public.chapter_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  chapter text NOT NULL,
  title text NOT NULL,
  overview text NOT NULL,
  sections jsonb NOT NULL,
  important_formulas jsonb,
  important_equations jsonb,
  common_mistakes jsonb,
  exam_tips jsonb,
  revision_points jsonb,
  version integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(subject, chapter, version)
);

ALTER TABLE public.chapter_notes ENABLE ROW LEVEL SECURITY;

-- Students can read all chapter notes
CREATE POLICY "Anyone can view chapter notes" ON public.chapter_notes
  FOR SELECT USING (true);

-- Only service role / admin can insert/update (RLS bypasses for service role by default)
