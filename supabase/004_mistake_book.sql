CREATE TABLE mistake_book (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  student_answer TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  chapter TEXT NOT NULL,
  topic TEXT NOT NULL,
  mistake_category TEXT,
  mistake_summary TEXT,
  source_type TEXT NOT NULL,
  source_id TEXT, -- Some sources might not have UUIDs or might just be strings
  occurrence_count INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'practicing', 'fixed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_reviewed_at TIMESTAMPTZ
);

CREATE INDEX idx_mistake_book_user_id ON mistake_book (user_id);
CREATE INDEX idx_mistake_book_chapter ON mistake_book (chapter);
CREATE INDEX idx_mistake_book_topic ON mistake_book (topic);
CREATE INDEX idx_mistake_book_status ON mistake_book (status);
CREATE INDEX idx_mistake_book_created_at ON mistake_book (created_at);

ALTER TABLE mistake_book ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own mistakes" ON mistake_book
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own mistakes" ON mistake_book
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own mistakes" ON mistake_book
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mistakes" ON mistake_book
  FOR DELETE USING (auth.uid() = user_id);
