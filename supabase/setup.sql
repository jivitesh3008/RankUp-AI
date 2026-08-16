-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Create the knowledge_chunks table
create table knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  embedding vector(768),
  class text,
  subject text,
  chapter text,
  topic text,
  source text,
  page_number integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create an HNSW index for efficient vector similarity search using cosine distance
create index on knowledge_chunks using hnsw (embedding vector_cosine_ops);

-- Function to match knowledge chunks for RAG
create or replace function match_knowledge_chunks (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  p_class text,
  p_subject text,
  p_chapter text
)
returns table (
  id uuid,
  content text,
  topic text,
  similarity float
)
language sql stable
as $$
  select
    knowledge_chunks.id,
    knowledge_chunks.content,
    knowledge_chunks.topic,
    1 - (knowledge_chunks.embedding <=> query_embedding) as similarity
  from knowledge_chunks
  where 1 - (knowledge_chunks.embedding <=> query_embedding) > match_threshold
    and knowledge_chunks.class = p_class
    and knowledge_chunks.subject = p_subject
    and knowledge_chunks.chapter = p_chapter
  order by knowledge_chunks.embedding <=> query_embedding
  limit match_count;
$$;

-- Global vector search across all chapters for optimized RAG
create or replace function match_knowledge_chunks_global (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  p_class text,
  p_subject text
)
returns table (
  id uuid,
  content text,
  topic text,
  chapter text,
  similarity float
)
language sql stable
as $$
  select
    knowledge_chunks.id,
    knowledge_chunks.content,
    knowledge_chunks.topic,
    knowledge_chunks.chapter,
    1 - (knowledge_chunks.embedding <=> query_embedding) as similarity
  from knowledge_chunks
  where 1 - (knowledge_chunks.embedding <=> query_embedding) > match_threshold
    and knowledge_chunks.class = p_class
    and knowledge_chunks.subject = p_subject
  order by knowledge_chunks.embedding <=> query_embedding
  limit match_count;
$$;

-- Table to store API rate limits
create table if not exists rate_limits (
  ip text primary key,
  request_count int default 1,
  last_request_at timestamp with time zone default timezone('utc'::text, now())
);

-- Function to check and update rate limit atomically
create or replace function check_rate_limit(
  client_ip text,
  max_requests int,
  window_seconds int
)
returns boolean
language plpgsql
as $$
declare
  current_count int;
  last_req timestamp with time zone;
begin
  -- Try to get existing record
  select request_count, last_request_at into current_count, last_req
  from rate_limits
  where ip = client_ip;

  if not found then
    -- First request from this IP
    insert into rate_limits (ip, request_count, last_request_at)
    values (client_ip, 1, now());
    return true;
  end if;

  -- If the window has passed, reset the count
  if extract(epoch from (now() - last_req)) > window_seconds then
    update rate_limits
    set request_count = 1, last_request_at = now()
    where ip = client_ip;
    return true;
  end if;

  -- If within window and under limit, increment
  if current_count < max_requests then
    update rate_limits
    set request_count = request_count + 1, last_request_at = now()
    where ip = client_ip;
    return true;
  end if;

  -- Over limit
  return false;
end;
$$;
