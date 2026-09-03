-- 007_v1_polish.sql

-- 1. Extend Profiles for Onboarding
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS primary_subject text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS learning_goal text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- 2. Bookmarks Table
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  item_type text NOT NULL, -- 'tutor_response', 'test_question', 'evaluation'
  item_id text NOT NULL,
  title text NOT NULL,
  preview text,
  subject text,
  chapter text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookmarks" ON public.bookmarks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookmarks" ON public.bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks" ON public.bookmarks
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_bookmarks_user_id ON public.bookmarks (user_id);
CREATE INDEX idx_bookmarks_item ON public.bookmarks (item_type, item_id);

-- 3. AI Feedback Table
CREATE TABLE IF NOT EXISTS public.ai_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  content_type text NOT NULL, -- 'tutor_response', 'evaluation', 'test_question'
  content_id text NOT NULL,
  rating text NOT NULL CHECK (rating IN ('helpful', 'unhelpful', 'report')),
  issue_type text,
  comment text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.ai_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own feedback" ON public.ai_feedback
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feedback" ON public.ai_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_ai_feedback_user_id ON public.ai_feedback (user_id);
