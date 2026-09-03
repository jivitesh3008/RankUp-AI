CREATE TABLE IF NOT EXISTS public.revision_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  subject text NOT NULL,
  chapter text NOT NULL,
  topic text,
  content jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.revision_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own revision sessions" ON public.revision_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own revision sessions" ON public.revision_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_revision_sessions_user_id ON public.revision_sessions(user_id);
