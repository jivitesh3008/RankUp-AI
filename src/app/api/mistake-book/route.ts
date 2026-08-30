import { NextResponse } from 'next/server';
import { createClient as createServerClientLocal } from '@/utils/supabase/server';
import { SCIENCE_CHAPTERS, MATHS_CHAPTERS } from '@/lib/constants';

export async function GET(req: Request) {
  try {
    const supabase = await createServerClientLocal();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const subject = searchParams.get('subject');
    const chapter = searchParams.get('chapter');
    const topic = searchParams.get('topic');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'needs_review'; // 'recent', 'repeated', 'needs_review', 'recently_fixed'

    let query = supabase.from('mistake_book').select('*').eq('user_id', user.id);

    if (subject && subject !== 'All') {
      const allowedChapters = subject === 'Science' ? SCIENCE_CHAPTERS : MATHS_CHAPTERS;
      query = query.in('chapter', allowedChapters);
    }

    if (chapter && chapter !== 'All') query = query.eq('chapter', chapter);
    if (topic && topic !== 'All') query = query.eq('topic', topic);
    if (status && status !== 'All') query = query.eq('status', status.toLowerCase());
    if (category && category !== 'All') query = query.eq('mistake_category', category);

    if (search) {
      query = query.or(`question_text.ilike.%${search}%,mistake_summary.ilike.%${search}%,topic.ilike.%${search}%,chapter.ilike.%${search}%`);
    }

    // Sorting logic
    if (sort === 'needs_review') {
      // Prioritize new/reviewed/practicing over fixed
      // First get non-fixed, then fixed
      // A simple way is to order by status (not perfect since it's alphabetical but works if we separate the query or just rely on a simpler approach)
      // Actually, let's just fetch all and sort in memory if it's small, or use a simpler sort.
      // We will sort by last_reviewed_at nulls first, then created_at.
      query = query.order('last_reviewed_at', { ascending: true, nullsFirst: true }).order('created_at', { ascending: false });
    } else if (sort === 'recent') {
      query = query.order('created_at', { ascending: false });
    } else if (sort === 'repeated') {
      query = query.order('occurrence_count', { ascending: false }).order('created_at', { ascending: false });
    } else if (sort === 'recently_fixed') {
      query = query.eq('status', 'fixed').order('updated_at', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query.limit(50);

    if (error) {
      console.error('Error fetching mistakes:', error);
      return NextResponse.json({ error: 'Failed to fetch mistakes' }, { status: 500 });
    }

    // If sort is needs_review, bring 'fixed' to the bottom in memory since Supabase doesn't support custom ENUM sorting easily without raw SQL.
    let sortedData = data;
    if (sort === 'needs_review') {
      sortedData = data.sort((a, b) => {
        if (a.status === 'fixed' && b.status !== 'fixed') return 1;
        if (a.status !== 'fixed' && b.status === 'fixed') return -1;
        return 0;
      });
    }

    return NextResponse.json({ mistakes: sortedData });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const supabase = await createServerClientLocal();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, status } = await req.json();

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('mistake_book')
      .update({ 
        status, 
        updated_at: new Date().toISOString(),
        ...(status === 'reviewed' ? { last_reviewed_at: new Date().toISOString() } : {})
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating mistake:', error);
      return NextResponse.json({ error: 'Failed to update mistake' }, { status: 500 });
    }

    return NextResponse.json({ mistake: data });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createServerClientLocal();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    
    // Check if mistake already exists for deduplication
    const { data: existing } = await supabase
      .from('mistake_book')
      .select('*')
      .eq('user_id', user.id)
      .eq('chapter', body.chapter)
      .eq('topic', body.topic)
      .eq('question_text', body.question_text)
      .single();

    if (existing) {
      const { data, error } = await supabase
        .from('mistake_book')
        .update({
          occurrence_count: existing.occurrence_count + 1,
          status: existing.status === 'fixed' ? 'practicing' : existing.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();
        
      if (error) throw error;
      return NextResponse.json({ mistake: data, updated: true });
    }

    const { data, error } = await supabase
      .from('mistake_book')
      .insert({
        user_id: user.id,
        question_text: body.question_text,
        student_answer: body.student_answer,
        correct_answer: body.correct_answer,
        chapter: body.chapter,
        topic: body.topic,
        mistake_category: body.mistake_category || null,
        mistake_summary: body.mistake_summary || 'Needs review',
        source_type: body.source_type || 'manual',
        source_id: body.source_id || null,
        status: 'new'
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting mistake:', error);
      return NextResponse.json({ error: 'Failed to insert mistake' }, { status: 500 });
    }

    return NextResponse.json({ mistake: data, created: true });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
