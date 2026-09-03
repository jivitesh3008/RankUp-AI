CREATE TABLE short_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  subject TEXT NOT NULL CHECK (subject IN ('Science', 'Mathematics')),
  chapter TEXT NOT NULL,
  topic TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_short_notes_user_id ON short_notes (user_id);
CREATE INDEX idx_short_notes_subject ON short_notes (subject);
CREATE INDEX idx_short_notes_chapter ON short_notes (chapter);
CREATE INDEX idx_short_notes_updated_at ON short_notes (updated_at);

ALTER TABLE short_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own notes" ON short_notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own notes" ON short_notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes" ON short_notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes" ON short_notes
  FOR DELETE USING (auth.uid() = user_id);
