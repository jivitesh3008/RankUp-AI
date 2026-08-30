-- 002_student_accounts.sql

-- 1. Profiles Table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  class_level text default '10',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile." on public.profiles
  for select using (auth.uid() = id);

create policy "Users can insert their own profile." on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on public.profiles
  for update using (auth.uid() = id);

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. Student Activity Table
create table if not exists public.student_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  event_type text not null,
  chapter text,
  topic text,
  metadata_json jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.student_activity enable row level security;

create policy "Users can view their own activity." on public.student_activity
  for select using (auth.uid() = user_id);

create policy "Users can insert their own activity." on public.student_activity
  for insert with check (auth.uid() = user_id);

create index on public.student_activity (user_id);
create index on public.student_activity (created_at);


-- 3. Test Attempts Table
create table if not exists public.test_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  test_type text not null,
  title text,
  subject text,
  total_questions int not null,
  correct_answers int not null,
  score_percentage float not null,
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.test_attempts enable row level security;

create policy "Users can view their own test attempts." on public.test_attempts
  for select using (auth.uid() = user_id);

create policy "Users can insert their own test attempts." on public.test_attempts
  for insert with check (auth.uid() = user_id);

create index on public.test_attempts (user_id);
create index on public.test_attempts (completed_at);


-- 4. Test Attempt Questions Table
create table if not exists public.test_attempt_questions (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid references public.test_attempts on delete cascade not null,
  question_id text,
  chapter text,
  topic text,
  is_correct boolean not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.test_attempt_questions enable row level security;

create policy "Users can view their own test attempt questions." on public.test_attempt_questions
  for select using (
    exists (
      select 1 from public.test_attempts 
      where id = test_attempt_questions.attempt_id 
      and user_id = auth.uid()
    )
  );

create policy "Users can insert their own test attempt questions." on public.test_attempt_questions
  for insert with check (
    exists (
      select 1 from public.test_attempts 
      where id = test_attempt_questions.attempt_id 
      and user_id = auth.uid()
    )
  );

create index on public.test_attempt_questions (attempt_id);

-- Optional: Re-run permissions
grant usage on schema public to anon, authenticated;
grant all privileges on all tables in schema public to anon, authenticated;
