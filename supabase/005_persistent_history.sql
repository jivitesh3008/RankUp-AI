-- 005_persistent_history.sql

-- 1. Tutor Conversations Table
create table if not exists public.tutor_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  subject text,
  chapter text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.tutor_conversations enable row level security;

create policy "Users can view their own conversations." on public.tutor_conversations
  for select using (auth.uid() = user_id);

create policy "Users can insert their own conversations." on public.tutor_conversations
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own conversations." on public.tutor_conversations
  for update using (auth.uid() = user_id);

create index on public.tutor_conversations (user_id);


-- 2. Tutor Messages Table
create table if not exists public.tutor_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.tutor_conversations on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  role text not null check (role in ('user', 'model')),
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.tutor_messages enable row level security;

create policy "Users can view their own messages." on public.tutor_messages
  for select using (auth.uid() = user_id);

create policy "Users can insert their own messages." on public.tutor_messages
  for insert with check (auth.uid() = user_id);

create index on public.tutor_messages (conversation_id);


-- 3. Extend Test Attempt Questions Table
alter table public.test_attempt_questions add column if not exists question_text text;
alter table public.test_attempt_questions add column if not exists options jsonb;
alter table public.test_attempt_questions add column if not exists student_answer text;
alter table public.test_attempt_questions add column if not exists correct_answer text;
alter table public.test_attempt_questions add column if not exists explanation text;

-- Update permissions just in case
grant usage on schema public to anon, authenticated;
grant all privileges on all tables in schema public to anon, authenticated;
