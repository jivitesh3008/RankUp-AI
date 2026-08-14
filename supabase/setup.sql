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
