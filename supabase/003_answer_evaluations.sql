-- 003_answer_evaluations.sql

create table if not exists public.answer_evaluations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  question_text text,
  answer_text text,
  chapter text,
  topic text,
  total_marks int,
  estimated_marks numeric,
  percentage numeric,
  confidence text,
  strengths jsonb,
  missing_steps jsonb,
  mistakes jsonb,
  improvement_tips jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.answer_evaluations enable row level security;

create policy "Users can view their own evaluations." on public.answer_evaluations
  for select using (auth.uid() = user_id);

create policy "Users can insert their own evaluations." on public.answer_evaluations
  for insert with check (auth.uid() = user_id);

create index on public.answer_evaluations (user_id);
create index on public.answer_evaluations (created_at);

-- Update permissions just in case
grant usage on schema public to anon, authenticated;
grant all privileges on all tables in schema public to anon, authenticated;
