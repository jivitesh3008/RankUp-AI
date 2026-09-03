import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { content_type, content_id, rating, issue_type, comment } = body;

    if (!content_type || !content_id || !rating) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('ai_feedback')
      .insert({
        user_id: user.id,
        content_type,
        content_id,
        rating,
        issue_type: issue_type || null,
        comment: comment || null
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ feedback: data });
  } catch (error: any) {
    console.error('Feedback POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
